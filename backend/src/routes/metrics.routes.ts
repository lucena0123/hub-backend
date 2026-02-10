import { FastifyPluginAsync } from 'fastify';
import { validateMetricsImport, validateMetricUpsert } from '../validators/metrics-import';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { AppServices } from '../types/fastify';

const metricsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  // Explicit cast to avoid type issues if declaration merging fails
  const services = (fastify as any).services as AppServices;
  const { metrics: metricsService, cache: cacheService, anomaly: anomalyService } = services;

  // Get campaign metrics
  fastify.get('/api/campaigns/:id/metrics', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { period, startDate, endDate, platform } = request.query as any;

      const metrics = await metricsService.getCampaignMetrics(id, {
        period,
        startDate,
        endDate,
        platform,
      });

      return metrics;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch campaign metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get campaign performance summary
  fastify.get('/api/campaigns/:id/performance-summary', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { period, startDate, endDate } = request.query as any;

      const summary = await metricsService.getPerformanceSummary(id, {
        period,
        startDate,
        endDate,
      });

      return summary;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch performance summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Import metrics in batch
  fastify.post('/api/metrics/import', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    try {
      const validation = validateMetricsImport(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const { metrics, overwrite } = validation.data!;

      const result = await metricsService.importMetrics(metrics, overwrite);

      if (cacheService) {
        await cacheService.invalidatePattern('dashboard:*');
        await cacheService.invalidatePattern('campaigns:*');
      }

      reply.status(201);
      return {
        success: true,
        total: metrics.length,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        message: overwrite
          ? `${result.updated} metrics imported/updated`
          : `${result.imported} new metrics imported, ${result.skipped} duplicates skipped`,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to import metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Add single metric entry
  fastify.post('/api/metrics/entry', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    try {
      const validation = validateMetricUpsert(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const entry = validation.data!;

      const result = await metricsService.upsertMetric(entry);

      if (cacheService) {
        await cacheService.invalidatePattern('dashboard:*');
      }

      reply.status(201);
      return result;
    } catch (error) {
      fastify.log.error(error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (msg.includes('Foreign key constraint failed')) {
        reply.status(404);
        return { error: 'Campaign not found' };
      }
      reply.status(500);
      return {
        error: 'Failed to save metric',
        message: msg,
      };
    }
  });

  // Get global critical anomalies (Dashboard Widget)
  fastify.get('/api/metrics/anomalies/critical', async (_request, reply) => {
    try {
      // Use locally destructured service
      const anomalies = await anomalyService.getGlobalAnomalies(20);
      return anomalies;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch global anomalies',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get unacknowledged count (Dashboard Badge)
  fastify.get('/api/metrics/anomalies/count', async (request, _reply) => {
    try {
      const { clientId } = request.query as { clientId: string };
      if (!clientId) return { count: 0 };
      const count = await anomalyService.getUnacknowledgedCount(clientId);
      return { count };
    } catch (error) {
      return { count: 0 };
    }
  });
};

export default metricsRoutes;
