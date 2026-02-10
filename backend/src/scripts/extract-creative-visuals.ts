import axios from 'axios';
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

type VisualAttributes = {
  dominantColor: string | null;
  textDetected: boolean;
  edgeDensity: number;
  textDensity: number;
  contrastRatio: number;
  contrastLevel: 'low' | 'medium' | 'high';
  faceDetected: boolean;
  objectDetected: boolean;
  visualStyle: 'text-heavy' | 'image-first' | 'mixed';
  width: number;
  height: number;
  sampledAt: string;
  algorithm: { version: string; notes: string };
};

const prisma = new PrismaClient();

const argValue = (flag: string) => {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
};

const limit = Number.parseInt(argValue('--limit') ?? '25', 10);
const dryRun = process.argv.includes('--dry-run');

const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, limit)) : 25;

const toDataUrl = (buffer: Buffer, contentType: string | undefined) => {
  const type = contentType && contentType.includes('/') ? contentType : 'image/jpeg';
  return `data:${type};base64,${buffer.toString('base64')}`;
};

const main = async () => {
  const snapshots = await prisma.$queryRaw<Array<{ id: string; imageUrl: string | null; thumbnailUrl: string | null }>>`
    SELECT
      id,
      image_url as "imageUrl",
      thumbnail_url as "thumbnailUrl"
    FROM ad_creative_snapshots
    WHERE visual_attributes IS NULL
      AND (image_url IS NOT NULL OR thumbnail_url IS NOT NULL)
    ORDER BY last_seen_at DESC
    LIMIT ${safeLimit}
  `;

  if (snapshots.length === 0) {
    console.log('Nenhum snapshot pendente de atributos visuais.');
    return;
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setContent(`
    <!doctype html>
    <html>
      <body>
        <canvas id="c"></canvas>
        <script>
          window.computeAttributes = async (dataUrl) => {
            const img = new Image();
            img.src = dataUrl;
            await img.decode();

            const maxSize = 256;
            const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
            const width = Math.max(1, Math.floor(img.naturalWidth * scale));
            const height = Math.max(1, Math.floor(img.naturalHeight * scale));

            const canvas = document.getElementById('c');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, width, height);
            const { data } = ctx.getImageData(0, 0, width, height);

            // Dominant color via quantized histogram (16 bins per channel)
            const buckets = new Map();
            const step = 4; // sample every 4th pixel
            for (let i = 0; i < data.length; i += 4 * step) {
              const a = data[i + 3];
              if (a < 64) continue;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const qr = r >> 4;
              const qg = g >> 4;
              const qb = b >> 4;
              const key = (qr << 8) | (qg << 4) | qb;
              buckets.set(key, (buckets.get(key) || 0) + 1);
            }

            let maxKey = null;
            let maxCount = 0;
            buckets.forEach((count, key) => {
              if (count > maxCount) {
                maxCount = count;
                maxKey = key;
              }
            });

            let dominantColor = null;
            if (maxKey !== null) {
              const qr = (maxKey >> 8) & 0x0f;
              const qg = (maxKey >> 4) & 0x0f;
              const qb = maxKey & 0x0f;
              const r = Math.min(255, qr * 16 + 8);
              const g = Math.min(255, qg * 16 + 8);
              const b = Math.min(255, qb * 16 + 8);
              dominantColor = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
            }

            // Text presence heuristic via edge density (Sobel)
            const gray = new Uint8ClampedArray(width * height);
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                gray[y * width + x] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) | 0;
              }
            }

            let edgeCount = 0;
            let total = 0;
            const threshold = 25;
            const hist = new Uint32Array(256);
            for (let y = 1; y < height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                const i = y * width + x;
                const gx =
                  -gray[i - width - 1] - 2 * gray[i - 1] - gray[i + width - 1] +
                  gray[i - width + 1] + 2 * gray[i + 1] + gray[i + width + 1];
                const gy =
                  -gray[i - width - 1] - 2 * gray[i - width] - gray[i - width + 1] +
                  gray[i + width - 1] + 2 * gray[i + width] + gray[i + width + 1];
                const mag = Math.sqrt(gx * gx + gy * gy);
                if (mag > threshold) edgeCount++;
                total++;
                hist[gray[i]]++;
              }
            }

            const edgeDensity = total > 0 ? edgeCount / total : 0;
            const textDetected = edgeDensity > 0.08;
            const textDensity = edgeDensity;

            // Contrast via luminance percentiles (p10/p90)
            const totalPix = hist.reduce((sum, v) => sum + v, 0);
            let p10 = 0;
            let p90 = 255;
            if (totalPix > 0) {
              let acc = 0;
              for (let i = 0; i < 256; i++) {
                acc += hist[i];
                if (acc / totalPix >= 0.1) {
                  p10 = i;
                  break;
                }
              }
              acc = 0;
              for (let i = 255; i >= 0; i--) {
                acc += hist[i];
                if (acc / totalPix >= 0.1) {
                  p90 = i;
                  break;
                }
              }
            }
            const contrastRatio = ((p90 / 255) + 0.05) / ((p10 / 255) + 0.05);
            let contrastLevel = 'low';
            if (contrastRatio >= 3.0) contrastLevel = 'high';
            else if (contrastRatio >= 2.0) contrastLevel = 'medium';

            // Skin-tone heuristic for faces/people presence
            let skinCount = 0;
            let skinSampleTotal = 0;
            const stepSkin = 8;
            for (let i = 0; i < data.length; i += 4 * stepSkin) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const y = 0.299 * r + 0.587 * g + 0.114 * b;
              const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
              const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
              if (y > 60 && cb >= 85 && cb <= 135 && cr >= 135 && cr <= 180) {
                skinCount++;
              }
              skinSampleTotal++;
            }
            const skinRatio = skinSampleTotal > 0 ? skinCount / skinSampleTotal : 0;
            const faceDetected = skinRatio > 0.02 && skinRatio < 0.6;
            const objectDetected = edgeDensity > 0.1;

            let visualStyle = 'mixed';
            if (textDetected && textDensity >= 0.12) visualStyle = 'text-heavy';
            else if (!textDetected && textDensity <= 0.06) visualStyle = 'image-first';

            return {
              dominantColor,
              textDetected,
              edgeDensity,
              textDensity,
              contrastRatio,
              contrastLevel,
              faceDetected,
              objectDetected,
              visualStyle,
              width,
              height,
            };
          };
        </script>
      </body>
    </html>
  `);

  for (const snapshot of snapshots) {
    const url = snapshot.imageUrl || snapshot.thumbnailUrl;
    if (!url) continue;

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        validateStatus: (status) => status >= 200 && status < 300,
      });
      const dataUrl = toDataUrl(Buffer.from(response.data), response.headers?.['content-type']);
      const attrs = await page.evaluate(async (imgDataUrl) => {
        return (window as any).computeAttributes(imgDataUrl);
      }, dataUrl) as {
        dominantColor: string | null;
        textDetected: boolean;
        edgeDensity: number;
        textDensity: number;
        contrastRatio: number;
        contrastLevel: 'low' | 'medium' | 'high';
        faceDetected: boolean;
        objectDetected: boolean;
        visualStyle: 'text-heavy' | 'image-first' | 'mixed';
        width: number;
        height: number;
      };

      const payload: VisualAttributes = {
        dominantColor: attrs.dominantColor,
        textDetected: attrs.textDetected,
        edgeDensity: Number(attrs.edgeDensity.toFixed(4)),
        textDensity: Number(attrs.textDensity.toFixed(4)),
        contrastRatio: Number(attrs.contrastRatio.toFixed(3)),
        contrastLevel: attrs.contrastLevel,
        faceDetected: attrs.faceDetected,
        objectDetected: attrs.objectDetected,
        visualStyle: attrs.visualStyle,
        width: attrs.width,
        height: attrs.height,
        sampledAt: new Date().toISOString(),
        algorithm: {
          version: 'v1.5',
          notes: 'Dominant color (16-bin RGB), text density (Sobel edges), contrast via luminance percentiles, skin-tone heuristic for faces.',
        },
      };

      if (!dryRun) {
        await prisma.$executeRawUnsafe(
          'UPDATE ad_creative_snapshots SET visual_attributes = $2::jsonb WHERE id = $1',
          snapshot.id,
          JSON.stringify(payload)
        );
      }

      console.log(`[ok] ${snapshot.id} -> ${payload.dominantColor ?? 'n/a'} text=${payload.textDetected}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[fail] ${snapshot.id} - ${message}`);
    }
  }

  await browser.close();
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
