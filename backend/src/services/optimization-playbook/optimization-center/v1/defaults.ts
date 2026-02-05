import type { OptimizationThemeTargets } from '../../types';

export const OPTIMIZATION_CENTER_PLAYBOOK_V1_DEFAULTS: OptimizationThemeTargets = {
  minSpendForEvaluation: 150,
  minContactsForEvaluation: 10,

  copyHeadlineMinChars: 18,
  copyHeadlineMaxChars: 60,
  copyPrimaryTextMaxChars: 220,

  targetCplGoodMax: 10,
  targetCplOkMax: 15,
  targetCplBadMin: 20,
  cplRisePctWarning: 40,
  contactsDropPctWarning: -50,

  frequencyWarning: 3,
  frequencyCritical: 5,
  firstReplyRateMin: 25,

  qualificationRateTargetMin: 12,

  creativeMinSpendWinner: 50,
  creativeMinSpendLoser: 200,
  creativeWinnerPercentile: 0.2,
  creativeWinnerMaxCount: 5,
  creativeLoserCplMultiplier: 2,
  creativeLoserMaxConversations: 3,
  creativeFatigueDropPct: -50,
  creativeFatigueCplMultiplier: 1.5,
  creativeFatigueMinPrevConversations: 10,
  creativeFatigueMinSpend: 100,

  hookRateMin: 15,
  holdRateMin: 25,
};

