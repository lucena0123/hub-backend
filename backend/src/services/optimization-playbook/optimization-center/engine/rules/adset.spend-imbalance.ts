import type { OptimizationCenterRule } from '../../../types';
import { formatCurrency, safeFloat, safeInt } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'adset.spend-imbalance',
  level: 'adset',
  severity: 'warning',
  category: 'adset',
  action: 'review',
  title: 'Desbalanceamento de gasto entre conjuntos',
  description: 'Um conjunto consome mais de 80% do orçamento com CPL pior que a média.',
  condition: 'adset_spend_share > 80% AND adset_cpl > campaign_avg_cpl',
};

export const adsetSpendImbalanceRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const adsetsByCampaign = ctx.adsetsByCampaign ?? new Map();

    for (const [campaignId, adsets] of adsetsByCampaign) {
      if (adsets.length < 2) continue;

      const totalSpend = adsets.reduce((s: number, a: any) => s + safeFloat(a.spend_last7), 0);
      const totalConv = adsets.reduce((s: number, a: any) => s + safeInt(a.conversations_last7), 0);
      if (totalSpend < 100 || totalConv < 2) continue;

      const avgCpl = totalSpend / totalConv;

      for (const row of adsets) {
        const spend = safeFloat(row.spend_last7);
        const conv = safeInt(row.conversations_last7);
        const share = (spend / totalSpend) * 100;
        const cpl = conv > 0 ? spend / conv : Infinity;

        if (share <= 80) continue;
        if (cpl <= avgCpl) continue;

        items.push({
          id: `adset-spend-imbalance-${row.adset_id}`,
          ruleId: meta.id,
          severity: 'warning',
          category: 'adset',
          action: 'review',
          title: 'Desbalanceamento de gasto entre conjuntos',
          description: `Este conjunto consome ${share.toFixed(0)}% do gasto (${formatCurrency(spend)}) com CPL de ${conv > 0 ? formatCurrency(cpl) : '∞'}, acima da média da campanha (${formatCurrency(avgCpl)}). Redistribua orçamento para conjuntos mais eficientes.`,
          theme: toThemeInfo(ctx.primaryTheme),
          entity: { type: 'adset', id: row.adset_id, name: row.adset_name },
          metrics: { spend, spendShare: share, cpl: conv > 0 ? cpl : null, avgCpl, conversations: conv, campaignId },
          thresholds: { minSharePct: 80 },
        });
      }
    }

    return items;
  },
};
