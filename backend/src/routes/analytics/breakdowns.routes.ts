import { FastifyPluginAsync } from 'fastify';

const breakdownsRoutes: FastifyPluginAsync = async (fastify) => {


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

      const { analytics } = fastify.services;
      const result = await analytics.getBreakdowns(campaignId, type, start, end);

      return result;
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

