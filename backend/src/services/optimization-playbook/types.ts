export type OptimizationCenterSeverity = 'critical' | 'warning' | 'info' | 'opportunity';
export type OptimizationCenterCategory = 'campaign' | 'creative' | 'adset' | 'qualification' | 'data';
export type OptimizationCenterAction = 'review' | 'pause' | 'refresh' | 'scale' | 'track' | 'sync';

export type OptimizationThemeMatch = {
  themeKey: string;
  themeName: string;
  matchedBy: 'tag' | 'keyword' | 'default' | 'manual';
  matchedValue: string | null;
};

export type OptimizationThemeTargets = {
  // Data confidence
  minSpendForEvaluation: number;
  minContactsForEvaluation: number;

  // Copy (snapshot)
  copyHeadlineMinChars: number;
  copyHeadlineMaxChars: number;
  copyPrimaryTextMaxChars: number;

  // Campaign (contacts)
  targetCplGoodMax: number;
  targetCplOkMax: number;
  targetCplBadMin: number;
  cplRisePctWarning: number;
  contactsDropPctWarning: number;

  // Saturation / quality
  frequencyWarning: number;
  frequencyCritical: number;
  firstReplyRateMin: number;

  // Qualification (manual funnel)
  qualificationRateTargetMin: number;

  // Creative classification
  creativeMinSpendWinner: number;
  creativeMinSpendLoser: number;
  creativeWinnerPercentile: number;
  creativeWinnerMaxCount: number;
  creativeLoserCplMultiplier: number;
  creativeLoserMaxConversations: number;
  creativeFatigueDropPct: number;
  creativeFatigueCplMultiplier: number;
  creativeFatigueMinPrevConversations: number;
  creativeFatigueMinSpend: number;

  // Video
  hookRateMin: number;
  holdRateMin: number;
};

export type OptimizationTheme = {
  key: string;
  name: string;
  description: string;
  tags: string[];
  keywords: string[];
  targets?: Partial<OptimizationThemeTargets>;
};

export type OptimizationCenterRule = {
  id: string;
  level: 'campaign' | 'creative' | 'adset' | 'qualification' | 'data';
  severity: OptimizationCenterSeverity;
  category: OptimizationCenterCategory;
  action: OptimizationCenterAction;
  title: string;
  description: string;
  // Human-readable condition (for the dashboard)
  condition: string;
  appliesToObjectives?: Array<'messages' | 'lead' | 'conversion' | 'traffic' | 'awareness'>;
  appliesToChannels?: string[];
};

export type OptimizationCenterPlaybook = {
  key: 'optimization-center';
  version: string;
  updatedAt: string;
  description: string;
  copy?: {
    preferredCtaTypes: string[];
    prohibitedPhrases: string[];
    notes?: string;
  };
  ai?: {
    copySuggestions?: {
      enabled: boolean;
      requiresEnv: 'OPENAI_API_KEY';
      model: string;
      promptId?: string;
      promptVersion: string;
    };
  };
  defaults: OptimizationThemeTargets;
  themes: OptimizationTheme[];
  rules: OptimizationCenterRule[];
};
