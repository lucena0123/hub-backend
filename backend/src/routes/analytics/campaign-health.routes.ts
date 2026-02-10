import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { CampaignHealthService } from '../../services/campaign-health-service';

const campaignHealthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/api/clients/:clientId/campaign-health', async (request, reply) => {
    const { clientId } = request.params as { clientId: string };
    const { campaignId } = request.query as { campaignId?: string };

    try {
      const service = new CampaignHealthService(fastify.pool);
      const results = await service.getHealthScores(clientId, campaignId || undefined);

      // Calculate overall score
      const overallScore = results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
        : null;

      return {
        clientId,
        overallScore,
        total: results.length,
        campaigns: results,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to calculate health scores', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
};

export default campaignHealthRoutes;
