import type { OptimizationCenterRule } from '../../../types';
import { formatCurrency, safeFloat, safeInt } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'adset.cpl-high',
  level: 'adset',
  severity: 'warning',
  category: 'adset',
  action: 'review',
  title: 'CPL do conjunto acima da média',
  description: 'Custo por conversa do conjunto é 1.5x maior que a média da campanha.',
  condition: 'adset_cpl >= campaign_avg_cpl * 1.5 AND conversations >= 2',
};

export const adsetCplHighRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const adsetsByCampaign = ctx.adsetsByCampaign ?? new Map();

    for (const [campaignId, adsets] of adsetsByCampaign) {
      const totalSpend = adsets.reduce((s: number, a: any) => s + safeFloat(a.spend_last7), 0);
      const totalConv = adsets.reduce((s: number, a: any) => s + safeInt(a.conversations_last7), 0);
      if (totalConv < 3) continue;

      const avgCpl = totalSpend / totalConv;

      for (const row of adsets) {
        const conv = safeInt(row.conversations_last7);
        const spend = safeFloat(row.spend_last7);
        if (conv < 2) continue;

        const cpl = spend / conv;
        if (cpl < avgCpl * 1.5) continue;

        items.push({
          id: `adset-cpl-high-${row.adset_id}`,
          ruleId: meta.id,
          severity: cpl >= avgCpl * 2 ? 'critical' : 'warning',
          category: 'adset',
          action: 'review',
          title: 'CPL do conjunto acima da média',
          description: `CPL de ${formatCurrency(cpl)} é ${(cpl / avgCpl).toFixed(1)}x a média da campanha (${formatCurrency(avgCpl)}). Revise segmentação ou criativos deste conjunto.`,
          theme: toThemeInfo(ctx.primaryTheme),
          entity: { type: 'adset', id: row.adset_id, name: row.adset_name },
          metrics: { cpl, avgCpl, spend, conversations: conv, campaignId },
          thresholds: { multiplier: 1.5 },
        });
      }
    }

    return items;
  },
};
