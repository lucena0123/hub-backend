import { FastifyPluginAsync } from 'fastify';

import { createSyncMetaAdsHandler } from './sync/handler';
import { requireRoles } from '../../middleware/rbac';

const metaSyncJobRoutes: FastifyPluginAsync = async (fastify) => {
  const syncMetaAdsHandler = createSyncMetaAdsHandler(fastify);

  fastify.post('/api/metrics/sync/meta', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, syncMetaAdsHandler);
  fastify.post('/api/metrics/sync', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, syncMetaAdsHandler);
};

export default metaSyncJobRoutes;
