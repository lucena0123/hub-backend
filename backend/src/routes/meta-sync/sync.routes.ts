import { FastifyPluginAsync } from 'fastify';

import { createSyncMetaAdsHandler } from './sync/handler';

const metaSyncJobRoutes: FastifyPluginAsync = async (fastify) => {
  const syncMetaAdsHandler = createSyncMetaAdsHandler(fastify);

  fastify.post('/api/metrics/sync/meta', syncMetaAdsHandler);
  fastify.post('/api/metrics/sync', syncMetaAdsHandler);
};

export default metaSyncJobRoutes;

