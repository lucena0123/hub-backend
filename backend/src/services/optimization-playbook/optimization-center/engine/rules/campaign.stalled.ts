import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.stalled',
  level: 'campaign',
  severity: 'warning',
  category: 'campaign',
  action: 'review',
  title: 'Campanha ativa sem entrega',
  description: 'Campanha marcada como ativa, mas sem impressões/gasto.',
  condition: 'status=active AND spend_total=0 AND impressions_total=0',
};

export const campaignStalledRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.spendTotal !== 0 || facts.impressionsTotal !== 0) continue;
      if (facts.campaignStatus !== 'active') continue;

      items.push({
        id: `camp-stalled-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'warning',
        category: 'campaign',
        action: 'review',
        title: 'Campanha ativa sem entrega',
        description:
          'A campanha está marcada como ativa, mas não teve impressões/gasto no período selecionado. Verifique status, público, orçamento e limites na conta.',
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: { spend: facts.spendTotal, impressions: facts.impressionsTotal },
        thresholds: { minSpendForEvaluation: facts.minSpendForEvaluation },
      });
    }

    return items;
  },
};
