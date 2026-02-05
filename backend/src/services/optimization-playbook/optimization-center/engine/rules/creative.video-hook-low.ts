import type { OptimizationCenterRule } from '../../../types';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.video-hook-low',
  level: 'creative',
  severity: 'warning',
  category: 'creative',
  action: 'refresh',
  title: 'Hook baixo (vídeo)',
  description: 'Hook rate abaixo do mínimo sugerido no playbook.',
  condition: 'is_video AND spend_total >= creativeMinSpendWinner AND hook_rate_avg < hookRateMin',
};

export const creativeVideoHookLowRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    const lowHook = ctx.enrichedCreatives
      .filter((c: any) => {
        const hookRate = c.metrics.hookRateAvg;
        return (
          c.isVideo &&
          typeof hookRate === 'number' &&
          Number.isFinite(hookRate) &&
          hookRate > 0 &&
          hookRate < ctx.targets.hookRateMin &&
          (c.metrics.totalSpend || 0) >= ctx.targets.creativeMinSpendWinner
        );
      })
      .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
      .slice(0, 3);

    for (const c of lowHook as any[]) {
      items.push({
        id: `creative-hook-low-${c.snapshotId}`,
        ruleId: meta.id,
        severity: 'warning',
        category: 'creative',
        action: 'refresh',
        title: 'Hook baixo (vídeo)',
        description: `Hook rate ${c.metrics.hookRateAvg?.toFixed?.(1) ?? c.metrics.hookRateAvg}% abaixo do mínimo sugerido. Ajuste os 1–3 primeiros segundos (gancho/promessa/prova).`,
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'creative', id: c.snapshotId, name: c.headline },
        metrics: {
          spend: c.metrics.totalSpend,
          conversations: c.metrics.totalConversations,
          hookRateAvg: c.metrics.hookRateAvg ?? null,
        },
        thresholds: { hookRateMin: ctx.targets.hookRateMin },
      });
    }

    return items;
  },
};
