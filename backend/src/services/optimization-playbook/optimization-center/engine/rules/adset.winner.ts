import type { OptimizationCenterRule } from '../../../types';
import { formatCurrency, safeFloat, safeInt } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'adset.winner',
  level: 'adset',
  severity: 'opportunity',
  category: 'adset',
  action: 'scale',
  title: 'Conjunto com melhor desempenho',
  description: 'Conjunto de anúncios com o menor CPL e mínimo de 5 conversas na campanha.',
  condition: 'best_cpl_in_campaign AND conversations >= 5',
};

export const adsetWinnerRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const adsetsByCampaign = ctx.adsetsByCampaign ?? new Map();

    for (const [campaignId, adsets] of adsetsByCampaign) {
      if (adsets.length < 2) continue;

      const eligible = adsets
        .map((row: any) => {
          const conv = safeInt(row.conversations_last7);
          const spend = safeFloat(row.spend_last7);
          const cpl = conv > 0 ? spend / conv : Infinity;
          return { ...row, conv, spend, cpl };
        })
        .filter((a: any) => a.conv >= 5)
        .sort((a: any, b: any) => a.cpl - b.cpl);

      if (eligible.length === 0) continue;

      const best = eligible[0];

      items.push({
        id: `adset-winner-${best.adset_id}`,
        ruleId: meta.id,
        severity: 'opportunity',
        category: 'adset',
        action: 'scale',
        title: 'Conjunto com melhor desempenho',
        description: `Melhor CPL da campanha: ${formatCurrency(best.cpl)} com ${best.conv} conversas. Considere aumentar o orçamento deste conjunto.`,
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'adset', id: best.adset_id, name: best.adset_name },
        metrics: { cpl: best.cpl, conversations: best.conv, spend: best.spend, campaignId },
        thresholds: { minConversations: 5 },
      });
    }

    return items;
  },
};
