import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import { formatCurrency } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.cpl-high',
  level: 'campaign',
  severity: 'critical',
  category: 'campaign',
  action: 'refresh',
  title: 'CPL acima do ideal (tema)',
  description: 'CPL acima do limite do tema (alto risco de ineficiência).',
  condition: 'cpl_last7 >= targetCplBadMin',
};

export const campaignCplHighRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.costPerContact == null) continue;
      if (facts.contactsLast7 < facts.targets.minContactsForEvaluation) continue;
      if (facts.spendLast7 < facts.minSpendForEvaluation) continue;
      if (facts.costPerContact < facts.targets.targetCplBadMin) continue;

      items.push({
        id: `camp-cpl-high-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'critical',
        category: 'campaign',
        action: 'refresh',
        title: 'CPL acima do ideal (tema)',
        description: `CPL atual ${formatCurrency(facts.costPerContact)} está acima do ideal para o tema (${facts.theme.themeName}). Recomendado: revisar criativos, públicos e proposta para reduzir custo por contato.`,
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: { cplLast7: facts.costPerContact, contactsLast7: facts.contactsLast7, spendLast7: facts.spendLast7 },
        thresholds: {
          targetCplGoodMax: facts.targets.targetCplGoodMax,
          targetCplOkMax: facts.targets.targetCplOkMax,
          targetCplBadMin: facts.targets.targetCplBadMin,
        },
      });
    }

    return items;
  },
};
