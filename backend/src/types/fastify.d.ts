import { Pool } from 'pg';
import { CacheService } from '../services/cache-service';
import { MetricsService } from '../services/metrics-service';
import { BPMNTracker } from '../services/bpmn-tracker';
import { BpmnDefinitionService } from '../services/bpmn-definition-service';
import { ReportGenerator } from '../services/report-generator';
import { DashboardService } from '../services/dashboard-service';
import { SyncHistoryService } from '../services/sync-history-service';
import { LeadTrackingService } from '../services/lead-tracking-service';
import { ClientAudit } from '../middleware/audit';

export interface AppServices {
  metrics: MetricsService;
  bpmn: BPMNTracker;
  bpmnDefinitions: BpmnDefinitionService;
  reports: ReportGenerator;
  dashboard: DashboardService;
  cache: CacheService | null;
  syncHistory: SyncHistoryService;
  leadTracking: LeadTrackingService;
  clientAudit: ClientAudit;
}

declare module 'fastify' {
  interface FastifyInstance {
    pool: Pool;
    services: AppServices;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; name: string; role: string };
    user: { id: string; email: string; name: string; role: string };
  }
}
