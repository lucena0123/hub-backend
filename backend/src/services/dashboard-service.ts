/**
 * Dashboard Service
 * Aggregates data for the main dashboard overview
 */

import { Pool } from 'pg';
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

  constructor(private pool: Pool) {
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

  async getPerformanceAlerts(): Promise<PerformanceAlert[]> {
    return this.alertService.getPerformanceAlerts();
  }

  private async getClientsOverview() {
    const result = await this.pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        tier,
        COUNT(*) as tier_count
      FROM clients
      GROUP BY tier
    `);

    const byTier: Record<string, number> = {};
    let total = 0;
    let active = 0;

    result.rows.forEach(row => {
      byTier[row.tier] = parseInt(row.tier_count);
      total = parseInt(row.total);
      active = parseInt(row.active);
    });

    return { total, active, byTier };
  }

  private async getCampaignsOverview() {
    const result = await this.pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        platform,
        COUNT(*) as platform_count
      FROM campaigns
      GROUP BY platform
    `);

    const byPlatform: Record<string, number> = {};
    let total = 0;
    let active = 0;

    result.rows.forEach(row => {
      byPlatform[row.platform] = parseInt(row.platform_count);
      total += parseInt(row.platform_count);
      active += parseInt(row.active);
    });

    return { total, active, byPlatform };
  }

  private async getPerformanceOverview() {
    const result = await this.pool.query(`
      SELECT
        COALESCE(SUM(spend), 0) as total_spend,
        COALESCE(SUM(revenue), 0) as total_revenue,
        COALESCE(SUM(conversions), 0) as total_conversions,
        COALESCE(SUM(leads), 0) as total_leads,
        CASE WHEN SUM(spend) > 0 THEN ROUND(SUM(revenue) / SUM(spend), 2) ELSE 0 END as avg_roas,
        CASE WHEN SUM(impressions) > 0 THEN ROUND((SUM(clicks)::decimal / SUM(impressions)) * 100, 2) ELSE 0 END as avg_ctr,
        CASE WHEN SUM(leads) > 0 THEN ROUND(SUM(spend) / SUM(leads), 2) ELSE 0 END as avg_cpl
      FROM campaign_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    const row = result.rows[0];
    return {
      totalSpend: parseFloat(row.total_spend) || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      totalConversions: parseInt(row.total_conversions) || 0,
      totalLeads: parseInt(row.total_leads) || 0,
      avgRoas: parseFloat(row.avg_roas) || 0,
      avgCtr: parseFloat(row.avg_ctr) || 0,
      avgCpl: parseFloat(row.avg_cpl) || 0,
    };
  }

  private async getBPMNOverview() {
    const result = await this.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE current_subprocess LIKE '4.%') as in_execution,
        COUNT(*) FILTER (WHERE current_subprocess LIKE '5.%') as in_monitoring,
        COALESCE(AVG(progress_percentage), 0) as avg_progress,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked
      FROM client_bpmn_progress
    `);

    const row = result.rows[0];
    return {
      clientsInExecution: parseInt(row.in_execution) || 0,
      clientsInMonitoring: parseInt(row.in_monitoring) || 0,
      avgProgress: Math.round(parseFloat(row.avg_progress) || 0),
      blockedClients: parseInt(row.blocked) || 0,
    };
  }

  private async getReportsOverview() {
    const result = await this.pool.query(`
      SELECT
        COUNT(*) as total,
        MAX(generated_at) as last_generated
      FROM monthly_reports
    `);

    const row = result.rows[0];
    return {
      totalGenerated: parseInt(row.total) || 0,
      lastGenerated: row.last_generated || null,
    };
  }

  private async getRecentActivity() {
    const activities: Array<{ type: string; description: string; timestamp: string }> = [];

    const reports = await this.pool.query(`
      SELECT title, generated_at, client_id
      FROM monthly_reports
      ORDER BY generated_at DESC
      LIMIT 3
    `);
    reports.rows.forEach(r => {
      activities.push({
        type: 'report',
        description: `Relatório gerado: ${r.title}`,
        timestamp: r.generated_at,
      });
    });

    const bpmn = await this.pool.query(`
      SELECT cbp.current_subprocess, cbp.progress_percentage, cbp.updated_at, c.name as client_name
      FROM client_bpmn_progress cbp
      JOIN clients c ON cbp.client_id = c.id
      ORDER BY cbp.updated_at DESC
      LIMIT 3
    `);
    bpmn.rows.forEach(b => {
      activities.push({
        type: 'bpmn',
        description: `${b.client_name}: Subprocess ${b.current_subprocess} - ${b.progress_percentage}%`,
        timestamp: b.updated_at,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, 5);
  }
}
