import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import { formatPercent } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.contacts-drop',
  level: 'campaign',
  severity: 'warning',
  category: 'campaign',
  action: 'refresh',
  title: 'Queda brusca de contatos',
  description: 'Queda relevante de contatos comparando 7d vs 7d anterior.',
  condition: 'contacts_prev7 >= minContactsForEvaluation AND delta_contacts_pct <= contactsDropPctWarning',
  appliesToObjectives: ['messages'],
};

export const campaignContactsDropRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.contactsPrev7 < facts.targets.minContactsForEvaluation) continue;
      if (facts.contactsDelta === null) continue;
      if (facts.contactsDelta > facts.targets.contactsDropPctWarning) continue;
      if (facts.spendLast7 < Math.min(facts.minSpendForEvaluation, 100)) continue;

      items.push({
        id: `camp-contacts-drop-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'warning',
        category: 'campaign',
        action: 'refresh',
        title: 'Queda brusca de contatos',
        description: `Queda de contatos: ${facts.contactsPrev7} → ${facts.contactsLast7} (${formatPercent(facts.contactsDelta)}). Sinal de fadiga de criativo ou mudança de público.`,
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: { contactsLast7: facts.contactsLast7, contactsPrev7: facts.contactsPrev7, spendLast7: facts.spendLast7 },
        thresholds: {
          minContactsForEvaluation: facts.targets.minContactsForEvaluation,
          contactsDropPctWarning: facts.targets.contactsDropPctWarning,
        },
      });
    }

    return items;
  },
};
