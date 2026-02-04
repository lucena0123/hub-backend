import { FastifyPluginAsync } from 'fastify';

const businessMetricsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  // Business metrics endpoint (CAC, LTV)
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/business-metrics', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;
      const days =
        period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
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
          JOIN clients c ON camp."clientId" = c.id
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

export default businessMetricsRoutes;

