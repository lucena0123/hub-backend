/**
 * Dashboard Service
 * Aggregates data for the main dashboard overview
 */

import { Pool } from 'pg';

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

export interface PerformanceAlert {
  id: string;
  clientId: string;
  clientName: string;
  campaignId?: string;
  campaignName?: string;
  type: 'warning' | 'critical' | 'info';
  category: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  createdAt: string;
}

export class DashboardService {
  constructor(private pool: Pool) {}

  /**
   * Get complete dashboard overview
   */
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
    // Last 30 days performance
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

    // Recent reports
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

    // Recent BPMN updates
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

    // Sort by timestamp desc
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, 5);
  }

  /**
   * Generate performance alerts based on current metrics
   */
  async getPerformanceAlerts(): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    // Check each campaign's recent performance (last 7 days)
    const campaigns = await this.pool.query(`
      SELECT
        c.id as campaign_id,
        c.name as campaign_name,
        c."clientId" as client_id,
        cl.name as client_name,
        c.budget,
        c.platform,
        COALESCE(SUM(cm.spend), 0) as total_spend,
        COALESCE(SUM(cm.revenue), 0) as total_revenue,
        COALESCE(SUM(cm.clicks), 0) as total_clicks,
        COALESCE(SUM(cm.impressions), 0) as total_impressions,
        COALESCE(SUM(cm.conversions), 0) as total_conversions,
        COALESCE(SUM(cm.leads), 0) as total_leads
      FROM campaigns c
      JOIN clients cl ON c."clientId" = cl.id
      LEFT JOIN campaign_metrics cm ON c.id = cm.campaign_id
        AND cm.date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY c.id, c.name, c."clientId", cl.name, c.budget, c.platform
    `);

    for (const camp of campaigns.rows) {
      const spend = parseFloat(camp.total_spend) || 0;
      const revenue = parseFloat(camp.total_revenue) || 0;
      const clicks = parseInt(camp.total_clicks) || 0;
      const impressions = parseInt(camp.total_impressions) || 0;
      const conversions = parseInt(camp.total_conversions) || 0;
      const leads = parseInt(camp.total_leads) || 0;
      const budget = parseFloat(camp.budget) || 0;

      // Skip campaigns with no data
      if (spend === 0 && impressions === 0) continue;

      const roas = spend > 0 ? revenue / spend : 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpl = leads > 0 ? spend / leads : 0;

      // ROAS Critical: below 2x
      if (roas > 0 && roas < 2) {
        alerts.push({
          id: `roas-critical-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'critical',
          category: 'roas',
          message: `ROAS de ${roas.toFixed(2)}x está abaixo do mínimo recomendado (2x). Campanha pode estar gerando prejuízo.`,
          metric: 'ROAS',
          currentValue: roas,
          threshold: 2,
          createdAt: new Date().toISOString(),
        });
      }
      // ROAS Warning: below 5x
      else if (roas > 0 && roas < 5) {
        alerts.push({
          id: `roas-warning-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'warning',
          category: 'roas',
          message: `ROAS de ${roas.toFixed(2)}x está abaixo da meta (5x). Considere otimizar a campanha.`,
          metric: 'ROAS',
          currentValue: roas,
          threshold: 5,
          createdAt: new Date().toISOString(),
        });
      }

      // CTR Critical: below 1%
      if (ctr > 0 && ctr < 1) {
        alerts.push({
          id: `ctr-critical-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'critical',
          category: 'ctr',
          message: `CTR de ${ctr.toFixed(2)}% é muito baixo. Revise criativos e segmentação urgentemente.`,
          metric: 'CTR',
          currentValue: ctr,
          threshold: 1,
          createdAt: new Date().toISOString(),
        });
      }

      // Budget overspend: over 100%
      if (budget > 0 && spend > budget) {
        const utilization = (spend / budget) * 100;
        alerts.push({
          id: `budget-over-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'warning',
          category: 'budget',
          message: `Orçamento excedido em ${(utilization - 100).toFixed(1)}%. Gasto: R$ ${spend.toFixed(2)} / Budget: R$ ${budget.toFixed(2)}.`,
          metric: 'Budget',
          currentValue: utilization,
          threshold: 100,
          createdAt: new Date().toISOString(),
        });
      }

      // CPL high: above R$30
      if (cpl > 30) {
        alerts.push({
          id: `cpl-high-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'warning',
          category: 'cpl',
          message: `CPL de R$ ${cpl.toFixed(2)} está acima do limite (R$ 30). Revise a estratégia de captação.`,
          metric: 'CPL',
          currentValue: cpl,
          threshold: 30,
          createdAt: new Date().toISOString(),
        });
      }

      // No conversions in 7 days
      if (spend > 100 && conversions === 0) {
        alerts.push({
          id: `no-conv-${camp.campaign_id}`,
          clientId: camp.client_id,
          clientName: camp.client_name,
          campaignId: camp.campaign_id,
          campaignName: camp.campaign_name,
          type: 'critical',
          category: 'conversions',
          message: `Nenhuma conversão nos últimos 7 dias com gasto de R$ ${spend.toFixed(2)}. Verifique tracking e landing page.`,
          metric: 'Conversions',
          currentValue: 0,
          threshold: 1,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Check BPMN blocked clients
    const blocked = await this.pool.query(`
      SELECT cbp.client_id, c.name as client_name, cbp.current_subprocess, cbp.blockers
      FROM client_bpmn_progress cbp
      JOIN clients c ON cbp.client_id = c.id
      WHERE cbp.status = 'blocked'
    `);

    for (const b of blocked.rows) {
      alerts.push({
        id: `bpmn-blocked-${b.client_id}`,
        clientId: b.client_id,
        clientName: b.client_name,
        type: 'critical',
        category: 'bpmn',
        message: `Cliente bloqueado no subprocesso ${b.current_subprocess}. Ação necessária.`,
        metric: 'BPMN',
        currentValue: 0,
        threshold: 0,
        createdAt: new Date().toISOString(),
      });
    }

    // Sort: critical first, then warning, then info
    const priority = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => priority[a.type] - priority[b.type]);

    return alerts;
  }
}
