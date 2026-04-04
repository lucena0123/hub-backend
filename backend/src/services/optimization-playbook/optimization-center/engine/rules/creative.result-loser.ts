import type { OptimizationCenterRule } from '../../../types';
import { formatCurrency } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.result-loser',
  level: 'creative',
  severity: 'warning',
  category: 'creative',
  action: 'pause',
  title: 'Criativo com baixo resultado',
  description: 'Gasto alto e resultado primario abaixo do esperado.',
  condition: 'spend_total >= creativeMinSpendLoser AND primary_result_low',
  appliesToObjectives: ['lead', 'conversion', 'traffic', 'awareness'],
};

export const creativeResultLoserRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    const losers = ctx.enrichedCreatives
      .filter((creative: any) => creative.status === 'loser')
      .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
      .slice(0, 3);

    for (const creative of losers as any[]) {
      const spend = creative.metrics.totalSpend || 0;
      const results = creative.metrics.totalConversations || 0;
      const severity = spend >= 400 && results === 0 ? 'critical' : 'warning';

      items.push({
        id: `creative-result-loser-${creative.snapshotId}`,
        ruleId: meta.id,
        severity,
        category: 'creative',
        action: 'pause',
        title: 'Criativo com baixo resultado',
        description: `${formatCurrency(spend)} de investimento com ${results} resultados primarios. Recomenda-se pausar/substituir este criativo.`,
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'creative', id: creative.snapshotId, name: creative.adNames?.[0] || creative.headline },
        metrics: {
          spend,
          primaryResults: results,
          resultCost: creative.metrics.cpl ?? null,
        },
        thresholds: {
          creativeMinSpendLoser: ctx.targets.creativeMinSpendLoser,
          creativeLoserCplMultiplier: ctx.targets.creativeLoserCplMultiplier,
        },
      });
    }

    return items;
  },
};
