import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

type IsoDate = string;

const toIsoDateUtc = (date: Date): IsoDate => date.toISOString().split('T')[0];

const addDaysUtc = (isoDate: IsoDate, days: number): IsoDate => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDateUtc(date);
};

type SeedCampaign = {
  campaignId: string;
  label?: string;
};

type SeedCreativePattern = {
  name: string;
  adsetId: string;
  adId: string;
  adName: string;
  snapshotId: string;
  creativeId: string;
  prevConv: number;
  lastConv: number;
  spend: number;
};

type SeedSnapshot = {
  id: string;
  creativeId: string;
  contentHash: string;
  headline: string | null;
  primaryText: string | null;
  description: string | null;
  ctaType: string | null;
  destinationUrl: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  videoId: string | null;
  format: string | null;
  isDynamic: boolean;
  headlines: string[] | null;
  primaryTexts: string[] | null;
  descriptions: string[] | null;
  ctaTypes: string[] | null;
  destinationUrls: string[] | null;
};

const safeJsonb = (value: unknown) => (value == null ? null : JSON.stringify(value));

export async function seedMockCreativeLibraryData(pool: Pool, campaigns: SeedCampaign[]) {
  const today = toIsoDateUtc(new Date());
  const start = addDaysUtc(today, -13); // 14 days (prev7 + last7)

  const isoDates: IsoDate[] = [];
  for (let i = 0; i < 14; i++) isoDates.push(addDaysUtc(start, i));

  for (const { campaignId, label } of campaigns) {
    // Two ad sets per campaign (to exercise "onde rodou")
    const adsetA = { id: uuidv4(), name: 'Público aberto (mock)' };
    const adsetB = { id: uuidv4(), name: 'Remarketing (mock)' };

    const snapshotWinner: SeedSnapshot = {
      id: uuidv4(),
      creativeId: `mock_creative_${uuidv4()}`,
      contentHash: `mock_hash_${uuidv4()}`,
      headline: 'Fale com um advogado agora',
      primaryText: 'Entenda seus direitos e tire dúvidas com atendimento rápido no WhatsApp.',
      description: 'Atendimento imediato',
      ctaType: 'WHATSAPP_MESSAGE',
      destinationUrl: 'https://example.com/whatsapp',
      imageUrl: 'https://picsum.photos/seed/mock-winner/600/600',
      thumbnailUrl: 'https://picsum.photos/seed/mock-winner/200/200',
      videoId: null,
      format: 'image',
      isDynamic: true,
      headlines: ['Fale com um advogado agora', 'Direitos do trabalhador: tire dúvidas'],
      primaryTexts: [
        'Entenda seus direitos e tire dúvidas com atendimento rápido no WhatsApp.',
        'Você tem direito? Faça uma avaliação rápida e gratuita.',
      ],
      descriptions: ['Atendimento imediato'],
      ctaTypes: ['WHATSAPP_MESSAGE', 'SEND_MESSAGE'],
      destinationUrls: ['https://example.com/whatsapp', 'https://example.com/landing'],
    };

    const snapshotFatigued: SeedSnapshot = {
      id: uuidv4(),
      creativeId: `mock_creative_${uuidv4()}`,
      contentHash: `mock_hash_${uuidv4()}`,
      headline: 'Rescisão indireta: veja se você tem direito',
      primaryText: 'Clique e fale com um especialista. Avaliação inicial rápida e objetiva.',
      description: 'Atendimento online',
      ctaType: 'SEND_MESSAGE',
      destinationUrl: 'https://example.com/lead',
      imageUrl: 'https://picsum.photos/seed/mock-fatigued/600/600',
      thumbnailUrl: 'https://picsum.photos/seed/mock-fatigued/200/200',
      videoId: null,
      format: 'image',
      isDynamic: false,
      headlines: null,
      primaryTexts: null,
      descriptions: null,
      ctaTypes: null,
      destinationUrls: null,
    };

    const snapshotLoser: SeedSnapshot = {
      id: uuidv4(),
      creativeId: `mock_creative_${uuidv4()}`,
      contentHash: `mock_hash_${uuidv4()}`,
      headline: 'Direitos trabalhistas',
      primaryText: 'Saiba mais sobre seus direitos.',
      description: null,
      ctaType: 'LEARN_MORE',
      destinationUrl: 'https://example.com',
      imageUrl: 'https://picsum.photos/seed/mock-loser/600/600',
      thumbnailUrl: 'https://picsum.photos/seed/mock-loser/200/200',
      videoId: null,
      format: 'image',
      isDynamic: false,
      headlines: null,
      primaryTexts: null,
      descriptions: null,
      ctaTypes: null,
      destinationUrls: null,
    };

    await pool.query(
      `INSERT INTO ad_creative_snapshots
        (id, creative_id, platform, content_hash, headline, primary_text, description, cta_type, destination_url, image_url, thumbnail_url, video_id, format, is_dynamic, headlines, primary_texts, descriptions, cta_types, destination_urls, object_story_spec, asset_feed_spec, raw)
       VALUES
        ($1, $2, 'meta', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb, $18::jsonb, NULL, NULL, NULL),
        ($19, $20, 'meta', $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32::jsonb, $33::jsonb, $34::jsonb, $35::jsonb, $36::jsonb, NULL, NULL, NULL),
        ($37, $38, 'meta', $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50::jsonb, $51::jsonb, $52::jsonb, $53::jsonb, $54::jsonb, NULL, NULL, NULL)
       ON CONFLICT (creative_id, content_hash, platform)
       DO UPDATE SET last_seen_at = NOW()`,
      [
        snapshotWinner.id,
        snapshotWinner.creativeId,
        snapshotWinner.contentHash,
        snapshotWinner.headline,
        snapshotWinner.primaryText,
        snapshotWinner.description,
        snapshotWinner.ctaType,
        snapshotWinner.destinationUrl,
        snapshotWinner.imageUrl,
        snapshotWinner.thumbnailUrl,
        snapshotWinner.videoId,
        snapshotWinner.format,
        snapshotWinner.isDynamic,
        safeJsonb(snapshotWinner.headlines),
        safeJsonb(snapshotWinner.primaryTexts),
        safeJsonb(snapshotWinner.descriptions),
        safeJsonb(snapshotWinner.ctaTypes),
        safeJsonb(snapshotWinner.destinationUrls),
        snapshotFatigued.id,
        snapshotFatigued.creativeId,
        snapshotFatigued.contentHash,
        snapshotFatigued.headline,
        snapshotFatigued.primaryText,
        snapshotFatigued.description,
        snapshotFatigued.ctaType,
        snapshotFatigued.destinationUrl,
        snapshotFatigued.imageUrl,
        snapshotFatigued.thumbnailUrl,
        snapshotFatigued.videoId,
        snapshotFatigued.format,
        snapshotFatigued.isDynamic,
        safeJsonb(snapshotFatigued.headlines),
        safeJsonb(snapshotFatigued.primaryTexts),
        safeJsonb(snapshotFatigued.descriptions),
        safeJsonb(snapshotFatigued.ctaTypes),
        safeJsonb(snapshotFatigued.destinationUrls),
        snapshotLoser.id,
        snapshotLoser.creativeId,
        snapshotLoser.contentHash,
        snapshotLoser.headline,
        snapshotLoser.primaryText,
        snapshotLoser.description,
        snapshotLoser.ctaType,
        snapshotLoser.destinationUrl,
        snapshotLoser.imageUrl,
        snapshotLoser.thumbnailUrl,
        snapshotLoser.videoId,
        snapshotLoser.format,
        snapshotLoser.isDynamic,
        safeJsonb(snapshotLoser.headlines),
        safeJsonb(snapshotLoser.primaryTexts),
        safeJsonb(snapshotLoser.descriptions),
        safeJsonb(snapshotLoser.ctaTypes),
        safeJsonb(snapshotLoser.destinationUrls),
      ]
    );

    const adWinner1: SeedCreativePattern = {
      name: 'winner-a',
      adsetId: adsetA.id,
      adId: `mock_ad_${uuidv4()}`,
      adName: 'Criativo Winner (A)',
      snapshotId: snapshotWinner.id,
      creativeId: snapshotWinner.creativeId,
      prevConv: 2,
      lastConv: 4,
      spend: 12,
    };

    const adWinner2: SeedCreativePattern = {
      name: 'winner-b',
      adsetId: adsetB.id,
      adId: `mock_ad_${uuidv4()}`,
      adName: 'Criativo Winner (B)',
      snapshotId: snapshotWinner.id,
      creativeId: snapshotWinner.creativeId,
      prevConv: 1,
      lastConv: 2,
      spend: 8,
    };

    const adFatigued: SeedCreativePattern = {
      name: 'fatigued',
      adsetId: adsetA.id,
      adId: `mock_ad_${uuidv4()}`,
      adName: 'Criativo em Fadiga',
      snapshotId: snapshotFatigued.id,
      creativeId: snapshotFatigued.creativeId,
      prevConv: 6,
      lastConv: 2,
      spend: 25,
    };

    const adLoser: SeedCreativePattern = {
      name: 'loser',
      adsetId: adsetB.id,
      adId: `mock_ad_${uuidv4()}`,
      adName: 'Criativo sem conversas',
      snapshotId: snapshotLoser.id,
      creativeId: snapshotLoser.creativeId,
      prevConv: 0,
      lastConv: 0,
      spend: 30,
    };

    const ads = [adWinner1, adWinner2, adFatigued, adLoser];

    for (const isoDate of isoDates) {
      const daysFromEnd = Math.round((new Date(`${today}T00:00:00Z`).getTime() - new Date(`${isoDate}T00:00:00Z`).getTime()) / (24 * 60 * 60 * 1000));
      const inLast7 = daysFromEnd <= 6;

      const adsetTotals = new Map<string, { spend: number; conversations: number; impressions: number; clicks: number }>();

      for (const ad of ads) {
        const conversations = inLast7 ? ad.lastConv : ad.prevConv;
        const spend = Number(ad.spend.toFixed(2));
        const impressions = Math.max(300, conversations * 180 + 600);
        const clicks = Math.max(5, Math.round(impressions * 0.018));
        const reach = Math.max(250, Math.round(impressions * 0.78));
        const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
        const cpm = impressions > 0 ? Number(((spend / impressions) * 1000).toFixed(2)) : 0;

        const currentAdset = adsetTotals.get(ad.adsetId) ?? { spend: 0, conversations: 0, impressions: 0, clicks: 0 };
        currentAdset.spend += spend;
        currentAdset.conversations += conversations;
        currentAdset.impressions += impressions;
        currentAdset.clicks += clicks;
        adsetTotals.set(ad.adsetId, currentAdset);

        await pool.query(
          `INSERT INTO ad_creative_metrics
            (id, campaign_id, adset_id, ad_id, ad_name, date, impressions, reach, clicks, spend, messaging_conversations, ctr, cpm, platform, creative_id, creative_snapshot_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6::date, $7, $8, $9, $10, $11, $12, $13, 'meta', $14, $15, NOW(), NOW())
           ON CONFLICT (ad_id, date, platform)
           DO UPDATE SET
             campaign_id = EXCLUDED.campaign_id,
             adset_id = EXCLUDED.adset_id,
             ad_name = EXCLUDED.ad_name,
             impressions = EXCLUDED.impressions,
             reach = EXCLUDED.reach,
             clicks = EXCLUDED.clicks,
             spend = EXCLUDED.spend,
             messaging_conversations = EXCLUDED.messaging_conversations,
             ctr = EXCLUDED.ctr,
             cpm = EXCLUDED.cpm,
             creative_id = EXCLUDED.creative_id,
             creative_snapshot_id = EXCLUDED.creative_snapshot_id,
             updated_at = NOW()`,
          [
            uuidv4(),
            campaignId,
            ad.adsetId,
            ad.adId,
            ad.adName,
            isoDate,
            Math.round(impressions),
            Math.round(reach),
            Math.round(clicks),
            spend,
            conversations,
            ctr,
            cpm,
            ad.creativeId,
            ad.snapshotId,
          ]
        );
      }

      for (const [adsetId, totals] of adsetTotals.entries()) {
        const adsetName = adsetId === adsetA.id ? adsetA.name : adsetB.name;
        const impressions = Math.max(500, Math.round(totals.impressions));
        const clicks = Math.max(5, Math.round(totals.clicks));
        const reach = Math.max(350, Math.round(impressions * 0.8));
        const spend = Number(totals.spend.toFixed(2));
        const conversations = Math.round(totals.conversations);
        const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
        const cpc = clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0;
        const cpm = impressions > 0 ? Number(((spend / impressions) * 1000).toFixed(2)) : 0;
        const frequency = reach > 0 ? Number((impressions / reach).toFixed(2)) : 0;
        const cpl = conversations > 0 ? Number((spend / conversations).toFixed(2)) : 0;

        await pool.query(
          `INSERT INTO adset_metrics
            (id, campaign_id, adset_id, adset_name, date, impressions, reach, clicks, spend, messaging_conversations, ctr, cpc, cpl, cpm, frequency, platform, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'meta', NOW(), NOW())
           ON CONFLICT (adset_id, date, platform)
           DO UPDATE SET
             campaign_id = EXCLUDED.campaign_id,
             adset_name = EXCLUDED.adset_name,
             impressions = EXCLUDED.impressions,
             reach = EXCLUDED.reach,
             clicks = EXCLUDED.clicks,
             spend = EXCLUDED.spend,
             messaging_conversations = EXCLUDED.messaging_conversations,
             ctr = EXCLUDED.ctr,
             cpc = EXCLUDED.cpc,
             cpl = EXCLUDED.cpl,
             cpm = EXCLUDED.cpm,
             frequency = EXCLUDED.frequency,
             updated_at = NOW()`,
          [
            uuidv4(),
            campaignId,
            adsetId,
            adsetName,
            isoDate,
            impressions,
            reach,
            clicks,
            spend,
            conversations,
            ctr,
            cpc,
            cpl,
            cpm,
            frequency,
          ]
        );
      }
    }

    const suffix = label ? ` (${label})` : '';
    // eslint-disable-next-line no-console
    console.log(`✅ Mock creative library seeded for campaign ${campaignId}${suffix}`);
  }
}
