import { FastifyPluginAsync } from 'fastify';

const breakdownsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

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
      const days =
        period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT breakdown_data, date, total_spend, total_impressions, total_conversions
         FROM metrics_breakdowns
         WHERE campaign_id = $1 AND breakdown_type = $2 AND date >= $3 AND date <= $4
         ORDER BY date DESC`,
        [campaignId, type, start, end]
      );

      const segmentMap = new Map<
        string,
        { label: string; impressions: number; clicks: number; spend: number; reach: number; conversions: number }
      >();

      for (const row of result.rows) {
        const segments = typeof row.breakdown_data === 'string' ? JSON.parse(row.breakdown_data) : row.breakdown_data;
        for (const seg of segments) {
          const key = seg.label || 'unknown';
          const existing = segmentMap.get(key) || {
            label: seg.label || key,
            impressions: 0,
            clicks: 0,
            spend: 0,
            reach: 0,
            conversions: 0,
          };

          existing.impressions += Number(seg.impressions) || 0;
          existing.clicks += Number(seg.clicks) || 0;
          existing.spend += Number(seg.spend) || 0;
          existing.reach += Number(seg.reach) || 0;
          existing.conversions += Number(seg.conversions) || 0;

          segmentMap.set(key, existing);
        }
      }

      const segments = Array.from(segmentMap.values()).map((seg) => ({
        ...seg,
        ctr: seg.impressions > 0 ? (seg.clicks / seg.impressions) * 100 : 0,
        cpc: seg.clicks > 0 ? seg.spend / seg.clicks : 0,
        cpm: seg.impressions > 0 ? (seg.spend / seg.impressions) * 1000 : 0,
        conversionRate: seg.clicks > 0 ? (seg.conversions / seg.clicks) * 100 : 0,
        shareOfSpend: 0,
      }));

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
};

export default breakdownsRoutes;

