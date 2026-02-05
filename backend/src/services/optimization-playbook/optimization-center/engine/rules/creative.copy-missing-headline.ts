import type { OptimizationCenterRule } from '../../../types';
import { getImportantCopyCandidates } from '../copy-candidates';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.copy-missing-headline',
  level: 'creative',
  severity: 'warning',
  category: 'creative',
  action: 'refresh',
  title: 'Criativo sem título (headline)',
  description: 'O snapshot não possui headline (título). Isso dificulta comparar variações e otimizar copy.',
  condition: 'headline is null/empty (and dynamic headlines missing)',
};

export const creativeCopyMissingHeadlineRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const candidates = getImportantCopyCandidates(ctx);

    for (const c of candidates) {
      if (c.headline) continue;

      items.push({
        id: `creative-copy-missing-headline-${c.snapshotId}`,
        ruleId: meta.id,
        severity: 'warning',
        category: 'creative',
        action: 'refresh',
        title: 'Criativo sem título (headline)',
        description:
          'O snapshot não possui headline (título). Preencha um título curto e claro para aumentar clique e facilitar testes.',
        theme: toThemeInfo(c.creativeTheme),
        entity: { type: 'creative', id: c.snapshotId, name: 'Criativo' },
        metrics: { spend: c.spend, conversations: c.conversations },
        thresholds: {
          copyHeadlineMinChars: c.creativeTargets.copyHeadlineMinChars,
          copyHeadlineMaxChars: c.creativeTargets.copyHeadlineMaxChars,
        },
      });
    }

    return items;
  },
};
