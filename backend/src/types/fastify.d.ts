import 'fastify';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../services/cache-service';
import { MetricsService } from '../services/metrics-service';
import { ClientService } from '../services/client-service';
import { AuthService } from '../services/auth-service';
import { ProcessService } from '../services/process-service';
import { BPMNTracker } from '../services/bpmn-tracker';
import { BpmnDefinitionService } from '../services/bpmn-definition-service';
import { ReportGenerator } from '../services/report-generator';
import { DashboardService } from '../services/dashboard-service';
import { SyncHistoryService } from '../services/sync-history-service';
import { LeadTrackingService } from '../services/lead-tracking-service';
import { ClientAudit } from '../middleware/audit';
import { QueueService } from '../services/queue-service';
import { NotificationService } from '../services/notification-service';
import { CampaignService } from '../services/campaign.service';
import { AnalyticsService } from '../services/analytics/analytics-service';

export interface AppServices {
  clients: ClientService;
  auth: AuthService;
  processes: ProcessService;
  metrics: MetricsService;
  bpmn: BPMNTracker;
  bpmnDefinitions: BpmnDefinitionService;
  reports: ReportGenerator;
  dashboard: DashboardService;
  cache: CacheService | null;
  syncHistory: SyncHistoryService;
  leadTracking: LeadTrackingService;
  clientAudit: ClientAudit;
  queue: QueueService;
  notification: NotificationService;
  campaigns: CampaignService;
  analytics: AnalyticsService;
}

declare module 'fastify' {
  interface FastifyInstance {
    pool: Pool;
    prisma: PrismaClient;
    services: AppServices;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; name: string; role: string };
    user: { id: string; email: string; name: string; role: string };
  }
}
