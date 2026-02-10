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
        thresholds: {
          targetCplBadMin: facts.targets.targetCplBadMin,
        },
        autoAction: {
          type: 'set_campaign_budget',
          entityId: facts.campaignId,
          amount: Math.floor(facts.campaignBudget * 0.8), // Suggest 20% reduction
          reason: 'High CPL: Reducing budget to control inefficiency',
        },
      });
    }

    return items;
  },
};
