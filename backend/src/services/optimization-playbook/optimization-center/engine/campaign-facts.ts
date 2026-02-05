import { getOptimizationTargetsForTheme, inferOptimizationTheme } from '../../theme';
import { resolveBudgetAndMinSpend } from './budget';
import { percentChange, safeFloat, safeInt } from './helpers';
import type { LeadTrackingAgg, OptimizationRuleContext } from './types';

export type CampaignFacts = {
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  campaignBudget: number;
  minSpendForEvaluation: number;
  theme: ReturnType<typeof inferOptimizationTheme>;
  targets: ReturnType<typeof getOptimizationTargetsForTheme>;
  spendTotal: number;
  impressionsTotal: number;
  spendLast7: number;
  spendPrev7: number;
  avgFrequencyLast7: number;
  avgCpmLast7: number;
  messagingLast7: number;
  messagingPrev7: number;
  contactsLast7: number;
  contactsPrev7: number;
  costPerContact: number | null;
  costPerContactPrev7: number | null;
  contactsDelta: number | null;
  cplChange: number | null;
  firstReplyLast7: number;
  firstReplyRate: number | null;
  leadTracking: LeadTrackingAgg;
  topReasons: string;
};

export const getCampaignFacts = (ctx: OptimizationRuleContext, row: any): CampaignFacts => {
  const campaignId = String(row.campaign_id);
  const campaignName = String(row.campaign_name || '');
  const campaignStatus = String(row.campaign_status || '');

  const theme = inferOptimizationTheme(campaignName);
  const targets = getOptimizationTargetsForTheme(theme.themeKey);

  const spendTotal = safeFloat(row.spend_total);
  const impressionsTotal = safeInt(row.impressions_total);

  const spendLast7 = safeFloat(row.spend_last7);
  const spendPrev7 = safeFloat(row.spend_prev7);

  const campaignBudget = safeFloat(row.budget);
  const adsetBudgets = ctx.adsetBudgetsByCampaign.get(campaignId);
  const adsetDailyBudget = safeFloat(adsetBudgets?.dailyBudget);
  const adsetLifetimeBudget = safeFloat(adsetBudgets?.lifetimeBudget);

  const budgetResolution = resolveBudgetAndMinSpend({
    playbookMinSpendForEvaluation: targets.minSpendForEvaluation,
    campaignBudget,
    spendLast7,
    adsetDailyBudget,
    adsetLifetimeBudget,
  });

  const minSpendForEvaluation = budgetResolution.minSpendForEvaluation;

  const firstReplyLast7 = safeInt(row.first_reply_last7);
  const avgFrequencyLast7 = safeFloat(row.avg_frequency_last7);
  const avgCpmLast7 = safeFloat(row.avg_cpm_last7);

  const conversionsLast7 = safeInt(row.conversions_last7);
  const conversionsPrev7 = safeInt(row.conversions_prev7);
  const leadsLast7 = safeInt(row.leads_last7);
  const leadsPrev7 = safeInt(row.leads_prev7);
  const messagingLast7 = safeInt(row.conversations_last7);
  const messagingPrev7 = safeInt(row.conversations_prev7);

  const contactsLast7 = messagingLast7 > 0 ? messagingLast7 : leadsLast7 > 0 ? leadsLast7 : conversionsLast7;
  const contactsPrev7 = messagingPrev7 > 0 ? messagingPrev7 : leadsPrev7 > 0 ? leadsPrev7 : conversionsPrev7;

  const costPerContact = contactsLast7 > 0 ? spendLast7 / contactsLast7 : null;
  const costPerContactPrev7 = contactsPrev7 > 0 ? spendPrev7 / contactsPrev7 : null;

  const firstReplyRate =
    messagingLast7 > 0 && firstReplyLast7 >= 0 ? (firstReplyLast7 / messagingLast7) * 100 : null;

  const contactsDelta = percentChange(contactsLast7, contactsPrev7);
  const cplChange =
    costPerContact != null && costPerContactPrev7 != null
      ? percentChange(costPerContact, costPerContactPrev7)
      : null;

  const leadTracking = ctx.leadTrackingByCampaign.get(campaignId) ?? {
    recordsLast7: 0,
    qualifiedLast7: 0,
    qualifiedPrev7: 0,
  };

  const topReasons = (ctx.reasonsByCampaign.get(campaignId) ?? [])
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map((r) => `${r.key.replaceAll('_', ' ')} (${r.count})`)
    .join(', ');

  return {
    campaignId,
    campaignName,
    campaignStatus,
    campaignBudget,
    minSpendForEvaluation,
    theme,
    targets,
    spendTotal,
    impressionsTotal,
    spendLast7,
    spendPrev7,
    avgFrequencyLast7,
    avgCpmLast7,
    messagingLast7,
    messagingPrev7,
    contactsLast7,
    contactsPrev7,
    costPerContact,
    costPerContactPrev7,
    contactsDelta,
    cplChange,
    firstReplyLast7,
    firstReplyRate,
    leadTracking,
    topReasons,
  };
};

