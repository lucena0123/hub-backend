import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import { formatCurrency } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.cpl-above-ok',
  level: 'campaign',
  severity: 'warning',
  category: 'campaign',
  action: 'refresh',
  title: 'CPL acima do desejado (tema)',
  description: 'CPL acima do desejado para o tema detectado.',
  condition: 'cpl_last7 > targetCplOkMax AND cpl_last7 < targetCplBadMin',
};

export const campaignCplAboveOkRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.costPerContact == null) continue;
      if (facts.contactsLast7 < facts.targets.minContactsForEvaluation) continue;
      if (facts.spendLast7 < facts.minSpendForEvaluation) continue;
      if (facts.costPerContact <= facts.targets.targetCplOkMax) continue;
      if (facts.costPerContact >= facts.targets.targetCplBadMin) continue;

      items.push({
        id: `camp-cpl-above-ok-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'warning',
        category: 'campaign',
        action: 'refresh',
        title: 'CPL acima do desejado (tema)',
        description: `CPL atual ${formatCurrency(facts.costPerContact)} acima do desejado para o tema (${facts.theme.themeName}). Sugestão: criar novas variações de criativo e testar ângulos/copy.`,
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: { cplLast7: facts.costPerContact, contactsLast7: facts.contactsLast7, spendLast7: facts.spendLast7 },
        thresholds: { targetCplOkMax: facts.targets.targetCplOkMax },
      });
    }

    return items;
  },
};
