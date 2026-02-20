import type { OptimizationCenterRule } from '../../../types';
import type { OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'data.no-creatives',
  level: 'data',
  severity: 'info',
  category: 'data',
  action: 'sync',
  title: 'Sem dados de criativos',
  description: 'Não há métricas de criativos no período.',
  condition: 'Nenhum registro em ad_creative_metrics no período (snapshot não capturado).',
};

export const dataNoCreativesRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    if (ctx.enrichedCreatives.length > 0) return [];

    return [
      {
        id: 'creative-missing',
        ruleId: meta.id,
        severity: 'info',
        category: 'data',
        action: 'sync',
        title: 'Sem dados de criativos',
        description:
          'Não há métricas de criativos no período. Execute um sync da Meta com syncLevel "ad" ou "full" para capturar criativos e snapshots.',
        theme: toThemeInfo(ctx.primaryTheme),
      },
    ];
  },
};
