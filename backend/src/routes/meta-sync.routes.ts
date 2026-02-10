import { FastifyPluginAsync } from 'fastify';
import metaSyncHistoryRoutes from './meta-sync/history.routes';
import metaSyncJobRoutes from './meta-sync/sync.routes';
import { authenticate } from '../middleware/auth';

const metaSyncRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  fastify.register(metaSyncJobRoutes);
  fastify.register(metaSyncHistoryRoutes);
};

export default metaSyncRoutes;
