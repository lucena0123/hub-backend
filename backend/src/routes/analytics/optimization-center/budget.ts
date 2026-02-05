export type BudgetMode = 'cbo' | 'abo' | 'mixed' | 'unknown';

export type BudgetSource = 'campaign' | 'adset' | 'none';

export type AssumedBudgetKind = 'daily' | 'lifetime' | 'unknown';

export type BudgetResolution = {
  budgetMode: BudgetMode;
  budgetSource: BudgetSource;
  assumedBudgetKind: AssumedBudgetKind;
  candidateBudget: number;
  expectedSpendLast7: number;
  floorMinSpendForEvaluation: number;
  minSpendForEvaluation: number;
};

export const resolveBudgetAndMinSpend = (params: {
  playbookMinSpendForEvaluation: number;
  campaignBudget: number;
  spendLast7: number;
  adsetDailyBudget: number;
  adsetLifetimeBudget: number;
}): BudgetResolution => {
  const { playbookMinSpendForEvaluation, campaignBudget, spendLast7, adsetDailyBudget, adsetLifetimeBudget } = params;

  const hasCampaignBudget = campaignBudget > 0;
  const hasAdsetBudget = adsetDailyBudget > 0 || adsetLifetimeBudget > 0;

  const budgetMode: BudgetMode = hasCampaignBudget && hasAdsetBudget ? 'mixed' : hasCampaignBudget ? 'cbo' : hasAdsetBudget ? 'abo' : 'unknown';

  const floorMinSpendForEvaluation = Math.max(20, Math.round(playbookMinSpendForEvaluation * 0.2));

  let budgetSource: BudgetSource = 'none';
  let assumedBudgetKind: AssumedBudgetKind = 'unknown';
  let candidateBudget = 0;

  if (campaignBudget > 0) {
    budgetSource = 'campaign';
    assumedBudgetKind = spendLast7 > campaignBudget * 1.2 ? 'daily' : 'lifetime';
    candidateBudget = campaignBudget;
  } else if (adsetDailyBudget > 0) {
    budgetSource = 'adset';
    assumedBudgetKind = 'daily';
    candidateBudget = adsetDailyBudget;
  } else if (adsetLifetimeBudget > 0) {
    budgetSource = 'adset';
    assumedBudgetKind = 'lifetime';
    candidateBudget = adsetLifetimeBudget;
  }

  const expectedSpendLast7 =
    candidateBudget > 0 ? (assumedBudgetKind === 'daily' ? candidateBudget * 7 : candidateBudget) : 0;

  const minSpendForEvaluation =
    expectedSpendLast7 > 0
      ? Math.min(playbookMinSpendForEvaluation, Math.max(floorMinSpendForEvaluation, expectedSpendLast7 * 0.8))
      : playbookMinSpendForEvaluation;

  return {
    budgetMode,
    budgetSource,
    assumedBudgetKind,
    candidateBudget,
    expectedSpendLast7,
    floorMinSpendForEvaluation,
    minSpendForEvaluation,
  };
};

