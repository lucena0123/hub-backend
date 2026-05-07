import type { OptimizationCenterRule } from '../../../types';
import { formatCurrency, safeFloat, safeInt } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'adset.no-results',
  level: 'adset',
  severity: 'warning',
  category: 'adset',
  action: 'pause',
  title: 'Conjunto sem resultado primario',
  description: 'Conjunto com gasto relevante e zero resultado primario nos ultimos 7 dias.',
  condition: 'spend_last7 >= 150 AND primary_result_last7 = 0',
  appliesToObjectives: ['lead', 'conversion', 'traffic', 'awareness'],
};

export const adsetNoResultsRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const adsetRows = ctx.adsetRows ?? [];

    for (const row of adsetRows) {
      const spendLast7 = safeFloat(row.spend_last7);
      const primaryResultLast7 = safeInt(row.primary_result_last7);

      if (spendLast7 < 150) continue;
      if (primaryResultLast7 !== 0) continue;

      items.push({
        id: `adset-no-results-${row.adset_id}`,
        ruleId: meta.id,
        severity: spendLast7 >= 300 ? 'critical' : 'warning',
        category: 'adset',
        action: 'pause',
        title: 'Conjunto sem resultado primario',
        description: `${formatCurrency(spendLast7)} investidos nos ultimos 7 dias sem gerar resultado primario. Considere pausar ou revisar segmentacao.`,
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'adset', id: row.adset_id, name: row.adset_name },
        metrics: {
          spendLast7,
          primaryResultLast7,
          campaignId: row.campaign_id,
          objectiveKey: row.objective_class_key,
        },
        thresholds: { minSpend: 150 },
      });
    }

    return items;
  },
};
