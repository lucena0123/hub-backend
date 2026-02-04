import { FastifyPluginAsync } from 'fastify';

import { getCreativeLibraryResponse } from './creative-library/service';

const creativeLibraryRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  fastify.get<{
    Params: { clientId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; campaignId?: string };
  }>('/api/clients/:clientId/creative-library', async (request, reply) => {
    try {
      const { clientId } = request.params;
      return await getCreativeLibraryResponse({ pool, clientId, query: request.query });
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch creative library',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default creativeLibraryRoutes;

