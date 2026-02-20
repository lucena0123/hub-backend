import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import { formatCurrency, formatPercent } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.cpl-rise',
  level: 'campaign',
  severity: 'warning',
  category: 'campaign',
  action: 'refresh',
  title: 'Custo por contato subiu',
  description: 'Custo por contato aumentou significativamente vs semana anterior.',
  condition: 'contacts_prev7 >= minContactsForEvaluation AND delta_cpl_pct >= cplRisePctWarning',
};

export const campaignCplRiseRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.contactsPrev7 < facts.targets.minContactsForEvaluation) continue;
      if (facts.contactsLast7 < Math.min(5, facts.targets.minContactsForEvaluation)) continue;
      if (facts.cplChange === null) continue;
      if (facts.cplChange < facts.targets.cplRisePctWarning) continue;
      if (facts.costPerContact == null || facts.costPerContactPrev7 == null) continue;

      items.push({
        id: `camp-cpl-rise-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'warning',
        category: 'campaign',
        action: 'refresh',
        title: 'Custo por contato subiu',
        description: `Custo por contato subiu: ${formatCurrency(facts.costPerContactPrev7)} → ${formatCurrency(facts.costPerContact)} (${formatPercent(facts.cplChange)}). Recomenda-se testar novas variações de criativos.`,
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: {
          costPerContact: facts.costPerContact,
          costPerContactPrev7: facts.costPerContactPrev7,
          spendLast7: facts.spendLast7,
        },
        thresholds: { cplRisePctWarning: facts.targets.cplRisePctWarning },
      });
    }

    return items;
  },
};
