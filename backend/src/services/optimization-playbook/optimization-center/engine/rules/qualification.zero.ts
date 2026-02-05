import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import { formatCurrency } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'qualification.zero',
  level: 'qualification',
  severity: 'critical',
  category: 'qualification',
  action: 'review',
  title: 'Contatos sem qualificados',
  description: 'Há gasto e contatos, mas nenhum qualificado no período.',
  condition: 'spend_last7 > minSpendForEvaluation AND contacts_last7 > 0 AND qualified_last7 = 0',
};

export const qualificationZeroRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.leadTracking.recordsLast7 <= 0) continue;
      if (facts.contactsLast7 <= 0) continue;
      if (facts.spendLast7 <= facts.minSpendForEvaluation) continue;
      if (facts.leadTracking.qualifiedLast7 !== 0) continue;

      items.push({
        id: `qual-zero-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'critical',
        category: 'qualification',
        action: 'review',
        title: 'Contatos sem qualificados',
        description: `Contatos sem nenhum qualificado nesta semana com ${formatCurrency(facts.spendLast7)} de gasto. Verifique mensagem, triagem e atendimento. ${facts.topReasons ? `Motivos comuns: ${facts.topReasons}.` : ''}`,
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: {
          contactsLast7: facts.contactsLast7,
          qualifiedLast7: facts.leadTracking.qualifiedLast7,
          spendLast7: facts.spendLast7,
        },
        thresholds: { qualificationRateTargetMin: facts.targets.qualificationRateTargetMin },
      });
    }

    return items;
  },
};
