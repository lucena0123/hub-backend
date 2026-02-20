const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const readEnvValue = (env, key) => {
  const regex = new RegExp(`${key}=\"([\\s\\S]*?)\"`, 'm');
  const match = env.match(regex);
  if (match && match[1]) {
    return match[1].replace(/\r?\n/g, '').trim();
  }
  const fallback = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return fallback ? fallback[1].trim() : null;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const uniq = (items) => {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
};

const parseJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const main = async () => {
  const envPath = path.join(__dirname, '..', '.env');
  const env = fs.readFileSync(envPath, 'utf8');
  const accessTokenRaw = readEnvValue(env, 'META_ACCESS_TOKEN');
  const dbUrlRaw = readEnvValue(env, 'DATABASE_URL');

  if (!accessTokenRaw || !dbUrlRaw) {
    console.error('Missing META_ACCESS_TOKEN or DATABASE_URL in backend/.env');
    process.exit(1);
  }

  const accessToken = accessTokenRaw.replace(/\s+/g, '');
  const dbUrl = dbUrlRaw.replace(/\?schema=[^&]+/, '');

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const rows = await client.query(
    `
      SELECT DISTINCT ON (s.id)
        s.id,
        s.image_url,
        s.thumbnail_url,
        s.object_story_spec,
        s.asset_feed_spec,
        c."metaAdAccountId" as account_id,
        m.ad_id
      FROM ad_creative_snapshots s
      JOIN ad_creative_metrics m ON m.creative_snapshot_id = s.id
      JOIN campaigns camp ON camp.id = m.campaign_id
      LEFT JOIN clients c ON c.id = camp."clientId"
      WHERE s.image_url IS NULL OR s.image_url LIKE '%p64x64%'
      ORDER BY s.id, m.date DESC
    `
  );

  if (!rows.rows.length) {
    console.log('No snapshots found to backfill.');
    await client.end();
    return;
  }

  const isLowRes = (url) => typeof url === 'string' && url.includes('p64x64');

  const adAccountCache = new Map();
  const fetchAdAccountId = async (adId) => {
    if (!adId) return null;
    if (adAccountCache.has(adId)) return adAccountCache.get(adId);
    const url = `https://graph.facebook.com/v20.0/${adId}?fields=account_id&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
      adAccountCache.set(adId, null);
      return null;
    }
    const accountId = data.account_id ? String(data.account_id) : null;
    adAccountCache.set(adId, accountId);
    await sleep(80);
    return accountId;
  };

  const payload = [];
  for (const row of rows.rows) {
    const spec = parseJson(row.object_story_spec);
    const asset = parseJson(row.asset_feed_spec);
    const hashes = [];
    const urls = [];

    const pushHash = (value) => {
      if (!value) return;
      const hash = String(value);
      hashes.push(hash);
    };

    const pushUrl = (value) => {
      if (!value || typeof value !== 'string') return;
      urls.push(value);
    };

    const assetImages = Array.isArray(asset?.images) ? asset.images : [];
    for (const img of assetImages) {
      if (img?.hash) pushHash(img.hash);
      pushUrl(img?.url ?? img?.image_url ?? img?.imageUrl ?? null);
    }

    pushHash(spec?.link_data?.image_hash ?? null);
    pushHash(spec?.photo_data?.image_hash ?? null);
    pushHash(spec?.video_data?.image_hash ?? null);
    if (Array.isArray(spec?.child_attachments)) {
      for (const attachment of spec.child_attachments) {
        pushHash(attachment?.image_hash ?? null);
        pushUrl(attachment?.image_url ?? attachment?.picture ?? null);
      }
    }

    pushUrl(spec?.link_data?.picture ?? null);
    pushUrl(spec?.photo_data?.image_url ?? null);
    if (row.thumbnail_url) urls.push(row.thumbnail_url);

    let accountId = row.account_id ? String(row.account_id).replace(/^act_/i, '') : null;
    if (!accountId && row.ad_id) {
      accountId = await fetchAdAccountId(row.ad_id);
    }

    payload.push({
      id: row.id,
      hashes: uniq(hashes),
      urls: uniq(urls),
      thumbnailUrl: row.thumbnail_url,
      accountId,
      imageUrl: row.image_url,
    });
  }

  const payloadByAccount = new Map();
  for (const row of payload) {
    if (!row.accountId) continue;
    if (!payloadByAccount.has(row.accountId)) payloadByAccount.set(row.accountId, []);
    payloadByAccount.get(row.accountId).push(row);
  }

  const fetchHashes = async (accountId, batch) => {
    const url = `https://graph.facebook.com/v20.0/act_${accountId}/adimages?fields=hash,url&hashes=${encodeURIComponent(
      JSON.stringify(batch)
    )}&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error('Meta API error', accountId, data.error || data);
      return;
    }
    const map = new Map();
    for (const item of data.data || []) {
      if (item?.hash && item?.url) {
        map.set(String(item.hash), item.url);
      }
    }
    return map;
  };

  let updated = 0;
  let scanned = 0;
  for (const [accountId, rowsForAccount] of payloadByAccount.entries()) {
    const globalHashes = new Set();
    for (const row of rowsForAccount) {
      for (const hash of row.hashes) globalHashes.add(hash);
    }
    const hashesArray = Array.from(globalHashes);
    const hashToUrl = new Map();

    for (let i = 0; i < hashesArray.length; i += 50) {
      const batch = hashesArray.slice(i, i + 50);
      if (batch.length === 0) continue;
      const map = await fetchHashes(accountId, batch);
      if (map) {
        for (const [hash, url] of map.entries()) hashToUrl.set(hash, url);
      }
      await sleep(120);
    }

    for (const row of rowsForAccount) {
      scanned += 1;
      const resolvedUrls = row.hashes.map((hash) => hashToUrl.get(hash)).filter(Boolean);
      const urls = uniq([...resolvedUrls, ...row.urls, row.imageUrl].filter(Boolean));
      if (!urls.length) continue;

      const nextImageUrl = resolvedUrls[0] || row.imageUrl || row.urls[0] || row.thumbnailUrl || null;
      const shouldUpdateImage =
        !row.imageUrl ||
        isLowRes(row.imageUrl) ||
        (nextImageUrl && row.imageUrl !== nextImageUrl);

      if (shouldUpdateImage) {
        await client.query(
          `
            UPDATE ad_creative_snapshots
            SET image_url = $1,
                raw = jsonb_set(coalesce(raw, '{}'::jsonb), '{__derived,images}', $2::jsonb, true)
            WHERE id = $3
          `,
          [nextImageUrl, JSON.stringify({ urls }), row.id]
        );
        updated += 1;
      } else {
        await client.query(
          `
            UPDATE ad_creative_snapshots
            SET raw = jsonb_set(coalesce(raw, '{}'::jsonb), '{__derived,images}', $1::jsonb, true)
            WHERE id = $2
          `,
          [JSON.stringify({ urls }), row.id]
        );
      }
    }
  }

  console.log(`Backfill concluído. Snapshots atualizados: ${updated}/${scanned}`);
  await client.end();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
