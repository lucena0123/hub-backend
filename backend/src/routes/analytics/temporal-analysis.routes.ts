import { FastifyPluginAsync } from 'fastify';

const temporalAnalysisRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  // Temporal analysis endpoint
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/temporal-analysis', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;
      const days =
        period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
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
      const sortedByCpl = [...byDayOfWeek].filter((d) => d.cpl > 0).sort((a, b) => a.cpl - b.cpl);

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
};

export default temporalAnalysisRoutes;

