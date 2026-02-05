import type { OptimizationCenterRule } from '../../../types';
import { getImportantCopyCandidates } from '../copy-candidates';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.copy-insights-missing',
  level: 'creative',
  severity: 'info',
  category: 'creative',
  action: 'review',
  title: 'Sem insights de copy',
  description:
    'Ainda não há análise de copy para este criativo (título/texto/CTA). Gere sugestões para acelerar a otimização.',
  condition: 'highlighted_creative AND no row in creative_copy_insights for snapshot',
};

export const creativeCopyInsightsMissingRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const candidates = getImportantCopyCandidates(ctx);

    for (const c of candidates) {
      if ((c.creative as any).copyInsightsStatus) continue;

      items.push({
        id: `creative-copy-insights-missing-${c.snapshotId}`,
        ruleId: meta.id,
        severity: 'info',
        category: 'creative',
        action: 'review',
        title: 'Sem insights de copy',
        description:
          'Ainda não há análise de copy salva para este criativo. Gere sugestões (IA/fallback) e use como base para novas variações.',
        theme: toThemeInfo(c.creativeTheme),
        entity: { type: 'creative', id: c.snapshotId, name: c.headline ?? 'Criativo' },
        metrics: { spend: c.spend, conversations: c.conversations, cpl: (c.creative as any).metrics?.cpl ?? null },
      });
    }

    return items;
  },
};
