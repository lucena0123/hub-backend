import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import { formatCurrency } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.result-cost-high',
  level: 'campaign',
  severity: 'critical',
  category: 'campaign',
  action: 'refresh',
  title: 'Custo por resultado primario alto',
  description: 'Custo por resultado primario acima do limite aceitavel para o perfil.',
  condition: 'cost_per_primary_result >= targetCplBadMin',
  appliesToObjectives: ['lead', 'conversion', 'traffic', 'awareness'],
};

export const campaignResultCostHighRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.costPerPrimaryResult == null) continue;
      if (facts.primaryResultLast7 < facts.targets.minContactsForEvaluation) continue;
      if (facts.spendLast7 < facts.minSpendForEvaluation) continue;
      if (facts.costPerPrimaryResult < facts.targets.targetCplBadMin) continue;

      items.push({
        id: `camp-result-cost-high-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'critical',
        category: 'campaign',
        action: 'refresh',
        title: 'Custo por resultado primario alto',
        description: `Custo por resultado em ${formatCurrency(facts.costPerPrimaryResult)} (limite ${formatCurrency(facts.targets.targetCplBadMin)}). Ajuste audiencia, criativo e oferta para reduzir custo.`,
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        thresholds: {
          targetResultCostBadMin: facts.targets.targetCplBadMin,
        },
        metrics: {
          spendLast7: facts.spendLast7,
          primaryResultLast7: facts.primaryResultLast7,
          costPerPrimaryResult: facts.costPerPrimaryResult,
          objectiveKey: facts.objectiveKey,
        },
      });
    }

    return items;
  },
};
