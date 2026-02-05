import type { OptimizationCenterRule } from '../../../types';
import { inferOptimizationTheme } from '../../../theme';
import { getImportantCopyCandidates } from '../copy-candidates';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.copy-theme-not-mentioned',
  level: 'creative',
  severity: 'info',
  category: 'creative',
  action: 'refresh',
  title: 'Copy não cita o tema',
  description: 'O texto não contém termos do tema detectado. Considere explicitar o assunto para aumentar qualificação.',
  condition: 'theme != geral AND inferred_theme_from_copy = geral',
};

export const creativeCopyThemeNotMentionedRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const candidates = getImportantCopyCandidates(ctx);

    for (const c of candidates) {
      if (c.creativeTheme.themeKey === 'geral') continue;
      if (!c.combined) continue;

      const inferredFromCopy = inferOptimizationTheme(c.combined);
      if (inferredFromCopy.themeKey !== 'geral') continue;

      items.push({
        id: `creative-copy-theme-not-mentioned-${c.snapshotId}`,
        ruleId: meta.id,
        severity: 'info',
        category: 'creative',
        action: 'refresh',
        title: 'Copy não cita o tema',
        description: `Tema detectado: ${c.creativeTheme.themeName}, mas a copy não contém palavras-chave claras do tema. Sugestão: explicitar o assunto para aumentar qualificação.`,
        theme: toThemeInfo(c.creativeTheme),
        entity: { type: 'creative', id: c.snapshotId, name: c.headline ?? 'Criativo' },
        metrics: { spend: c.spend, conversations: c.conversations },
      });
    }

    return items;
  },
};
