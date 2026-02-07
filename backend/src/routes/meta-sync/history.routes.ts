import { FastifyPluginAsync } from 'fastify';

const metaSyncHistoryRoutes: FastifyPluginAsync = async (fastify) => {
  const { syncHistory: syncHistoryService } = fastify.services;
  const prisma = (fastify as any).prisma;

  // Get sync history
  fastify.get('/api/metrics/sync/history', async (request, reply) => {
    try {
      const { platform, accountId, limit, offset } = request.query as {
        platform?: string;
        accountId?: string;
        limit?: string;
        offset?: string;
      };

      const history = await syncHistoryService.getSyncHistory({
        platform: platform || 'meta',
        accountId,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      });

      const lastSuccess = await syncHistoryService.getLastSuccessfulSync(platform || 'meta', accountId);

      const historyWithState = history.map((record: any) => ({
        ...record,
        state: record.completedAt ? record.status : 'running',
      }));

      return {
        history: historyWithState,
        lastSuccessfulSync: lastSuccess,
        total: historyWithState.length,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch sync history',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get single sync details
  fastify.get('/api/metrics/sync/history/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const row = await prisma.syncHistory.findUnique({
        where: { id }
      });

      if (!row) {
        reply.status(404);
        return { error: 'Sync record not found' };
      }

      const state = row.completedAt ? row.status : 'running';
      return { ...row, state };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch sync details',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default metaSyncHistoryRoutes;
