import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import { formatCurrency } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.no-contacts',
  level: 'campaign',
  severity: 'critical',
  category: 'campaign',
  action: 'refresh',
  title: 'Gasto sem gerar contatos',
  description: 'Gasto relevante e nenhum contato nos últimos 7 dias.',
  condition: 'spend_last7 >= minSpendForEvaluation AND contacts_last7 = 0',
};

export const campaignNoContactsRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.spendLast7 < facts.minSpendForEvaluation) continue;
      if (facts.contactsLast7 !== 0) continue;

      items.push({
        id: `camp-no-contacts-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'critical',
        category: 'campaign',
        action: 'refresh',
        title: 'Gasto sem gerar contatos',
        description: `${formatCurrency(facts.spendLast7)} investidos nos últimos 7 dias (dentro do período selecionado) sem gerar contatos. Ação: revisar criativos, público e página/conversa de destino.`,
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: { spendLast7: facts.spendLast7, contactsLast7: facts.contactsLast7 },
        thresholds: { minSpendForEvaluation: facts.minSpendForEvaluation },
      });
    }

    return items;
  },
};
