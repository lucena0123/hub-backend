import type { OptimizationCenterRule } from '../../../types';
import { formatCurrency, safeFloat, safeInt } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'adset.result-cost-high',
  level: 'adset',
  severity: 'warning',
  category: 'adset',
  action: 'review',
  title: 'Custo por resultado alto no conjunto',
  description: 'Conjunto com custo por resultado 1.5x acima da media da campanha.',
  condition: 'adset_result_cost >= campaign_avg_result_cost * 1.5',
  appliesToObjectives: ['lead', 'conversion', 'traffic', 'awareness'],
};

export const adsetResultCostHighRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const adsetsByCampaign = ctx.adsetsByCampaign ?? new Map();

    for (const [campaignId, adsets] of adsetsByCampaign) {
      const totalSpend = adsets.reduce((sum: number, row: any) => sum + safeFloat(row.spend_last7), 0);
      const totalResults = adsets.reduce((sum: number, row: any) => sum + safeInt(row.primary_result_last7), 0);
      if (totalResults < 3) continue;

      const avgResultCost = totalSpend / totalResults;

      for (const row of adsets) {
        const resultLast7 = safeInt(row.primary_result_last7);
        const spendLast7 = safeFloat(row.spend_last7);
        if (resultLast7 < 2) continue;

        const resultCost = spendLast7 / resultLast7;
        if (resultCost < avgResultCost * 1.5) continue;

        items.push({
          id: `adset-result-cost-high-${row.adset_id}`,
          ruleId: meta.id,
          severity: resultCost >= avgResultCost * 2 ? 'critical' : 'warning',
          category: 'adset',
          action: 'review',
          title: 'Custo por resultado alto no conjunto',
          description: `Custo por resultado de ${formatCurrency(resultCost)} está ${(resultCost / avgResultCost).toFixed(1)}x acima da media da campanha (${formatCurrency(avgResultCost)}).`,
          theme: toThemeInfo(ctx.primaryTheme),
          entity: { type: 'adset', id: row.adset_id, name: row.adset_name },
          metrics: {
            resultCost,
            avgResultCost,
            spendLast7,
            resultLast7,
            campaignId,
            objectiveKey: row.objective_class_key,
          },
          thresholds: { multiplier: 1.5 },
        });
      }
    }

    return items;
  },
};
