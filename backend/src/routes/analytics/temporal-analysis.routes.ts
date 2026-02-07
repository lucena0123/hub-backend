import { FastifyPluginAsync } from 'fastify';

const temporalAnalysisRoutes: FastifyPluginAsync = async (fastify) => {


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

      const { analytics } = fastify.services;
      const result = await analytics.getTemporalAnalysis(campaignId, start, end);
      return result;
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

