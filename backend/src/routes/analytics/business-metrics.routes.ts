import { FastifyPluginAsync } from 'fastify';

const businessMetricsRoutes: FastifyPluginAsync = async (fastify) => {


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

      const { analytics } = fastify.services;
      const metrics = await analytics.getBusinessMetrics(campaignId, start, end);
      return metrics;
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

