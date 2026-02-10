import { FastifyPluginAsync } from 'fastify';
import { ZeroConversationsDiagnosticService } from '../../services/zero-conversations-diagnostics';

const zeroConversationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { clientId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; campaignId?: string; adsetId?: string };
  }>('/api/clients/:clientId/diagnostics/zero-conversations', async (request, reply) => {
    try {
      const { clientId } = request.params;
      const { campaignId, adsetId, period, startDate, endDate } = request.query;

      if (!campaignId && !adsetId) {
        reply.status(400);
        return { error: 'campaignId or adsetId is required' };
      }

      if (campaignId && adsetId) {
        reply.status(400);
        return { error: 'Provide either campaignId or adsetId, not both' };
      }

      const service = new ZeroConversationsDiagnosticService(fastify.pool);
      const query = { period, startDate, endDate };

      const diagnostic = campaignId
        ? await service.diagnoseCampaign(clientId, campaignId, query)
        : await service.diagnoseAdset(clientId, String(adsetId), query);

      if (!diagnostic) {
        reply.status(404);
        return { error: 'Diagnostic not found' };
      }

      return diagnostic;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch zero conversations diagnostic',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default zeroConversationsRoutes;
