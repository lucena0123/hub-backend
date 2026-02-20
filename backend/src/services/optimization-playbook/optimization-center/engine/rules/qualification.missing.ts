import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'qualification.missing',
  level: 'qualification',
  severity: 'info',
  category: 'qualification',
  action: 'track',
  title: 'Sem dados de qualificação',
  description: 'Há contatos, mas não há registros de qualificação manual.',
  condition: 'contacts_last7 > 0 AND spend_last7 > minSpendForEvaluation AND tracking_records_last7 = 0',
};

export const qualificationMissingRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.contactsLast7 <= 0) continue;
      if (facts.spendLast7 <= facts.minSpendForEvaluation) continue;
      if (facts.leadTracking.recordsLast7 !== 0) continue;

      items.push({
        id: `qual-missing-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'info',
        category: 'qualification',
        action: 'track',
        title: 'Sem dados de qualificação',
        description:
          'Há contatos no período, mas não há registros de qualificação. Preencha “Dados do Funil” para medir a qualidade e o custo por interessado real.',
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: { contactsLast7: facts.contactsLast7, spendLast7: facts.spendLast7 },
        thresholds: { minSpendForEvaluation: facts.minSpendForEvaluation },
      });
    }

    return items;
  },
};
