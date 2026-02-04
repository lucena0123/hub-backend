import type { Pool } from 'pg';

export const fetchAdsetNames = async (params: {
  pool: Pool;
  clientId: string;
  start: string;
  end: string;
  campaignId: string | null;
}) => {
  const { pool, clientId, start, end, campaignId } = params;

  const adsetNames = await pool.query(
    `SELECT
      a.adset_id,
      MAX(a.adset_name) as adset_name
    FROM adset_metrics a
    JOIN campaigns c ON c.id = a.campaign_id
    WHERE c."clientId" = $1
      AND a.date >= $2
      AND a.date <= $3
      AND ($4::text IS NULL OR a.campaign_id = $4)
    GROUP BY a.adset_id`,
    [clientId, start, end, campaignId]
  );

  const adsetNameById = new Map<string, string | null>();
  for (const row of adsetNames.rows) {
    adsetNameById.set(String(row.adset_id), row.adset_name || null);
  }

  return adsetNameById;
};

export const fetchCreativeAggRows = async (params: {
  pool: Pool;
  clientId: string;
  start: string;
  end: string;
  campaignId: string | null;
  endMinus6: string;
  endMinus13: string;
}) => {
  const { pool, clientId, start, end, campaignId, endMinus6, endMinus13 } = params;

  const result = await pool.query(
    `WITH creative_agg AS (
      SELECT
        m.creative_snapshot_id,
        MAX(m.creative_id) as creative_id,
        array_agg(DISTINCT c.name) as campaigns,
        array_agg(DISTINCT m.adset_id) FILTER (WHERE m.adset_id IS NOT NULL) as adset_ids,
        COUNT(DISTINCT m.ad_id)::int as ads_count,
        COALESCE(SUM(m.spend), 0) as total_spend,
        COALESCE(SUM(m.messaging_conversations), 0)::int as total_conversations,
        COALESCE(SUM(m.impressions), 0)::int as total_impressions,
        COALESCE(SUM(m.clicks), 0)::int as total_clicks,
        COALESCE(AVG(m.ctr), 0) as avg_ctr,
        COALESCE(AVG(m.cpm), 0) as avg_cpm,
        COALESCE(SUM(m.video_3sec_views), 0)::int as video_3s_views_total,
        COALESCE(SUM(m.video_thruplay), 0)::int as video_thruplay_total,
        COALESCE(AVG(m.hook_rate), 0) as hook_rate_avg,
        COALESCE(AVG(m.hold_rate), 0) as hold_rate_avg,
        COALESCE(SUM(CASE WHEN m.date >= $5 THEN m.spend ELSE 0 END), 0) as spend_last7,
        COALESCE(SUM(CASE WHEN m.date >= $5 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_last7,
        COALESCE(SUM(CASE WHEN m.date >= $6 AND m.date < $5 THEN m.spend ELSE 0 END), 0) as spend_prev7,
        COALESCE(SUM(CASE WHEN m.date >= $6 AND m.date < $5 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_prev7
      FROM ad_creative_metrics m
      JOIN campaigns c ON c.id = m.campaign_id
      WHERE c."clientId" = $1
        AND m.date >= $2
        AND m.date <= $3
        AND ($4::text IS NULL OR m.campaign_id = $4)
        AND m.creative_snapshot_id IS NOT NULL
      GROUP BY m.creative_snapshot_id
    )
    SELECT
      a.creative_snapshot_id,
      a.creative_id,
      s.headline as headline,
      s.primary_text as primary_text,
      s.description as description,
      s.cta_type as cta_type,
      s.destination_url as destination_url,
      s.image_url as image_url,
      s.thumbnail_url as thumbnail_url,
      s.video_id as video_id,
      s.format as format,
      COALESCE(s.is_dynamic, false) as is_dynamic,
      s.headlines as headlines,
      s.primary_texts as primary_texts,
      s.descriptions as descriptions,
      s.cta_types as cta_types,
      s.destination_urls as destination_urls,
      s.captured_at as captured_at,
      s.last_seen_at as last_seen_at,
      a.campaigns,
      a.adset_ids,
      a.ads_count,
      a.total_spend,
      a.total_conversations,
      a.total_impressions,
      a.total_clicks,
      a.avg_ctr,
      a.avg_cpm,
      a.video_3s_views_total,
      a.video_thruplay_total,
      a.hook_rate_avg,
      a.hold_rate_avg,
      a.spend_last7,
      a.conv_last7,
      a.spend_prev7,
      a.conv_prev7
    FROM creative_agg a
    LEFT JOIN ad_creative_snapshots s ON s.id = a.creative_snapshot_id
    ORDER BY a.total_spend DESC`,
    [clientId, start, end, campaignId, endMinus6, endMinus13]
  );

  return result.rows;
};
