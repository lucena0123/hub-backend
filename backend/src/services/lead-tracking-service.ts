/**
 * Lead Tracking Service
 * Manages manual lead funnel data for service businesses (advocacy, consulting, etc.)
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface LeadTrackingInput {
  campaignId: string;
  date: string;
  qualifiedLeads?: number;
  disqualificationReasons?: Record<string, number>;
  contractsClosed?: number;
  averageTicket?: number;
  revenueGenerated?: number;
  leadsResponded?: number;
  responseTimeHours?: number;
  notes?: string;
}

export interface LeadTrackingRecord extends LeadTrackingInput {
  id: string;
  leadQualificationRate: number | null;
  closingRate: number | null;
  roi: number | null;
  costPerContract: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LeadTrackingService {
  constructor(private pool: Pool) {}

  private normalizeDisqualificationReasons(
    reasons?: Record<string, number>
  ): Record<string, number> | null {
    if (!reasons) return null;

    const normalizedEntries = Object.entries(reasons)
      .map(([key, value]) => [key.trim(), value] as const)
      .filter(([key, value]) => key.length > 0 && Number.isFinite(value) && value > 0)
      .map(([key, value]) => [key, Math.floor(value)] as const);

    if (normalizedEntries.length === 0) return null;
    return Object.fromEntries(normalizedEntries);
  }

  /**
   * Upsert lead tracking data for a campaign/date
   */
  async upsertLeadTracking(data: LeadTrackingInput): Promise<LeadTrackingRecord> {
    const id = uuidv4();

    // Fetch campaign metrics to calculate rates
    const metricsResult = await this.pool.query(
      `SELECT
        impressions, clicks, spend, leads, conversions,
        messaging_conversations, messaging_first_reply
       FROM campaign_metrics
       WHERE campaign_id = $1 AND date = $2
       LIMIT 1`,
      [data.campaignId, data.date]
    );

    const metrics = metricsResult.rows[0] || {};
    const totalLeads = metrics.messaging_conversations || metrics.leads || metrics.conversions || 0;
    const spend = metrics.spend || 0;

    // Calculate computed fields
    const qualifiedLeads = data.qualifiedLeads || 0;
    const contractsClosed = data.contractsClosed || 0;
    const revenueGenerated = data.revenueGenerated || 0;
    const disqualificationReasons = this.normalizeDisqualificationReasons(data.disqualificationReasons);

    const leadQualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : null;
    const closingRate = qualifiedLeads > 0 ? (contractsClosed / qualifiedLeads) * 100 : null;
    const roi = spend > 0 && revenueGenerated > 0 ? ((revenueGenerated - spend) / spend) * 100 : null;
    const costPerContract = contractsClosed > 0 && spend > 0 ? spend / contractsClosed : null;

    const result = await this.pool.query(
      `INSERT INTO campaign_lead_tracking (
        id, campaign_id, date,
        qualified_leads, contracts_closed, average_ticket, revenue_generated,
        leads_responded, response_time_hours, notes, disqualification_reasons,
        lead_qualification_rate, closing_rate, roi, cost_per_contract
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15)
      ON CONFLICT (campaign_id, date)
      DO UPDATE SET
        qualified_leads = EXCLUDED.qualified_leads,
        contracts_closed = EXCLUDED.contracts_closed,
        average_ticket = EXCLUDED.average_ticket,
        revenue_generated = EXCLUDED.revenue_generated,
        leads_responded = EXCLUDED.leads_responded,
        response_time_hours = EXCLUDED.response_time_hours,
        notes = EXCLUDED.notes,
        disqualification_reasons = EXCLUDED.disqualification_reasons,
        lead_qualification_rate = EXCLUDED.lead_qualification_rate,
        closing_rate = EXCLUDED.closing_rate,
        roi = EXCLUDED.roi,
        cost_per_contract = EXCLUDED.cost_per_contract,
        updated_at = NOW()
      RETURNING *`,
      [
        id,
        data.campaignId,
        data.date,
        qualifiedLeads,
        contractsClosed,
        data.averageTicket || 0,
        revenueGenerated,
        data.leadsResponded || 0,
        data.responseTimeHours || null,
        data.notes || null,
        disqualificationReasons ? JSON.stringify(disqualificationReasons) : null,
        leadQualificationRate,
        closingRate,
        roi,
        costPerContract,
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * Get lead tracking data for a campaign
   */
  async getLeadTracking(
    campaignId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<LeadTrackingRecord[]> {
    const { startDate, endDate, limit = 100, offset = 0 } = options || {};

    let query = `
      SELECT * FROM campaign_lead_tracking
      WHERE campaign_id = $1
    `;
    const params: any[] = [campaignId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapRow(row));
  }

  /**
   * Get aggregated lead tracking for a campaign (period summary)
   */
  async getLeadTrackingSummary(
    campaignId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalQualifiedLeads: number;
    totalContractsClosed: number;
    totalRevenue: number;
    avgQualificationRate: number;
    avgClosingRate: number;
    avgROI: number;
    avgCostPerContract: number;
  }> {
    const result = await this.pool.query(
      `SELECT
        SUM(qualified_leads) as total_qualified_leads,
        SUM(contracts_closed) as total_contracts_closed,
        SUM(revenue_generated) as total_revenue,
        AVG(lead_qualification_rate) as avg_qualification_rate,
        AVG(closing_rate) as avg_closing_rate,
        AVG(roi) as avg_roi,
        AVG(cost_per_contract) as avg_cost_per_contract
       FROM campaign_lead_tracking
       WHERE campaign_id = $1
         AND date >= $2
         AND date <= $3`,
      [campaignId, startDate, endDate]
    );

    const row = result.rows[0];
    return {
      totalQualifiedLeads: parseInt(row.total_qualified_leads || 0),
      totalContractsClosed: parseInt(row.total_contracts_closed || 0),
      totalRevenue: parseFloat(row.total_revenue || 0),
      avgQualificationRate: parseFloat(row.avg_qualification_rate || 0),
      avgClosingRate: parseFloat(row.avg_closing_rate || 0),
      avgROI: parseFloat(row.avg_roi || 0),
      avgCostPerContract: parseFloat(row.avg_cost_per_contract || 0),
    };
  }

  /**
   * Delete lead tracking record
   */
  async deleteLeadTracking(campaignId: string, date: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM campaign_lead_tracking WHERE campaign_id = $1 AND date = $2',
      [campaignId, date]
    );
    return (result.rowCount || 0) > 0;
  }

  private mapRow(row: any): LeadTrackingRecord {
    const disqualificationReasons =
      row.disqualification_reasons == null
        ? null
        : typeof row.disqualification_reasons === 'string'
          ? JSON.parse(row.disqualification_reasons)
          : row.disqualification_reasons;

    return {
      id: row.id,
      campaignId: row.campaign_id,
      date: row.date,
      qualifiedLeads: row.qualified_leads,
      disqualificationReasons,
      contractsClosed: row.contracts_closed,
      averageTicket: parseFloat(row.average_ticket || 0),
      revenueGenerated: parseFloat(row.revenue_generated || 0),
      leadsResponded: row.leads_responded,
      responseTimeHours: row.response_time_hours != null ? parseFloat(row.response_time_hours) : undefined,
      notes: row.notes,
      leadQualificationRate: row.lead_qualification_rate ? parseFloat(row.lead_qualification_rate) : null,
      closingRate: row.closing_rate ? parseFloat(row.closing_rate) : null,
      roi: row.roi ? parseFloat(row.roi) : null,
      costPerContract: row.cost_per_contract ? parseFloat(row.cost_per_contract) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
