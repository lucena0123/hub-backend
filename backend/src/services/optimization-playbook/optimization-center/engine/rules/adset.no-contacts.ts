import type { OptimizationCenterRule } from '../../../types';
import { formatCurrency, safeFloat, safeInt } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'adset.no-contacts',
  level: 'adset',
  severity: 'warning',
  category: 'adset',
  action: 'pause',
  title: 'Conjunto sem conversas',
  description: 'Conjunto de anúncios com gasto relevante e nenhuma conversa nos últimos 7 dias.',
  condition: 'spend_last7 >= R$150 AND conversations_last7 = 0',
  appliesToObjectives: ['messages'],
};

export const adsetNoContactsRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const adsetRows = ctx.adsetRows ?? [];

    for (const row of adsetRows) {
      const spendLast7 = safeFloat(row.spend_last7);
      const conversationsLast7 = safeInt(row.conversations_last7);

      if (spendLast7 < 150) continue;
      if (conversationsLast7 !== 0) continue;

      items.push({
        id: `adset-no-contacts-${row.adset_id}`,
        ruleId: meta.id,
        severity: spendLast7 >= 300 ? 'critical' : 'warning',
        category: 'adset',
        action: 'pause',
        title: 'Conjunto sem conversas',
        description: `${formatCurrency(spendLast7)} investidos nos últimos 7 dias sem gerar conversas. Considere pausar ou revisar segmentação.`,
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'adset', id: row.adset_id, name: row.adset_name },
        metrics: { spendLast7, conversationsLast7, campaignId: row.campaign_id },
        thresholds: { minSpend: 150 },
      });
    }

    return items;
  },
};
