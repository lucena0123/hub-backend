import type { OptimizationCenterRule } from '../../../types';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.result-winner',
  level: 'creative',
  severity: 'opportunity',
  category: 'creative',
  action: 'scale',
  title: 'Criativo vencedor por resultado',
  description: 'Criativo com resultado primario forte e custo dentro da meta.',
  condition: 'rank_top AND result_cost <= targetCplGoodMax',
  appliesToObjectives: ['lead', 'conversion', 'traffic', 'awareness'],
};

export const creativeResultWinnerRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    const topWinners = ctx.winners
      .filter((creative: any) => typeof creative.metrics.cpl === 'number' && creative.metrics.cpl <= ctx.targets.targetCplGoodMax)
      .slice(0, 2);

    for (const creative of topWinners as any[]) {
      items.push({
        id: `creative-result-winner-${creative.snapshotId}`,
        ruleId: meta.id,
        severity: 'opportunity',
        category: 'creative',
        action: 'scale',
        title: 'Criativo vencedor por resultado',
        description:
          'Criativo com desempenho acima da media no objetivo atual. Use este padrao para iterar variacoes e escalar com controle.',
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'creative', id: creative.snapshotId, name: creative.adNames?.[0] || creative.headline },
        metrics: {
          spend: creative.metrics.totalSpend,
          primaryResults: creative.metrics.totalConversations,
          resultCost: creative.metrics.cpl ?? null,
        },
        thresholds: { targetResultCostGoodMax: ctx.targets.targetCplGoodMax },
      });
    }

    return items;
  },
};
