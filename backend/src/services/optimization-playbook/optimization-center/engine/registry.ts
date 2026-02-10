import type { OptimizationCenterRule } from '../../types';
import { adsetCplHighRule } from './rules/adset.cpl-high';
import { adsetFrequencyHighRule } from './rules/adset.frequency-high';
import { adsetNoContactsRule } from './rules/adset.no-contacts';
import { adsetSpendImbalanceRule } from './rules/adset.spend-imbalance';
import { adsetWinnerRule } from './rules/adset.winner';
import { campaignContactsDropRule } from './rules/campaign.contacts-drop';
import { campaignCplAboveOkRule } from './rules/campaign.cpl-above-ok';
import { campaignCplHighRule } from './rules/campaign.cpl-high';
import { campaignCplRiseRule } from './rules/campaign.cpl-rise';
import { campaignFirstReplyLowRule } from './rules/campaign.first-reply-low';
import { campaignFrequencyHighRule } from './rules/campaign.frequency-high';
import { campaignNoContactsRule } from './rules/campaign.no-contacts';
import { campaignScaleOpportunityRule } from './rules/campaign.scale-opportunity';
import { campaignStalledRule } from './rules/campaign.stalled';
import { creativeAbTestOpportunityRule } from './rules/creative.ab-test-opportunity';
import { creativeCopyComplianceRiskRule } from './rules/creative.copy-compliance-risk';
import { creativeCopyCtaMismatchRule } from './rules/creative.copy-cta-mismatch';
import { creativeCopyHeadlineLengthRule } from './rules/creative.copy-headline-length';
import { creativeCopyInsightsMissingRule } from './rules/creative.copy-insights-missing';
import { creativeCopyMissingHeadlineRule } from './rules/creative.copy-missing-headline';
import { creativeCopyPrimaryTooLongRule } from './rules/creative.copy-primary-too-long';
import { creativeCopyThemeNotMentionedRule } from './rules/creative.copy-theme-not-mentioned';
import { creativeFatiguedRule } from './rules/creative.fatigued';
import { creativeLoserRule } from './rules/creative.loser';
import { creativeVideoHoldLowRule } from './rules/creative.video-hold-low';
import { creativeVideoHookLowRule } from './rules/creative.video-hook-low';
import { creativeLowVariationRule } from './rules/creative.low-variation';
import { creativeWinnerRule } from './rules/creative.winner';
import { dataNoCreativesRule } from './rules/data.no-creatives';
import { structureSingleCreativeRule } from './rules/structure.single-creative';
import { structureTooManyAdsetsRule } from './rules/structure.too-many-adsets';
import { qualificationLowRule } from './rules/qualification.low';
import { qualificationMissingRule } from './rules/qualification.missing';
import { qualificationZeroRule } from './rules/qualification.zero';
import type { OptimizationItem, OptimizationRuleContext, OptimizationRuleModule } from './types';

const RULES: OptimizationRuleModule[] = [
  dataNoCreativesRule,
  campaignStalledRule,
  campaignNoContactsRule,
  campaignContactsDropRule,
  campaignCplRiseRule,
  campaignCplAboveOkRule,
  campaignCplHighRule,
  campaignFrequencyHighRule,
  campaignFirstReplyLowRule,
  campaignScaleOpportunityRule,
  adsetNoContactsRule,
  adsetCplHighRule,
  adsetWinnerRule,
  adsetFrequencyHighRule,
  adsetSpendImbalanceRule,
  qualificationMissingRule,
  qualificationZeroRule,
  qualificationLowRule,
  creativeLoserRule,
  creativeFatiguedRule,
  creativeWinnerRule,
  creativeVideoHookLowRule,
  creativeVideoHoldLowRule,
  creativeCopyInsightsMissingRule,
  creativeCopyMissingHeadlineRule,
  creativeCopyHeadlineLengthRule,
  creativeCopyPrimaryTooLongRule,
  creativeCopyCtaMismatchRule,
  creativeCopyThemeNotMentionedRule,
  creativeCopyComplianceRiskRule,
  creativeAbTestOpportunityRule,
  creativeLowVariationRule,
  structureTooManyAdsetsRule,
  structureSingleCreativeRule,
];

export const evaluateOptimizationCenterRules = (
  ctx: OptimizationRuleContext,
  options?: { ruleConfigById?: Map<string, { enabled?: boolean }> }
): OptimizationItem[] => {
  const items: OptimizationItem[] = [];
  for (const rule of RULES) {
    const config = options?.ruleConfigById?.get(rule.meta.id);
    if (config && config.enabled === false) continue;
    items.push(...rule.evaluate(ctx));
  }
  return items;
};

export const getOptimizationCenterRuleMetas = (): OptimizationCenterRule[] => {
  return RULES.map((rule) => rule.meta);
};
