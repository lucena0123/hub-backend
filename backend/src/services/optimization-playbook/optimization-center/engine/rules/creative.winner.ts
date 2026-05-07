import type { OptimizationCenterRule } from '../../../types';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.winner',
  level: 'creative',
  severity: 'opportunity',
  category: 'creative',
  action: 'scale',
  title: 'Criativo vencedor',
  description: 'Criativo no topo do período e com CPL dentro do alvo do tema.',
  condition: 'eligible AND rank_in_top_percentile AND cpl <= targetCplGoodMax AND NOT fatigued',
  appliesToObjectives: ['messages'],
};

export const creativeWinnerRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    const topWinners = ctx.winners
      .filter((c: any) => typeof c.metrics.cpl === 'number' && c.metrics.cpl <= ctx.targets.targetCplGoodMax)
      .slice(0, 2);

    for (const c of topWinners as any[]) {
      items.push({
        id: `creative-winner-${c.snapshotId}`,
        ruleId: meta.id,
        severity: 'opportunity',
        category: 'creative',
        action: 'scale',
        title: 'Criativo vencedor',
        description:
          'Este criativo está entre os melhores do período. Use como referência para novas variações e para sustentar escala sem fadiga.',
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'creative', id: c.snapshotId, name: c.adNames?.[0] || c.headline },
        metrics: {
          spend: c.metrics.totalSpend,
          conversations: c.metrics.totalConversations,
          cpl: c.metrics.cpl ?? null,
        },
        thresholds: { targetCplGoodMax: ctx.targets.targetCplGoodMax },
      });
    }

    return items;
  },
};
