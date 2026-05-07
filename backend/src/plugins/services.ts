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
import { CommercialLeadsService } from '../modules/commercial';
import { EvolutionApiService } from '../services/evolution-api-service';
import { GoogleApiService } from '../services/google-api-service';
import { RuleProfileService } from '../services/rule-profile-service';
import { FinanceService } from '../services/finance-service';
import { ProjectService } from '../services/project-service';
import { CustomerSuccessService } from '../services/customer-success-service';
import { MetaGovernanceStore } from '../services/meta-governance/store';
import type { AppServices } from '../types/fastify';

const REQUIRED_RULE_PROFILE_COLUMNS: Array<{ table: string; column: string }> = [
  { table: 'clients', column: 'business_niche_key' },
  { table: 'clients', column: 'default_channel_key' },
  { table: 'campaigns', column: 'objective_class_key' },
  { table: 'campaigns', column: 'channel_class_key' },
  { table: 'campaigns', column: 'rule_profile_id' },
];

async function hasRuleProfileSchema() {
  const rows = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'clients' AND column_name IN ('business_niche_key', 'default_channel_key'))
        OR (table_name = 'campaigns' AND column_name IN ('objective_class_key', 'channel_class_key', 'rule_profile_id'))
      )
  `;

  const found = new Set(rows.map((row) => `${row.table_name}.${row.column_name}`));
  return REQUIRED_RULE_PROFILE_COLUMNS.every((item) => found.has(`${item.table}.${item.column}`));
}

async function applyRuleProfileSchemaGuard(fastify: FastifyInstance) {
  try {
    const schemaOk = await hasRuleProfileSchema();
    if (!schemaOk) {
      process.env.RULE_PROFILE_ENGINE_ENABLED = 'false';
      process.env.RULE_PROFILE_BLOCK_ON_MISSING_CLASSIFICATION = 'false';
      fastify.log.warn(
        '[rule-profile] schema incompleto detectado; engine em modo degradado (RULE_PROFILE_ENGINE_ENABLED=false, RULE_PROFILE_BLOCK_ON_MISSING_CLASSIFICATION=false)',
      );
    }
  } catch (err) {
    process.env.RULE_PROFILE_ENGINE_ENABLED = 'false';
    process.env.RULE_PROFILE_BLOCK_ON_MISSING_CLASSIFICATION = 'false';
    fastify.log.warn({ err }, '[rule-profile] falha no schema health-check; engine em modo degradado');
  }
}

async function connectInfrastructure(fastify: FastifyInstance) {
  await pool.query('SELECT 1');
  fastify.log.info('PostgreSQL connected');

  await redis.connect();
  fastify.log.info('Redis connected');

  try {
    await prisma.$connect();
    fastify.log.info('Prisma connected');
  } catch (err) {
    fastify.log.error({ err }, 'Failed to connect Prisma');
    throw err;
  }

  await applyRuleProfileSchemaGuard(fastify);
}

async function createInfrastructureServices(fastify: FastifyInstance) {
  const cacheService = new CacheService(redis as any);
  const aiOutputService = new AiOutputService(pool);
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

  return {
    aiOutputService,
    cacheService,
    queueService,
  };
}

function createCoreServices() {
  const metricsService = new MetricsService(prisma);
  const bpmnTracker = new BPMNTracker(prisma);
  const bpmnDefinitionService = new BpmnDefinitionService();
  const dashboardService = new DashboardService(prisma, pool);
  const syncHistoryService = new SyncHistoryService(prisma);
  const leadTrackingService = new LeadTrackingService(pool);
  const clientAudit = new ClientAudit(pool);
  const clientService = new ClientService(prisma, clientAudit);
  const notificationService = new NotificationService(pool);
  const ruleProfileService = new RuleProfileService(prisma);
  const campaignService = new CampaignService(prisma, ruleProfileService);
  const authService = new AuthService(prisma);
  const processService = new ProcessService(prisma);

  return {
    authService,
    bpmnDefinitionService,
    bpmnTracker,
    campaignService,
    clientAudit,
    clientService,
    dashboardService,
    leadTrackingService,
    metricsService,
    notificationService,
    processService,
    ruleProfileService,
    syncHistoryService,
  };
}

function createAnalyticsAndOptimizationServices(
  metricsService: MetricsService,
  aiOutputService: AiOutputService,
  notificationService: NotificationService,
) {
  const reportGenerator = new ReportGenerator(prisma, metricsService, aiOutputService);
  const analyticsService = new AnalyticsService(prisma);
  const anomalyService = new AnomalyDetectionService(pool, notificationService);
  const optimizationActionService = new OptimizationActionService(prisma);
  const optimizationTaskGenerator = new OptimizationTaskGenerator(prisma);

  return {
    analyticsService,
    anomalyService,
    optimizationActionService,
    optimizationTaskGenerator,
    reportGenerator,
  };
}

async function createCommercialServices() {
  const evolutionApi = new EvolutionApiService(
    process.env.EVOLUTION_API_BASE_URL ?? '',
    process.env.EVOLUTION_INSTANCE ?? '',
    process.env.EVOLUTION_API_KEY ?? '',
  );
  const googleApi = new GoogleApiService(
    process.env.GOOGLE_CLIENT_ID ?? '',
    process.env.GOOGLE_CLIENT_SECRET ?? '',
    process.env.GOOGLE_REFRESH_TOKEN ?? '',
    process.env.GOOGLE_CALENDAR_ID ?? 'primary',
    process.env.GMAIL_FROM_ADDRESS ?? '',
  );
  const commercialLeadsService = new CommercialLeadsService(pool, evolutionApi, googleApi);
  await commercialLeadsService.initialize();

  return {
    commercialLeadsService,
  };
}

function createMetaServices() {
  const metaGovernanceStore = new MetaGovernanceStore(pool);

  return {
    metaGovernanceStore,
  };
}

function createAgencyOpsServices() {
  const financeService = new FinanceService(prisma);
  const projectService = new ProjectService(prisma);
  const customerSuccessService = new CustomerSuccessService(prisma);

  return {
    customerSuccessService,
    financeService,
    projectService,
  };
}

export default fp(async (fastify: FastifyInstance) => {
  await connectInfrastructure(fastify);

  const infrastructure = await createInfrastructureServices(fastify);
  const core = createCoreServices();
  const analyticsAndOptimization = createAnalyticsAndOptimizationServices(
    core.metricsService,
    infrastructure.aiOutputService,
    core.notificationService,
  );
  const commercial = await createCommercialServices();
  const meta = createMetaServices();
  const agencyOps = createAgencyOpsServices();

  const services: AppServices = {
    metrics: core.metricsService,
    bpmn: core.bpmnTracker,
    bpmnDefinitions: core.bpmnDefinitionService,
    reports: analyticsAndOptimization.reportGenerator,
    dashboard: core.dashboardService,
    cache: infrastructure.cacheService,
    aiOutputs: infrastructure.aiOutputService,
    syncHistory: core.syncHistoryService,
    leadTracking: core.leadTrackingService,
    clientAudit: core.clientAudit,
    clients: core.clientService,
    queue: infrastructure.queueService,
    notification: core.notificationService,
    campaigns: core.campaignService,
    auth: core.authService,
    processes: core.processService,
    analytics: analyticsAndOptimization.analyticsService,
    anomaly: analyticsAndOptimization.anomalyService,
    metaAds: undefined as any,
    metaGovernance: meta.metaGovernanceStore,
    optimizationAction: analyticsAndOptimization.optimizationActionService,
    optimizationTaskGenerator: analyticsAndOptimization.optimizationTaskGenerator,
    commercialLeads: commercial.commercialLeadsService,
    ruleProfiles: core.ruleProfileService,
    finance: agencyOps.financeService,
    projects: agencyOps.projectService,
    customerSuccess: agencyOps.customerSuccessService,
  };

  fastify.decorate('pool', pool);
  fastify.decorate('services', services);
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await pool.end();
    fastify.log.info('PostgreSQL pool closed');
    await prisma.$disconnect();
    fastify.log.info('Prisma disconnected');
    await redis.quit();
    fastify.log.info('Redis disconnected');
  });
});
