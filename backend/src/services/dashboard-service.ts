import { PrismaClient } from '@prisma/client';
import { PerformanceAlertService, PerformanceAlert } from './performance-alert-service';

export type { PerformanceAlert };

export interface DashboardOverview {
  clients: {
    total: number;
    active: number;
    byTier: Record<string, number>;
  };
  campaigns: {
    total: number;
    active: number;
    byPlatform: Record<string, number>;
  };
  performance: {
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    totalLeads: number;
    avgRoas: number;
    avgCtr: number;
    avgCpl: number;
  };
  bpmn: {
    clientsInExecution: number;
    clientsInMonitoring: number;
    avgProgress: number;
    blockedClients: number;
  };
  reports: {
    totalGenerated: number;
    lastGenerated: string | null;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export class DashboardService {
  private alertService: PerformanceAlertService;

  constructor(private prisma: PrismaClient, pool: any) { // Keep pool for alertService compatibility for now if it uses it, but logic here uses prisma
    this.alertService = new PerformanceAlertService(pool);
  }

  async getOverview(): Promise<DashboardOverview> {
    const [clients, campaigns, performance, bpmn, reports] = await Promise.all([
      this.getClientsOverview(),
      this.getCampaignsOverview(),
      this.getPerformanceOverview(),
      this.getBPMNOverview(),
      this.getReportsOverview(),
    ]);

    return {
      clients,
      campaigns,
      performance,
      bpmn,
      reports,
      recentActivity: await this.getRecentActivity(),
    };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalClients,
      activeClients,
      runningProcesses,
      pendingTasks,
      completedTasksToday
    ] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { status: 'active' } }),
      this.prisma.processInstance.count({ where: { status: 'running' } }),
      this.prisma.task.count({ where: { status: 'pending' } }),
      this.prisma.task.count({
        where: {
          status: 'completed',
          completedAt: { gte: today }
        }
      })
    ]);

    return {
      totalClients,
      activeClients,
      runningProcesses,
      pendingTasks,
      completedTasksToday,
      timestamp: new Date().toISOString(),
    };
  }

  async getPerformanceAlerts(): Promise<PerformanceAlert[]> {
    return this.alertService.getPerformanceAlerts();
  }

  private async getClientsOverview() {
    const total = await this.prisma.client.count();
    const active = await this.prisma.client.count({ where: { status: 'active' } });

    // Group by tier
    const byTierResult = await this.prisma.client.groupBy({
      by: ['tier'],
      _count: {
        tier: true
      }
    });

    const byTier: Record<string, number> = {};
    byTierResult.forEach((row: any) => {
      byTier[row.tier] = row._count.tier;
    });

    return { total, active, byTier };
  }

  private async getCampaignsOverview() {
    const total = await this.prisma.campaign.count();
    const active = await this.prisma.campaign.count({ where: { status: 'active' } });

    const byPlatformResult = await this.prisma.campaign.groupBy({
      by: ['platform'],
      _count: {
        platform: true
      }
    });

    const byPlatform: Record<string, number> = {};
    byPlatformResult.forEach((row: any) => {
      byPlatform[row.platform] = row._count.platform;
    });

    return { total, active, byPlatform };
  }

  private async getPerformanceOverview() {
    // raw query is still efficient for complex aggregation across date ranges
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        COALESCE(SUM(spend), 0) as total_spend,
        COALESCE(SUM(revenue), 0) as total_revenue,
        COALESCE(SUM(conversions), 0) as total_conversions,
        COALESCE(SUM(leads), 0) as total_leads,
        CASE WHEN SUM(spend) > 0 THEN ROUND(SUM(revenue) / SUM(spend), 2) ELSE 0 END as avg_roas,
        CASE WHEN SUM(impressions) > 0 THEN ROUND((SUM(clicks)::decimal / SUM(impressions)) * 100, 2) ELSE 0 END as avg_ctr,
        CASE
          WHEN SUM(leads) > 0 THEN ROUND(SUM(spend) / SUM(leads), 2)
          WHEN SUM(messaging_conversations) > 0 THEN ROUND(SUM(spend) / SUM(messaging_conversations), 2)
          WHEN SUM(conversions) > 0 THEN ROUND(SUM(spend) / SUM(conversions), 2)
          ELSE 0
        END as avg_cpl
      FROM campaign_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `;

    // Prisma $queryRaw returns BigInt for totals usually, need to handle deserialization if needed, 
    // or just map. Postgres sums are usually strings or numbers in JS driver. 
    // Prisma returns array of objects.

    const row = result[0];
    return {
      totalSpend: Number(row.total_spend) || 0,
      totalRevenue: Number(row.total_revenue) || 0,
      totalConversions: Number(row.total_conversions) || 0,
      totalLeads: Number(row.total_leads) || 0,
      avgRoas: Number(row.avg_roas) || 0,
      avgCtr: Number(row.avg_ctr) || 0,
      avgCpl: Number(row.avg_cpl) || 0,
    };
  }

  private async getBPMNOverview() {
    // Prisma aggregations
    // "4.%": startsWith '4.'
    const inExecution = await this.prisma.clientBPMNProgress.count({
      where: { currentSubprocess: { startsWith: '4.' } }
    });

    const inMonitoring = await this.prisma.clientBPMNProgress.count({
      where: { currentSubprocess: { startsWith: '5.' } }
    });

    const blocked = await this.prisma.clientBPMNProgress.count({
      where: { status: 'blocked' }
    });

    const avgProgressResult = await this.prisma.clientBPMNProgress.aggregate({
      _avg: {
        progressPercentage: true
      }
    });

    return {
      clientsInExecution: inExecution,
      clientsInMonitoring: inMonitoring,
      avgProgress: Math.round(avgProgressResult._avg.progressPercentage || 0),
      blockedClients: blocked,
    };
  }

  private async getReportsOverview() {
    const total = await this.prisma.monthlyReport.count();
    const last = await this.prisma.monthlyReport.findFirst({
      orderBy: { generatedAt: 'desc' },
      select: { generatedAt: true }
    });

    return {
      totalGenerated: total,
      lastGenerated: last?.generatedAt ? last.generatedAt.toISOString() : null,
    };
  }

  private async getRecentActivity() {
    const activities: Array<{ type: string; description: string; timestamp: string }> = [];

    const reports = await this.prisma.monthlyReport.findMany({
      orderBy: { generatedAt: 'desc' },
      take: 3,
      select: { title: true, generatedAt: true }
    });

    reports.forEach((r: any) => {
      if (!r?.generatedAt) return;
      activities.push({
        type: 'report',
        description: `Relatório gerado: ${r.title}`,
        timestamp: r.generatedAt.toISOString(),
      });
    });

    const bpmn = await this.prisma.clientBPMNProgress.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 3,
      // include removed as no relation exists
    });

    // Fetch client names
    const clientIds = [...new Set(bpmn.map(b => b.clientId))];
    const clients = await this.prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true }
    });

    const clientMap = new Map(clients.map((c: any) => [c.id, c.name]));

    bpmn.forEach((b: any) => {
      activities.push({
        type: 'bpmn',
        description: `${clientMap.get(b.clientId) || 'Unknown'}: Subprocess ${b.currentSubprocess} - ${b.progressPercentage}%`,
        timestamp: b.updatedAt.toISOString(),
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, 5);
  }
}
