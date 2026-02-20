import type { OptimizationCenterRule } from '../../../types';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'creative.video-hold-low',
  level: 'creative',
  severity: 'info',
  category: 'creative',
  action: 'refresh',
  title: 'Hold baixo (vídeo)',
  description: 'Hold rate abaixo do mínimo sugerido; otimizar narrativa e ritmo.',
  condition: 'is_video AND spend_total >= creativeMinSpendWinner AND hold_rate_avg < holdRateMin',
};

export const creativeVideoHoldLowRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    const lowHold = ctx.enrichedCreatives
      .filter((c: any) => {
        const holdRate = c.metrics.holdRateAvg;
        return (
          c.isVideo &&
          typeof holdRate === 'number' &&
          Number.isFinite(holdRate) &&
          holdRate > 0 &&
          holdRate < ctx.targets.holdRateMin &&
          (c.metrics.totalSpend || 0) >= ctx.targets.creativeMinSpendWinner
        );
      })
      .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
      .slice(0, 3);

    for (const c of lowHold as any[]) {
      items.push({
        id: `creative-hold-low-${c.snapshotId}`,
        ruleId: meta.id,
        severity: 'info',
        category: 'creative',
        action: 'refresh',
        title: 'Hold baixo (vídeo)',
        description: `Hold rate ${c.metrics.holdRateAvg?.toFixed?.(1) ?? c.metrics.holdRateAvg}% abaixo do mínimo sugerido. Ajuste ritmo, estrutura e clareza da mensagem.`,
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'creative', id: c.snapshotId, name: c.headline },
        metrics: {
          spend: c.metrics.totalSpend,
          conversations: c.metrics.totalConversations,
          holdRateAvg: c.metrics.holdRateAvg ?? null,
        },
        thresholds: { holdRateMin: ctx.targets.holdRateMin },
      });
    }

    return items;
  },
};
