import type { FastifyPluginAsync } from 'fastify';

import clientDetailRoutes from './client/detail.routes';
import createClientRoutes from './client/create.routes';
import deleteClientRoutes from './client/delete.routes';
import listClientsRoutes from './client/list.routes';
import clientPerformanceSummaryRoutes from './client/performance-summary.routes';
import updateClientRoutes from './client/update.routes';

const clientRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(listClientsRoutes);
  fastify.register(clientDetailRoutes);
  fastify.register(createClientRoutes);
  fastify.register(updateClientRoutes);
  fastify.register(deleteClientRoutes);
  fastify.register(clientPerformanceSummaryRoutes);
};

export default clientRoutes;

