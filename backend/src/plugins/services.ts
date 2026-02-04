import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { pool } from '../config/database';
import { redis } from '../config/redis';
import { ClientAudit } from '../middleware/audit';
import { MetricsService } from '../services/metrics-service';
import { BPMNTracker } from '../services/bpmn-tracker';
import { ReportGenerator } from '../services/report-generator';
import { DashboardService } from '../services/dashboard-service';
import { CacheService } from '../services/cache-service';
import { SyncHistoryService } from '../services/sync-history-service';
import { LeadTrackingService } from '../services/lead-tracking-service';
import { BpmnDefinitionService } from '../services/bpmn-definition-service';
import type { AppServices } from '../types/fastify';

export default fp(async (fastify: FastifyInstance) => {
  // Connect infrastructure
  await pool.query('SELECT 1');
  fastify.log.info('PostgreSQL connected');

  await redis.connect();
  fastify.log.info('Redis connected');

  const cacheService = new CacheService(redis as any);

  // Create services
  const services: AppServices = {
    metrics: new MetricsService(pool),
    bpmn: new BPMNTracker(pool),
    bpmnDefinitions: new BpmnDefinitionService(),
    reports: new ReportGenerator(pool),
    dashboard: new DashboardService(pool),
    cache: cacheService,
    syncHistory: new SyncHistoryService(pool),
    leadTracking: new LeadTrackingService(pool),
    clientAudit: new ClientAudit(pool),
  };

  // Decorate fastify instance
  fastify.decorate('pool', pool);
  fastify.decorate('services', services);

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    await pool.end();
    fastify.log.info('PostgreSQL pool closed');
    await redis.quit();
    fastify.log.info('Redis disconnected');
  });
});
