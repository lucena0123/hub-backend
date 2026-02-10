import type { OptimizationCenterRule } from '../../../types';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.fatigued',
  level: 'creative',
  severity: 'warning',
  category: 'creative',
  action: 'refresh',
  title: 'Sinal de fadiga de criativo',
  description: 'Perda de performance comparando últimos 7 dias vs 7 dias anteriores.',
  condition: 'conversations_prev7 >= creativeFatigueMinPrevConversations AND delta_contacts_pct <= creativeFatigueDropPct',
};

export const creativeFatiguedRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    const fatigued = ctx.enrichedCreatives
      .filter((c: any) => c.status === 'fatigued')
      .sort((a: any, b: any) => (b.recent.spend || 0) - (a.recent.spend || 0))
      .slice(0, 3);

    for (const c of fatigued as any[]) {
      items.push({
        id: `creative-fatigued-${c.snapshotId}`,
        ruleId: meta.id,
        severity: 'warning',
        category: 'creative',
        action: 'refresh',
        title: 'Sinal de fadiga de criativo',
        description:
          'O criativo perdeu desempenho nos últimos 7 dias. Ação: manter o ângulo vencedor e testar novas variações de título/primeiro segundo/CTA.',
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'creative', id: c.snapshotId, name: c.adNames?.[0] || c.headline },
        metrics: {
          recentConversations: c.recent.conversations,
          previousConversations: c.previous.conversations,
          recentCpl: c.recent.cpl ?? null,
          previousCpl: c.previous.cpl ?? null,
        },
        thresholds: {
          creativeFatigueDropPct: ctx.targets.creativeFatigueDropPct,
          creativeFatigueCplMultiplier: ctx.targets.creativeFatigueCplMultiplier,
        },
        autoAction: {
          type: 'pause_ad',
          entityId: c.snapshotId,
          reason: 'Creative Fatigued: Performance drop detected',
        },
      });
    }

    return items;
  },
};
