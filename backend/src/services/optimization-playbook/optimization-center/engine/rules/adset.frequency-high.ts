import type { OptimizationCenterRule } from '../../../types';
import { safeFloat } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'adset.frequency-high',
  level: 'adset',
  severity: 'warning',
  category: 'adset',
  action: 'review',
  title: 'Frequência alta no conjunto',
  description: 'A frequência do conjunto de anúncios está elevada, indicando saturação do público.',
  condition: 'avg_frequency_last7 >= 4.5',
};

export const adsetFrequencyHighRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];
    const adsetRows = ctx.adsetRows ?? [];

    for (const row of adsetRows) {
      const freq = safeFloat(row.avg_frequency_last7);
      if (freq < 4.5) continue;

      const severity = freq >= 6 ? 'critical' : 'warning';

      items.push({
        id: `adset-freq-high-${row.adset_id}`,
        ruleId: meta.id,
        severity,
        category: 'adset',
        action: 'review',
        title: 'Frequência alta no conjunto',
        description: `Frequência de ${freq.toFixed(1)} nos últimos 7 dias. ${freq >= 6 ? 'Público saturado — considere expandir ou trocar segmentação.' : 'Atenção: público pode estar saturando.'}`,
        theme: toThemeInfo(ctx.primaryTheme),
        entity: { type: 'adset', id: row.adset_id, name: row.adset_name },
        metrics: { frequency: freq, campaignId: row.campaign_id },
        thresholds: { warningThreshold: 4.5, criticalThreshold: 6 },
      });
    }

    return items;
  },
};
