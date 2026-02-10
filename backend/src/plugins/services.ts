import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { pool } from '../config/database';
import { redis } from '../config/redis';
import { prisma } from '../config/prisma';
import { ClientAudit } from '../middleware/audit';
import { MetricsService } from '../services/metrics-service';
import { ClientService } from '../services/client-service';
import { AuthService } from '../services/auth-service';
import { ProcessService } from '../services/process-service';
import { BPMNTracker } from '../services/bpmn-tracker';
import { ReportGenerator } from '../services/report-generator';
import { DashboardService } from '../services/dashboard-service';
import { CacheService } from '../services/cache-service';
import { AiOutputService } from '../services/ai-output-service';
import { SyncHistoryService } from '../services/sync-history-service';
import { AnalyticsService } from '../services/analytics/analytics-service';
import { LeadTrackingService } from '../services/lead-tracking-service';
import { BpmnDefinitionService } from '../services/bpmn-definition-service';
import { QueueService } from '../services/queue-service';
import { NotificationService } from '../services/notification-service';
import { CampaignService } from '../services/campaign.service';
import { AnomalyDetectionService } from '../services/anomaly-detection-service';
import { OptimizationActionService } from '../services/optimization-playbook/optimization-action-service';
import { OptimizationTaskGenerator } from '../services/optimization-playbook/optimization-task-generator';
import type { AppServices } from '../types/fastify';

export default fp(async (fastify: FastifyInstance) => {
  // Connect infrastructure
  await pool.query('SELECT 1');
  fastify.log.info('PostgreSQL connected');

  await redis.connect();
  fastify.log.info('Redis connected');

  // Connect Prisma
  try {
    await prisma.$connect();
    fastify.log.info('Prisma connected');
  } catch (err) {
    fastify.log.error({ err }, 'Failed to connect Prisma');
    throw err;
  }

  const cacheService = new CacheService(redis as any);
  const aiOutputService = new AiOutputService(pool);

  // Initialize BullMQ queue service (gracefully degrades if Redis < 5.0)
  const queueService = new QueueService(pool);
  await queueService.initialize();

  if (queueService.available) {
    fastify.log.info('BullMQ queues initialized');
    try {
      const scheduledClients = await queueService.scheduleRecurringJobs();
      fastify.log.info({ clients: scheduledClients }, 'Recurring jobs scheduled');
    } catch (err) {
      fastify.log.warn({ err }, 'Failed to schedule recurring jobs (non-fatal)');
    }
  } else {
    fastify.log.warn('BullMQ disabled (Redis < 5.0) — scheduler and workers will not run');
  }

  // Create services
  const metricsService = new MetricsService(prisma);
  const bpmnTracker = new BPMNTracker(prisma);
  const bpmnDefinitionService = new BpmnDefinitionService();
  const reportGenerator = new ReportGenerator(prisma, metricsService, aiOutputService);
  const dashboardService = new DashboardService(prisma, pool);
  const syncHistoryService = new SyncHistoryService(prisma);
  const analyticsService = new AnalyticsService(prisma);
  const leadTrackingService = new LeadTrackingService(pool);
  const clientAudit = new ClientAudit(pool);
  const clientService = new ClientService(prisma, clientAudit);
  const notificationService = new NotificationService(pool);
  const anomalyService = new AnomalyDetectionService(pool, notificationService);
  const campaignService = new CampaignService(prisma);
  const authService = new AuthService(prisma);
  const processService = new ProcessService(prisma);
  const optimizationActionService = new OptimizationActionService(prisma);
  const optimizationTaskGenerator = new OptimizationTaskGenerator(prisma);

  const services: AppServices = {
    metrics: metricsService,
    bpmn: bpmnTracker,
    bpmnDefinitions: bpmnDefinitionService,
    reports: reportGenerator,
    dashboard: dashboardService,
    cache: cacheService,
    aiOutputs: aiOutputService,
    syncHistory: syncHistoryService,
    leadTracking: leadTrackingService,
    clientAudit: clientAudit,
    clients: clientService,
    queue: queueService,
    notification: notificationService,
    campaigns: campaignService,
    auth: authService,
    processes: processService,
    analytics: analyticsService,
    anomaly: anomalyService,
    optimizationAction: optimizationActionService,
    optimizationTaskGenerator: optimizationTaskGenerator,
    metaAds: undefined as any, // MetaAdsService is now instantiated dynamically per request
  };

  // Decorate fastify instance
  fastify.decorate('pool', pool);
  fastify.decorate('services', services);
  fastify.decorate('prisma', prisma);

  // Register cleanup hooks
  fastify.addHook('onClose', async () => {
    await pool.end();
    fastify.log.info('PostgreSQL pool closed');
    await prisma.$disconnect();
    fastify.log.info('Prisma disconnected');
    await redis.quit();
    fastify.log.info('Redis disconnected');
  });
});
