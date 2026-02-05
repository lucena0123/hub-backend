import type { OptimizationCenterRule } from '../../../types';
import { getImportantCopyCandidates } from '../copy-candidates';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.copy-cta-mismatch',
  level: 'creative',
  severity: 'warning',
  category: 'creative',
  action: 'refresh',
  title: 'CTA pouco compatível com conversa',
  description: 'CTA não é WhatsApp/Mensagem. Isso pode reduzir conversas iniciadas.',
  condition: 'cta_type not in preferredCtaTypes',
};

export const creativeCopyCtaMismatchRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const candidates = getImportantCopyCandidates(ctx);

    const preferredCtas = ctx.playbookCopy?.preferredCtaTypes ?? ['WHATSAPP_MESSAGE', 'SEND_MESSAGE'];

    for (const c of candidates) {
      if (!c.ctaType) continue;
      if (preferredCtas.includes(c.ctaType)) continue;

      items.push({
        id: `creative-copy-cta-mismatch-${c.snapshotId}`,
        ruleId: meta.id,
        severity: 'warning',
        category: 'creative',
        action: 'refresh',
        title: 'CTA pouco compatível com conversa',
        description: `CTA atual: ${c.ctaType}. Para campanhas de conversa, teste ${preferredCtas.join(' / ')}.`,
        theme: toThemeInfo(c.creativeTheme),
        entity: { type: 'creative', id: c.snapshotId, name: c.headline ?? 'Criativo' },
        metrics: { spend: c.spend, conversations: c.conversations, cpl: (c.creative as any).metrics?.cpl ?? null },
        thresholds: { preferredCtaTypes: preferredCtas.join(',') },
      });
    }

    return items;
  },
};
