import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import { formatPercent } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'campaign.first-reply-low',
  level: 'campaign',
  severity: 'warning',
  category: 'campaign',
  action: 'review',
  title: 'Baixa taxa de primeira resposta',
  description: 'Muitas conversas iniciadas, mas pouca primeira resposta do usuário.',
  condition: 'conversations_last7 >= minContactsForEvaluation AND first_reply_rate < firstReplyRateMin',
};

export const campaignFirstReplyLowRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.firstReplyRate == null) continue;
      if (facts.messagingLast7 < facts.targets.minContactsForEvaluation) continue;
      if (facts.firstReplyRate >= facts.targets.firstReplyRateMin) continue;
      if (facts.spendLast7 < facts.minSpendForEvaluation) continue;

      items.push({
        id: `camp-first-reply-low-${facts.campaignId}`,
        ruleId: meta.id,
        severity: 'warning',
        category: 'campaign',
        action: 'review',
        title: 'Baixa taxa de primeira resposta',
        description: `Taxa de primeira resposta ${formatPercent(facts.firstReplyRate)} (meta: ≥ ${facts.targets.firstReplyRateMin}%). Pode indicar conversa iniciada mas sem engajamento. Revise criativos e a abordagem inicial no WhatsApp.`,
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: {
          messagingLast7: facts.messagingLast7,
          firstReplyLast7: facts.firstReplyLast7,
          firstReplyRate: facts.firstReplyRate,
        },
        thresholds: { firstReplyRateMin: facts.targets.firstReplyRateMin },
      });
    }

    return items;
  },
};
