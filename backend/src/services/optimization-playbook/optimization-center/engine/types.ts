import type {
  OptimizationCenterAction,
  OptimizationCenterCategory,
  OptimizationCenterRule,
  OptimizationCenterSeverity,
  OptimizationThemeMatch,
  OptimizationThemeTargets,
} from '../../types';

export type OptimizationThemeInfo = {
  key: string;
  name: string;
  matchedBy: string;
  matchedValue: string | null;
};

export type OptimizationEntityInfo = {
  type: 'campaign' | 'creative' | 'adset';
  id: string;
  name?: string | null;
};

export type OptimizationActionPayload = {
  type: 'pause_ad' | 'resume_ad' | 'set_adset_budget' | 'set_campaign_budget';
  entityId: string;
  amount?: number; // For budget changes
  reason: string;
};

export type OptimizationItem = {
  id: string;
  ruleId?: string;
  severity: OptimizationCenterSeverity;
  category: OptimizationCenterCategory;
  action: OptimizationCenterAction;
  title: string;
  description: string;
  theme?: OptimizationThemeInfo;
  entity?: OptimizationEntityInfo;
  metrics?: Record<string, number | string | null>;
  thresholds?: Record<string, number | string | null>;
  autoAction?: OptimizationActionPayload;
};

export type LeadTrackingAgg = { recordsLast7: number; qualifiedLast7: number; qualifiedPrev7: number };

export type OptimizationRuleContext = {
  campaignRows: any[];
  leadTrackingByCampaign: Map<string, LeadTrackingAgg>;
  reasonsByCampaign: Map<string, Array<{ key: string; count: number }>>;
  adsetBudgetsByCampaign: Map<string, { dailyBudget: number; lifetimeBudget: number }>;
  primaryTheme: OptimizationThemeMatch;
  primaryTargets: OptimizationThemeTargets;
  enrichedCreatives: any[];
  winners: any[];
  targets: OptimizationThemeTargets;
  playbookCopy: { preferredCtaTypes: string[]; prohibitedPhrases: string[] };
  clientTargetOverrides?: Partial<OptimizationThemeTargets> | null;
  adsetRows?: any[];
  adsetsByCampaign?: Map<string, any[]>;
};

export type OptimizationRuleModule = {
  meta: OptimizationCenterRule;
  evaluate: (ctx: OptimizationRuleContext) => OptimizationItem[];
};

