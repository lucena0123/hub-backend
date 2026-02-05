import type { OptimizationCenterRule } from '../../../types';
import { getCampaignFacts } from '../campaign-facts';
import { formatCurrency, formatPercent } from '../helpers';
import type { OptimizationItem, OptimizationRuleModule } from '../types';
import { toThemeInfo } from '../utils';

const meta: OptimizationCenterRule = {
  id: 'qualification.low',
  level: 'qualification',
  severity: 'warning',
  category: 'qualification',
  action: 'review',
  title: 'Qualificação baixa',
  description: 'Percentual de qualificados abaixo da meta do tema.',
  condition: 'tracking_records_last7 > 0 AND qualification_rate < qualificationRateTargetMin',
};

export const qualificationLowRule: OptimizationRuleModule = {
  meta,
  evaluate: (ctx) => {
    const items: OptimizationItem[] = [];

    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);

      if (facts.leadTracking.recordsLast7 <= 0) continue;
      if (facts.contactsLast7 <= 0) continue;

      const qualificationRate =
        facts.leadTracking.qualifiedLast7 > 0 ? (facts.leadTracking.qualifiedLast7 / facts.contactsLast7) * 100 : 0;
      const costPerQualified =
        facts.leadTracking.qualifiedLast7 > 0 ? facts.spendLast7 / facts.leadTracking.qualifiedLast7 : null;

      if (facts.spendLast7 > facts.minSpendForEvaluation && facts.leadTracking.qualifiedLast7 === 0) continue;
      if (qualificationRate >= facts.targets.qualificationRateTargetMin) continue;

      items.push({
        id: `qual-low-${facts.campaignId}`,
        ruleId: meta.id,
        severity:
          qualificationRate < Math.max(5, facts.targets.qualificationRateTargetMin * 0.6) ? 'critical' : 'warning',
        category: 'qualification',
        action: 'review',
        title: 'Qualificação baixa',
        description: `Qualificação baixa: ${facts.leadTracking.qualifiedLast7} qualificados em ${facts.contactsLast7} contatos (${formatPercent(qualificationRate)}). ${costPerQualified != null ? `Custo por qualificado: ${formatCurrency(costPerQualified)}.` : ''} ${facts.topReasons ? `Motivos comuns: ${facts.topReasons}.` : ''}`,
        theme: toThemeInfo(facts.theme),
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        metrics: {
          qualificationRate,
          costPerQualified,
          contactsLast7: facts.contactsLast7,
          qualifiedLast7: facts.leadTracking.qualifiedLast7,
        },
        thresholds: { qualificationRateTargetMin: facts.targets.qualificationRateTargetMin },
      });
    }

    return items;
  },
};
