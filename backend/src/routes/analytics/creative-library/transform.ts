import { toStringArray } from '../utils';

export const mapCreativeRows = (params: { rows: any[]; adsetNameById: Map<string, string | null> }) => {
  const { rows, adsetNameById } = params;

  return rows.map((row: any) => {
    const totalSpend = parseFloat(row.total_spend) || 0;
    const totalConversations = parseInt(row.total_conversations) || 0;
    const cpl = totalConversations > 0 ? totalSpend / totalConversations : null;

    const spendLast7 = parseFloat(row.spend_last7) || 0;
    const convLast7 = parseInt(row.conv_last7) || 0;
    const cplLast7 = convLast7 > 0 ? spendLast7 / convLast7 : null;

    const spendPrev7 = parseFloat(row.spend_prev7) || 0;
    const convPrev7 = parseInt(row.conv_prev7) || 0;
    const cplPrev7 = convPrev7 > 0 ? spendPrev7 / convPrev7 : null;

    const conversationsPct = convPrev7 > 0 ? ((convLast7 - convPrev7) / convPrev7) * 100 : null;
    const cplPct = cplPrev7 && cplLast7 ? ((cplLast7 - cplPrev7) / cplPrev7) * 100 : null;

    const adsetIds = toStringArray(row.adset_ids);
    const adsets = adsetIds.map((id) => ({
      adsetId: id,
      adsetName: adsetNameById.get(id) ?? null,
    }));

    return {
      snapshotId: row.creative_snapshot_id,
      creativeId: row.creative_id || null,
      capturedAt: row.captured_at || null,
      lastSeenAt: row.last_seen_at || null,
      headline: row.headline || null,
      primaryText: row.primary_text || null,
      description: row.description || null,
      ctaType: row.cta_type || null,
      destinationUrl: row.destination_url || null,
      imageUrl: row.image_url || null,
      thumbnailUrl: row.thumbnail_url || null,
      videoId: row.video_id || null,
      format: row.format || null,
      isDynamic: Boolean(row.is_dynamic),
      headlines: row.headlines || null,
      primaryTexts: row.primary_texts || null,
      descriptions: row.descriptions || null,
      ctaTypes: row.cta_types || null,
      destinationUrls: row.destination_urls || null,
      campaigns: toStringArray(row.campaigns),
      adsets,
      adsCount: parseInt(row.ads_count) || 0,
      metrics: {
        totalSpend,
        totalConversations,
        totalImpressions: parseInt(row.total_impressions) || 0,
        totalClicks: parseInt(row.total_clicks) || 0,
        avgCtr: parseFloat(row.avg_ctr) || 0,
        avgCpm: parseFloat(row.avg_cpm) || 0,
        cpl,
      },
      recent: {
        spend: spendLast7,
        conversations: convLast7,
        cpl: cplLast7,
      },
      previous: {
        spend: spendPrev7,
        conversations: convPrev7,
        cpl: cplPrev7,
      },
      deltas: {
        conversationsPct,
        cplPct,
      },
    };
  });
};

