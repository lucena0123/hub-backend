import type { OptimizationCenterRule } from '../../../types';
import { formatCurrency } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.loser',
  level: 'creative',
  severity: 'warning',
  category: 'creative',
  action: 'pause',
  title: 'Criativo com baixo desempenho',
  description: 'Alto gasto com pouco/nenhum resultado de conversas.',
  condition:
    'spend_total >= creativeMinSpendLoser AND (conversations_total=0 OR cpl >= median_cpl * creativeLoserCplMultiplier)',
};

export const creativeLoserRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    const losers = ctx.enrichedCreatives
      .filter((c: any) => c.status === 'loser')
      .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
      .slice(0, 3);

    for (const c of losers as any[]) {
      const spend = c.metrics.totalSpend || 0;
      const conv = c.metrics.totalConversations || 0;
      const severity = spend >= 400 && conv === 0 ? 'critical' : 'warning';

      items.push({
        id: `creative-loser-${c.snapshotId}`,
        ruleId: meta.id,
        severity,
        category: 'creative',
        action: 'pause',
        title: 'Criativo com baixo desempenho',
        description: `${formatCurrency(spend)} de investimento com ${conv} conversas. Recomenda-se pausar/substituir e criar novas variações (copy/CTA/gancho).`,
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'creative', id: c.snapshotId, name: c.adNames?.[0] || c.headline },
        metrics: { spend, conversations: conv, cpl: c.metrics.cpl ?? null },
        thresholds: {
          creativeMinSpendLoser: ctx.targets.creativeMinSpendLoser,
          creativeLoserCplMultiplier: ctx.targets.creativeLoserCplMultiplier,
        },
      });
    }

    return items;
  },
};
