/**
 * Performance Alert Service
 * Generates performance alerts based on campaign metrics and BPMN status
 */

import { Pool } from 'pg';

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

export class PerformanceAlertService {
  constructor(private pool: Pool) {}

  async getPerformanceAlerts(): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

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

      if (spend === 0 && impressions === 0) continue;

      const roas = spend > 0 ? revenue / spend : 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpl = leads > 0 ? spend / leads : 0;

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
      } else if (roas > 0 && roas < 5) {
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

    const priority = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => priority[a.type] - priority[b.type]);

    return alerts;
  }
}
