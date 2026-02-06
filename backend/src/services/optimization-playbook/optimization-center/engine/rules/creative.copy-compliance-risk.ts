import type { OptimizationCenterRule } from '../../../types';
import { getImportantCopyCandidates, normalizeCopyForMatch } from '../copy-candidates';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.copy-compliance-risk',
  level: 'creative',
  severity: 'warning',
  category: 'creative',
  action: 'review',
  title: 'Risco de promessa (copy)',
  description: 'Copy contém termos de promessa absoluta (ex.: “garantido”, “100%”). Ajuste para reduzir risco e reprovação.',
  condition: 'copy contains prohibited phrase',
};

export const creativeCopyComplianceRiskRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const candidates = getImportantCopyCandidates(ctx);

    const prohibitedPhrases = ctx.playbookCopy?.prohibitedPhrases ?? [];

    for (const c of candidates) {
      if (!c.combinedNormalized) continue;
      if (prohibitedPhrases.length === 0) continue;

      const matched = prohibitedPhrases.find((phrase) => c.combinedNormalized.includes(normalizeCopyForMatch(phrase)));
      if (!matched) continue;

      items.push({
        id: `creative-copy-compliance-risk-${c.snapshotId}`,
        ruleId: meta.id,
        severity: 'warning',
        category: 'creative',
        action: 'review',
        title: 'Risco de promessa (copy)',
        description: `Detectado termo de promessa absoluta (“${matched}”). Ajuste a copy para evitar promessas e reduzir risco de reprovação.`,
        theme: toThemeInfo(c.creativeTheme),
        entity: { type: 'creative', id: c.snapshotId, name: c.adNames?.[0] || c.headline || 'Criativo' },
        metrics: { spend: c.spend, conversations: c.conversations },
        thresholds: { prohibitedPhrase: matched },
      });
    }

    return items;
  },
};
