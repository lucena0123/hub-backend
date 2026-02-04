import { FastifyPluginAsync } from 'fastify';
import metaSyncHistoryRoutes from './meta-sync/history.routes';
import metaSyncJobRoutes from './meta-sync/sync.routes';

const metaSyncRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(metaSyncJobRoutes);
  fastify.register(metaSyncHistoryRoutes);
};

export default metaSyncRoutes;

