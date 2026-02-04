import { FastifyPluginAsync } from 'fastify';
import { buildOptimizationCenter } from './optimization-center/handler';

const optimizationCenterRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  fastify.get<{
    Params: { clientId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; campaignId?: string };
  }>('/api/clients/:clientId/optimization-center', async (request, reply) => {
    try {
      return await buildOptimizationCenter({
        pool,
        clientId: request.params.clientId,
        query: request.query,
      });
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch optimization center',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default optimizationCenterRoutes;

