import type { OptimizationCenterRule } from '../../../types';
import { getImportantCopyCandidates } from '../copy-candidates';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.copy-primary-too-long',
  level: 'creative',
  severity: 'info',
  category: 'creative',
  action: 'refresh',
  title: 'Texto principal muito longo',
  description: 'Texto principal acima do recomendado. Prefira frases curtas e diretas para gerar conversas no WhatsApp.',
  condition: 'primary_text_length > copyPrimaryTextMaxChars',
};

export const creativeCopyPrimaryTooLongRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const candidates = getImportantCopyCandidates(ctx);

    for (const c of candidates) {
      if (!c.primaryText) continue;

      // Check if any campaign objective is explicitly messaging-related
      const isMessaging =
        c.objectives.length > 0 &&
        c.objectives.some((obj) =>
          ['OUTCOME_LEADS', 'OUTCOME_MESSAGES', 'MESSAGES'].includes(obj)
        );

      if (!isMessaging) continue;

      if (c.primaryText.length <= c.creativeTargets.copyPrimaryTextMaxChars) continue;

      items.push({
        id: `creative-copy-primary-too-long-${c.snapshotId}`,
        ruleId: meta.id,
        severity: 'info',
        category: 'creative',
        action: 'refresh',
        title: 'Texto principal muito longo',
        description: `Texto com ${c.primaryText.length} caracteres. Para WhatsApp, prefira algo curto e direto (≤ ${c.creativeTargets.copyPrimaryTextMaxChars}).`,
        theme: toThemeInfo(c.creativeTheme),
        entity: { type: 'creative', id: c.snapshotId, name: c.adNames?.[0] || c.headline || 'Criativo' },
        metrics: { spend: c.spend, conversations: c.conversations },
        thresholds: { copyPrimaryTextMaxChars: c.creativeTargets.copyPrimaryTextMaxChars },
      });
    }

    return items;
  },
};
