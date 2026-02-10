import { FastifyPluginAsync } from 'fastify';
import { AiInsightsService } from '../../services/ai-insights-service';

const aiInsightsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; force?: string };
  }>('/api/campaigns/:campaignId/ai-insights', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period, startDate, endDate, force } = request.query;

      const service = new AiInsightsService(
        fastify.prisma,
        fastify.services.metrics,
        fastify.services.analytics,
        fastify.services.aiOutputs
      );

      const response = await service.getCampaignInsights({
        campaignId,
        period,
        startDate,
        endDate,
        force: force === 'true',
      });

      return response;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch campaign insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get<{
    Params: { snapshotId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; force?: string };
  }>('/api/creative-snapshots/:snapshotId/ai-insights', async (request, reply) => {
    try {
      const { snapshotId } = request.params;
      const { period, startDate, endDate, force } = request.query;

      const service = new AiInsightsService(
        fastify.prisma,
        fastify.services.metrics,
        fastify.services.analytics,
        fastify.services.aiOutputs
      );

      const response = await service.getCreativeInsights({
        snapshotId,
        period,
        startDate,
        endDate,
        force: force === 'true',
      });

      if (!response) {
        reply.status(404);
        return { error: 'Creative insights not found' };
      }

      return response;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch creative insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default aiInsightsRoutes;
