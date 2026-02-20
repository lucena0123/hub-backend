import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const { dashboard: dashboardService, cache: cacheService } = fastify.services;

  // Dashboard overview
  fastify.get('/api/dashboard/overview', async (_request, reply) => {
    try {
      if (cacheService) {
        const cached = await cacheService.get('dashboard:overview');
        if (cached) return cached;
      }

      const overview = await dashboardService.getOverview();

      if (cacheService) {
        await cacheService.set('dashboard:overview', overview, 60);
      }

      return overview;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch dashboard overview',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Dashboard stats
  fastify.get('/api/dashboard/stats', async (_request, reply) => {
    try {
      const stats = await dashboardService.getStats();
      return stats;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch dashboard stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Performance alerts
  fastify.get('/api/alerts', async (_request, reply) => {
    try {
      const alerts = await dashboardService.getPerformanceAlerts();
      return {
        total: alerts.length,
        critical: alerts.filter(a => a.type === 'critical').length,
        warning: alerts.filter(a => a.type === 'warning').length,
        alerts,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default dashboardRoutes;
