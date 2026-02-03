import { FastifyPluginAsync } from 'fastify';

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  // Get ad set metrics for a campaign
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/adset-metrics', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;

      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
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

      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
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
        const creative = creativeSnapshotId ? {
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
        } : null;

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

  // Get a creative snapshot by ID
  fastify.get<{
    Params: { snapshotId: string };
  }>('/api/creative-snapshots/:snapshotId', async (request, reply) => {
    try {
      const { snapshotId } = request.params;

      const result = await pool.query(
        `SELECT
          id,
          creative_id,
          platform,
          content_hash,
          captured_at,
          last_seen_at,
          headline,
          primary_text,
          description,
          cta_type,
          destination_url,
          image_url,
          thumbnail_url,
          video_id,
          format,
          is_dynamic,
          headlines,
          primary_texts,
          descriptions,
          cta_types,
          destination_urls,
          object_story_spec,
          asset_feed_spec
        FROM ad_creative_snapshots
        WHERE id = $1
        LIMIT 1`,
        [snapshotId]
      );

      if (result.rows.length === 0) {
        reply.status(404);
        return { error: 'Creative snapshot not found' };
      }

      const row = result.rows[0] as any;
      return {
        snapshotId: row.id,
        creativeId: row.creative_id,
        platform: row.platform,
        contentHash: row.content_hash,
        capturedAt: row.captured_at,
        lastSeenAt: row.last_seen_at,
        headline: row.headline,
        primaryText: row.primary_text,
        description: row.description,
        ctaType: row.cta_type,
        destinationUrl: row.destination_url,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        videoId: row.video_id,
        format: row.format,
        isDynamic: Boolean(row.is_dynamic),
        headlines: row.headlines,
        primaryTexts: row.primary_texts,
        descriptions: row.descriptions,
        ctaTypes: row.cta_types,
        destinationUrls: row.destination_urls,
        objectStorySpec: row.object_story_spec,
        assetFeedSpec: row.asset_feed_spec,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch creative snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // List snapshots for a creative
  fastify.get<{
    Params: { creativeId: string };
    Querystring: { limit?: string };
  }>('/api/creatives/:creativeId/snapshots', async (request, reply) => {
    try {
      const { creativeId } = request.params;
      const limit = Math.max(1, Math.min(200, Number.parseInt(request.query.limit || '50', 10) || 50));

      const result = await pool.query(
        `SELECT
          id,
          creative_id,
          platform,
          content_hash,
          captured_at,
          last_seen_at,
          headline,
          primary_text,
          description,
          cta_type,
          destination_url,
          image_url,
          thumbnail_url,
          video_id,
          format,
          is_dynamic
        FROM ad_creative_snapshots
        WHERE creative_id = $1
        ORDER BY captured_at DESC
        LIMIT $2`,
        [creativeId, limit]
      );

      const snapshots = result.rows.map((row: any) => ({
        snapshotId: row.id,
        creativeId: row.creative_id,
        platform: row.platform,
        contentHash: row.content_hash,
        capturedAt: row.captured_at,
        lastSeenAt: row.last_seen_at,
        headline: row.headline,
        primaryText: row.primary_text,
        description: row.description,
        ctaType: row.cta_type,
        destinationUrl: row.destination_url,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        videoId: row.video_id,
        format: row.format,
        isDynamic: Boolean(row.is_dynamic),
      }));

      return { creativeId, total: snapshots.length, snapshots };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to list creative snapshots',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Breakdowns endpoint
  fastify.get<{
    Params: { campaignId: string; type: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/breakdowns/:type', async (request, reply) => {
    try {
      const { campaignId, type } = request.params;
      const validTypes = ['age_gender', 'platform_position', 'device'];
      if (!validTypes.includes(type)) {
        reply.status(400);
        return { error: `Invalid breakdown type. Valid types: ${validTypes.join(', ')}` };
      }

      const { period = '30d', startDate, endDate } = request.query;
      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT breakdown_data, date, total_spend, total_impressions, total_conversions
         FROM metrics_breakdowns
         WHERE campaign_id = $1 AND breakdown_type = $2 AND date >= $3 AND date <= $4
         ORDER BY date DESC`,
        [campaignId, type, start, end]
      );

      const segmentMap = new Map<string, { label: string; impressions: number; clicks: number; spend: number; reach: number; conversions: number }>();

      for (const row of result.rows) {
        const segments = typeof row.breakdown_data === 'string' ? JSON.parse(row.breakdown_data) : row.breakdown_data;
        for (const seg of segments) {
          const key = seg.label || 'unknown';
          const existing = segmentMap.get(key) || { label: key, impressions: 0, clicks: 0, spend: 0, reach: 0, conversions: 0 };
          existing.impressions += seg.impressions || 0;
          existing.clicks += seg.clicks || 0;
          existing.spend += seg.spend || 0;
          existing.reach += seg.reach || 0;
          existing.conversions += seg.messaging_conversations || 0;
          segmentMap.set(key, existing);
        }
      }

      const segments = Array.from(segmentMap.values())
        .map(seg => ({
          ...seg,
          ctr: seg.impressions > 0 ? (seg.clicks / seg.impressions) * 100 : 0,
          cpm: seg.impressions > 0 ? (seg.spend / seg.impressions) * 1000 : 0,
          shareOfSpend: 0,
        }))
        .sort((a, b) => b.spend - a.spend);

      const totalSpend = segments.reduce((s, seg) => s + seg.spend, 0);
      for (const seg of segments) {
        seg.shareOfSpend = totalSpend > 0 ? (seg.spend / totalSpend) * 100 : 0;
      }

      return {
        campaignId,
        breakdownType: type,
        total: segments.length,
        segments,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch breakdown data',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Temporal analysis endpoint
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/temporal-analysis', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;
      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const dowResult = await pool.query(
        `SELECT
          EXTRACT(DOW FROM date) as day_of_week,
          SUM(impressions) as total_impressions,
          SUM(clicks) as total_clicks,
          SUM(spend) as total_spend,
          SUM(conversions) as total_conversions,
          SUM(messaging_conversations) as total_conversations,
          AVG(ctr) as avg_ctr,
          AVG(cpm) as avg_cpm,
          COUNT(*) as days_count
        FROM campaign_metrics
        WHERE campaign_id = $1 AND date >= $2 AND date <= $3
        GROUP BY EXTRACT(DOW FROM date)
        ORDER BY EXTRACT(DOW FROM date)`,
        [campaignId, start, end]
      );

      const dayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

      const byDayOfWeek = dowResult.rows.map((row: any) => {
        const dow = parseInt(row.day_of_week);
        const spend = parseFloat(row.total_spend) || 0;
        const conversations = parseInt(row.total_conversations) || 0;
        const cpl = conversations > 0 ? spend / conversations : 0;

        return {
          dayOfWeek: dow,
          dayName: dayNames[dow],
          totalImpressions: parseInt(row.total_impressions) || 0,
          totalClicks: parseInt(row.total_clicks) || 0,
          totalSpend: spend,
          totalConversions: parseInt(row.total_conversions) || 0,
          totalConversations: conversations,
          avgCtr: parseFloat(row.avg_ctr) || 0,
          avgCpm: parseFloat(row.avg_cpm) || 0,
          cpl,
          daysCount: parseInt(row.days_count) || 0,
        };
      });

      const sortedByConversions = [...byDayOfWeek].sort((a, b) => b.totalConversations - a.totalConversations);
      const sortedByCpl = [...byDayOfWeek].filter(d => d.cpl > 0).sort((a, b) => a.cpl - b.cpl);

      return {
        campaignId,
        byDayOfWeek,
        bestDay: sortedByConversions[0]?.dayName || null,
        worstDay: sortedByConversions[sortedByConversions.length - 1]?.dayName || null,
        cheapestDay: sortedByCpl[0]?.dayName || null,
        mostExpensiveDay: sortedByCpl[sortedByCpl.length - 1]?.dayName || null,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch temporal analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Business metrics endpoint (CAC, LTV)
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/business-metrics', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;
      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const metricsResult = await pool.query(
        `SELECT SUM(spend) as total_spend, SUM(conversions) as total_conversions,
                SUM(messaging_conversations) as total_conversations
         FROM campaign_metrics
         WHERE campaign_id = $1 AND date >= $2 AND date <= $3`,
        [campaignId, start, end]
      );

      const totalSpend = parseFloat(metricsResult.rows[0]?.total_spend) || 0;
      const totalConversations = parseInt(metricsResult.rows[0]?.total_conversations) || 0;

      const leadResult = await pool.query(
        `SELECT SUM(contracts_closed) as total_contracts,
                SUM(revenue_generated) as total_revenue,
                AVG(average_ticket) as avg_ticket
         FROM campaign_lead_tracking
         WHERE campaign_id = $1 AND date >= $2 AND date <= $3`,
        [campaignId, start, end]
      );

      const totalContracts = parseInt(leadResult.rows[0]?.total_contracts) || 0;
      const totalRevenue = parseFloat(leadResult.rows[0]?.total_revenue) || 0;
      const avgTicket = parseFloat(leadResult.rows[0]?.avg_ticket) || 0;

      const campaignResult = await pool.query(
        `SELECT c.avg_client_lifetime_months, c.avg_monthly_revenue_per_client
         FROM campaigns camp
         JOIN clients c ON camp.client_id = c.id
         WHERE camp.id = $1`,
        [campaignId]
      );

      const lifetimeMonths = parseFloat(campaignResult.rows[0]?.avg_client_lifetime_months) || 12;
      const monthlyRevenue = parseFloat(campaignResult.rows[0]?.avg_monthly_revenue_per_client) || avgTicket;

      const cac = totalContracts > 0 ? totalSpend / totalContracts : 0;
      const ltv = monthlyRevenue * lifetimeMonths;
      const ltvCacRatio = cac > 0 ? ltv / cac : 0;
      const costPerLead = totalConversations > 0 ? totalSpend / totalConversations : 0;
      const conversionRate = totalConversations > 0 ? (totalContracts / totalConversations) * 100 : 0;
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

      let ltvCacHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
      if (ltvCacRatio >= 5) ltvCacHealth = 'excellent';
      else if (ltvCacRatio >= 3) ltvCacHealth = 'good';
      else if (ltvCacRatio >= 2) ltvCacHealth = 'fair';

      return {
        campaignId,
        totalSpend,
        totalConversations,
        totalContracts,
        totalRevenue,
        avgTicket,
        cac,
        costPerLead,
        conversionRate,
        ltv,
        ltvCacRatio: Number(ltvCacRatio.toFixed(2)),
        ltvCacHealth,
        roi: Number(roi.toFixed(2)),
        config: {
          lifetimeMonths,
          monthlyRevenue,
        },
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch business metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default analyticsRoutes;
