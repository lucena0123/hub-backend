import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import { formatCurrency } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.no-results',
  level: 'campaign',
  severity: 'critical',
  category: 'campaign',
  action: 'refresh',
  title: 'Gasto sem resultado primario',
  description: 'Campanha com gasto relevante e nenhum resultado primario nos ultimos 7 dias.',
  condition: 'spend_last7 >= minSpendForEvaluation AND primary_result_last7 = 0',
  appliesToObjectives: ['lead', 'conversion', 'traffic', 'awareness'],
};

export const campaignNoResultsRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.spendLast7 < facts.minSpendForEvaluation) continue;
      if (facts.primaryResultLast7 !== 0) continue;

      items.push({
        id: `camp-no-results-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'critical',
        category: 'campaign',
        action: 'refresh',
        title: 'Gasto sem resultado primario',
        description: `${formatCurrency(facts.spendLast7)} investidos nos ultimos 7 dias sem gerar ${facts.primaryResultLabel}. Revise segmentacao, criativos e evento de otimizacao.`,
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: {
          spendLast7: facts.spendLast7,
          primaryResultLast7: facts.primaryResultLast7,
          objectiveKey: facts.objectiveKey,
        },
        thresholds: { minSpendForEvaluation: facts.minSpendForEvaluation },
      });
    }

    return items;
  },
};
