import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';
import { AutoApprovalService } from '../services/auto-approval-service';

const automationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  const getService = () => new AutoApprovalService(fastify.pool);

  // GET — current auto-approval config
  fastify.get('/api/clients/:clientId/automation/config', async (request) => {
    const { clientId } = request.params as { clientId: string };
    const config = await getService().getConfig(clientId);
    return { clientId, ...config };
  });

  // PUT — update auto-approval config
  fastify.put('/api/clients/:clientId/automation/config', async (request, reply) => {
    const { clientId } = request.params as { clientId: string };
    const body = request.body as any;

    if (!body || typeof body !== 'object') {
      reply.status(400);
      return { error: 'Invalid body' };
    }

    try {
      const updated = await getService().updateConfig(clientId, {
        autoApproveEnabled: body.autoApproveEnabled,
        autoApproveMaxPerRun: body.autoApproveMaxPerRun,
        autoApproveRules: body.autoApproveRules,
      });
      return { clientId, ...updated };
    } catch (error) {
      reply.status(500);
      return { error: 'Failed to update config', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // GET — auto-approval history
  fastify.get('/api/clients/:clientId/automation/history', async (request) => {
    const { clientId } = request.params as { clientId: string };
    const { limit = '50', offset = '0' } = request.query as { limit?: string; offset?: string };

    const result = await getService().getHistory(clientId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return { clientId, ...result };
  });
};

export default automationRoutes;
