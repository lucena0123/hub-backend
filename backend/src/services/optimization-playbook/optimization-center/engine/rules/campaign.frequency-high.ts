import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.frequency-high',
  level: 'campaign',
  severity: 'warning',
  category: 'campaign',
  action: 'refresh',
  title: 'Frequência alta (saturação)',
  description: 'Frequência elevada sugere fadiga de criativo e público pequeno.',
  condition: 'avg_frequency_last7 >= frequencyWarning',
};

export const campaignFrequencyHighRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.spendLast7 < facts.minSpendForEvaluation) continue;

      if (facts.avgFrequencyLast7 >= facts.targets.frequencyCritical) {
        items.push({
          id: `camp-frequency-critical-${facts.campaignId}`,
          ruleId: meta.id,
          severity: 'critical',
          category: 'campaign',
          action: 'refresh',
          title: 'Frequência muito alta (saturação)',
          description: `Frequência média ${facts.avgFrequencyLast7.toFixed(2)}x nos últimos 7 dias. Sinal de saturação: priorize renovação de criativos e/ou ampliar público.`,
          theme: toThemeInfo(facts.theme),
          entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
          metrics: { avgFrequencyLast7: facts.avgFrequencyLast7, avgCpmLast7: facts.avgCpmLast7 },
          thresholds: {
            frequencyWarning: facts.targets.frequencyWarning,
            frequencyCritical: facts.targets.frequencyCritical,
          },
        });
      } else if (facts.avgFrequencyLast7 >= facts.targets.frequencyWarning) {
        items.push({
          id: `camp-frequency-warning-${facts.campaignId}`,
          ruleId: meta.id,
          severity: 'warning',
          category: 'campaign',
          action: 'refresh',
          title: 'Frequência alta (atenção)',
          description: `Frequência média ${facts.avgFrequencyLast7.toFixed(2)}x nos últimos 7 dias. Comece a renovar criativos para evitar queda por fadiga.`,
          theme: toThemeInfo(facts.theme),
          entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
          metrics: { avgFrequencyLast7: facts.avgFrequencyLast7, avgCpmLast7: facts.avgCpmLast7 },
          thresholds: { frequencyWarning: facts.targets.frequencyWarning },
        });
      }
    }

    return items;
  },
};
