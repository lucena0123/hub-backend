import { FastifyPluginAsync } from 'fastify';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
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
      const [
        totalClientsResult,
        activeClientsResult,
        runningProcessesResult,
        pendingTasksResult,
        completedTodayResult,
      ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM clients'),
        pool.query("SELECT COUNT(*) as count FROM clients WHERE status = 'active'"),
        pool.query("SELECT COUNT(*) as count FROM process_instances WHERE status = 'running'"),
        pool.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'"),
        pool.query(`
          SELECT COUNT(*) as count FROM tasks
          WHERE status = 'completed'
          AND "completedAt" >= CURRENT_DATE
        `),
      ]);

      return {
        totalClients: parseInt(totalClientsResult.rows[0].count),
        activeClients: parseInt(activeClientsResult.rows[0].count),
        runningProcesses: parseInt(runningProcessesResult.rows[0].count),
        pendingTasks: parseInt(pendingTasksResult.rows[0].count),
        completedTasksToday: parseInt(completedTodayResult.rows[0].count),
        timestamp: new Date().toISOString(),
      };
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
