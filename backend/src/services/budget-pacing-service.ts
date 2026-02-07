/**
 * BudgetPacingService — calculates budget consumption pacing per campaign.
 */

import type { Pool } from 'pg';

export interface CampaignPacing {
  campaignId: string;
  campaignName: string;
  status: string;
  dailyBudget: number;
  spendToday: number;
  spendThisMonth: number;
  daysElapsed: number;
  daysInMonth: number;
  daysRemaining: number;
  expectedSpendToDate: number;
  pacingPercentage: number;
  pacingStatus: 'on_track' | 'under_pacing' | 'over_pacing';
  projectedMonthlySpend: number;
  remainingBudget: number;
}

export class BudgetPacingService {
  constructor(private pool: Pool) {}

  async calculatePacing(clientId: string): Promise<CampaignPacing[]> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysRemaining = daysInMonth - day;

    const todayStr = now.toISOString().split('T')[0];

    // Get active campaigns with budget info + spend this month
    const result = await this.pool.query(
      `SELECT
        c.id AS campaign_id,
        c.name AS campaign_name,
        c.status,
        c.budget AS campaign_budget,
        COALESCE(
          (SELECT SUM(cm.spend) FROM campaign_metrics cm WHERE cm.campaign_id = c.id AND cm.date = $2),
          0
        ) AS spend_today,
        COALESCE(
          (SELECT SUM(cm.spend) FROM campaign_metrics cm WHERE cm.campaign_id = c.id AND cm.date >= DATE_TRUNC('month', $2::date)),
          0
        ) AS spend_this_month
      FROM campaigns c
      WHERE c."clientId" = $1
        AND c.status IN ('ACTIVE', 'active')
      ORDER BY c.name`,
      [clientId, todayStr]
    );

    return result.rows.map((row: any) => {
      const dailyBudget = Number(row.campaign_budget ?? 0);

      const spendToday = Number(row.spend_today ?? 0);
      const spendThisMonth = Number(row.spend_this_month ?? 0);

      const expectedSpendToDate = dailyBudget * day;
      const pacingPercentage = expectedSpendToDate > 0
        ? Math.round((spendThisMonth / expectedSpendToDate) * 100)
        : 0;

      let pacingStatus: CampaignPacing['pacingStatus'] = 'on_track';
      if (pacingPercentage < 80) pacingStatus = 'under_pacing';
      else if (pacingPercentage > 120) pacingStatus = 'over_pacing';

      const projectedMonthlySpend = day > 0
        ? Math.round((spendThisMonth / day) * daysInMonth * 100) / 100
        : 0;

      const expectedMonthlyBudget = dailyBudget * daysInMonth;
      const remainingBudget = Math.max(0, expectedMonthlyBudget - spendThisMonth);

      return {
        campaignId: String(row.campaign_id),
        campaignName: String(row.campaign_name),
        status: String(row.status),
        dailyBudget,
        spendToday,
        spendThisMonth,
        daysElapsed: day,
        daysInMonth,
        daysRemaining,
        expectedSpendToDate,
        pacingPercentage,
        pacingStatus,
        projectedMonthlySpend,
        remainingBudget,
      };
    });
  }
}
