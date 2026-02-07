import { FastifyPluginAsync } from 'fastify';

import { getCreativeLibraryResponse } from './creative-library/service';

const creativeLibraryRoutes: FastifyPluginAsync = async (fastify) => {


  fastify.get<{
    Params: { clientId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; campaignId?: string };
  }>('/api/clients/:clientId/creative-library', async (request, reply) => {
    try {
      const { clientId } = request.params;
      const { analytics } = fastify.services;
      return await getCreativeLibraryResponse({ analytics, clientId, query: request.query });
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

