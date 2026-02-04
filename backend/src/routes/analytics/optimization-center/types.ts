export type OptimizationSeverity = 'critical' | 'warning' | 'info' | 'opportunity';
export type OptimizationAction = 'review' | 'pause' | 'refresh' | 'scale' | 'track' | 'sync';
export type OptimizationCategory = 'campaign' | 'creative' | 'qualification' | 'data';

export type OptimizationThemeInfo = {
  key: string;
  name: string;
  matchedBy: string;
  matchedValue: string | null;
};

export type OptimizationEntityInfo = {
  type: 'campaign' | 'creative';
  id: string;
  name?: string | null;
};

export type OptimizationItem = {
  id: string;
  ruleId?: string;
  severity: OptimizationSeverity;
  category: OptimizationCategory;
  action: OptimizationAction;
  title: string;
  description: string;
  theme?: OptimizationThemeInfo;
  entity?: OptimizationEntityInfo;
  metrics?: Record<string, number | string | null>;
  thresholds?: Record<string, number | string | null>;
};

