import type { OptimizationCenterRule } from '../../../types';
import { getImportantCopyCandidates } from '../copy-candidates';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.copy-headline-length',
  level: 'creative',
  severity: 'info',
  category: 'creative',
  action: 'refresh',
  title: 'Título fora do recomendado',
  description: 'Headline muito curto/long. Ajuste para melhorar clareza e impacto.',
  condition: 'headline_length < copyHeadlineMinChars OR headline_length > copyHeadlineMaxChars',
};

export const creativeCopyHeadlineLengthRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const candidates = getImportantCopyCandidates(ctx);

    for (const c of candidates) {
      const headline = c.headline;
      if (!headline) continue;

      if (
        headline.length < c.creativeTargets.copyHeadlineMinChars ||
        headline.length > c.creativeTargets.copyHeadlineMaxChars
      ) {
        const reason =
          headline.length < c.creativeTargets.copyHeadlineMinChars
            ? `muito curto (${headline.length} chars)`
            : `muito longo (${headline.length} chars)`;

        items.push({
          id: `creative-copy-headline-length-${c.snapshotId}`,
          ruleId: meta.id,
          severity: 'info',
          category: 'creative',
          action: 'refresh',
          title: 'Título fora do recomendado',
          description: `Headline ${reason}. Ajuste para ficar entre ${c.creativeTargets.copyHeadlineMinChars} e ${c.creativeTargets.copyHeadlineMaxChars} caracteres.`,
          theme: toThemeInfo(c.creativeTheme),
          entity: { type: 'creative', id: c.snapshotId, name: headline },
          metrics: { spend: c.spend, conversations: c.conversations },
          thresholds: {
            copyHeadlineMinChars: c.creativeTargets.copyHeadlineMinChars,
            copyHeadlineMaxChars: c.creativeTargets.copyHeadlineMaxChars,
          },
        });
      }
    }

    return items;
  },
};
