import { FastifyPluginAsync } from 'fastify';

const campaignCreativeMetricsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  // Get ad set metrics for a campaign
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/adset-metrics', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;

      const days =
        period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT
          adset_id,
          adset_name,
          SUM(impressions) as total_impressions,
          SUM(reach) as total_reach,
          SUM(clicks) as total_clicks,
          SUM(spend) as total_spend,
          SUM(conversions) as total_conversions,
          SUM(messaging_conversations) as total_messaging_conversations,
          SUM(messaging_first_reply) as total_messaging_first_reply,
          AVG(ctr) as avg_ctr,
          AVG(cpc) as avg_cpc,
          AVG(cpm) as avg_cpm,
          AVG(frequency) as avg_frequency
        FROM adset_metrics
        WHERE campaign_id = $1 AND date >= $2 AND date <= $3
        GROUP BY adset_id, adset_name
        ORDER BY total_spend DESC`,
        [campaignId, start, end]
      );

      const adsets = result.rows.map((row: any) => {
        const spend = parseFloat(row.total_spend) || 0;
        const conversations = parseInt(row.total_messaging_conversations) || 0;
        const cpl = conversations > 0 ? spend / conversations : 0;

        return {
          adsetId: row.adset_id,
          adsetName: row.adset_name,
          totalImpressions: parseInt(row.total_impressions) || 0,
          totalReach: parseInt(row.total_reach) || 0,
          totalClicks: parseInt(row.total_clicks) || 0,
          totalSpend: spend,
          totalConversions: parseInt(row.total_conversions) || 0,
          totalMessagingConversations: conversations,
          totalMessagingFirstReply: parseInt(row.total_messaging_first_reply) || 0,
          avgCtr: parseFloat(row.avg_ctr) || 0,
          avgCpc: parseFloat(row.avg_cpc) || 0,
          avgCpm: parseFloat(row.avg_cpm) || 0,
          avgFrequency: parseFloat(row.avg_frequency) || 0,
          cpl,
        };
      });

      return { campaignId, total: adsets.length, adsets };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch ad set metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get ad/creative metrics for a campaign
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/ad-metrics', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;

      const days =
        period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT
          m.ad_id,
          m.ad_name,
          m.adset_id,
          m.creative_id,
          m.creative_snapshot_id,
          s.headline,
          s.primary_text,
          s.description,
          s.cta_type,
          s.destination_url,
          s.image_url,
          s.thumbnail_url,
          s.video_id,
          s.format,
          s.is_dynamic,
          s.headlines,
          s.primary_texts,
          s.cta_types,
          s.destination_urls,
          s.captured_at as snapshot_captured_at,
          m.total_impressions,
          m.total_reach,
          m.total_clicks,
          m.total_spend,
          m.total_conversions,
          m.total_messaging_conversations,
          m.avg_ctr,
          m.avg_cpm,
          m.total_thruplay,
          m.total_3sec_views,
          m.total_p25,
          m.total_p50,
          m.total_p75,
          m.total_p100
        FROM (
          SELECT
            ad_id,
            ad_name,
            adset_id,
            creative_id,
            creative_snapshot_id,
            SUM(impressions) as total_impressions,
            SUM(reach) as total_reach,
            SUM(clicks) as total_clicks,
            SUM(spend) as total_spend,
            SUM(conversions) as total_conversions,
            SUM(messaging_conversations) as total_messaging_conversations,
            AVG(ctr) as avg_ctr,
            AVG(cpm) as avg_cpm,
            SUM(video_thruplay) as total_thruplay,
            SUM(video_3sec_views) as total_3sec_views,
            SUM(video_p25) as total_p25,
            SUM(video_p50) as total_p50,
            SUM(video_p75) as total_p75,
            SUM(video_p100) as total_p100
          FROM ad_creative_metrics
          WHERE campaign_id = $1 AND date >= $2 AND date <= $3
          GROUP BY ad_id, ad_name, adset_id, creative_id, creative_snapshot_id
        ) m
        LEFT JOIN ad_creative_snapshots s ON s.id = m.creative_snapshot_id
        ORDER BY m.total_spend DESC`,
        [campaignId, start, end]
      );

      const ads = result.rows.map((row: any) => {
        const spend = parseFloat(row.total_spend) || 0;
        const impressions = parseInt(row.total_impressions) || 0;
        const conversations = parseInt(row.total_messaging_conversations) || 0;
        const thruplay = parseInt(row.total_thruplay) || 0;
        const views3sec = parseInt(row.total_3sec_views) || 0;
        const hookRate = impressions > 0 ? (views3sec / impressions) * 100 : 0;
        const holdRate = views3sec > 0 ? (thruplay / views3sec) * 100 : 0;
        const cpl = conversations > 0 ? spend / conversations : 0;

        const creativeSnapshotId = row.creative_snapshot_id || null;
        const creative = creativeSnapshotId
          ? {
              snapshotId: creativeSnapshotId,
              creativeId: row.creative_id || null,
              capturedAt: row.snapshot_captured_at || null,
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
              ctaTypes: row.cta_types || null,
              destinationUrls: row.destination_urls || null,
            }
          : null;

        return {
          adId: row.ad_id,
          adName: row.ad_name,
          adsetId: row.adset_id,
          creativeId: row.creative_id || null,
          creativeSnapshotId,
          creative,
          totalImpressions: impressions,
          totalReach: parseInt(row.total_reach) || 0,
          totalClicks: parseInt(row.total_clicks) || 0,
          totalSpend: spend,
          totalConversions: parseInt(row.total_conversions) || 0,
          totalMessagingConversations: conversations,
          avgCtr: parseFloat(row.avg_ctr) || 0,
          avgCpm: parseFloat(row.avg_cpm) || 0,
          cpl,
          videoThruplay: thruplay,
          video3secViews: views3sec,
          videoP25: parseInt(row.total_p25) || 0,
          videoP50: parseInt(row.total_p50) || 0,
          videoP75: parseInt(row.total_p75) || 0,
          videoP100: parseInt(row.total_p100) || 0,
          hookRate: Number(hookRate.toFixed(2)),
          holdRate: Number(holdRate.toFixed(2)),
        };
      });

      return { campaignId, total: ads.length, ads };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch ad metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default campaignCreativeMetricsRoutes;

