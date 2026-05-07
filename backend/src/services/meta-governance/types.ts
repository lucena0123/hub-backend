export type MetaGovernanceEntityType = 'campaign' | 'adset' | 'ad';

export type MetaGovernanceIssueStatus = 'open' | 'auto_fixed' | 'needs_review' | 'failed' | 'resolved';

export type MetaGovernanceIssueType =
  | 'missing_created_time'
  | 'date_mismatch'
  | 'non_canonical_name'
  | 'override_applied'
  | 'permission_error'
  | 'scope_mismatch'
  | 'meta_write_failed'
  | 'db_write_failed'
  | 'verify_mismatch';

export type MetaNamingOverridePayload = {
  expectedName?: string;
  notes?: string;
  [key: string]: unknown;
};

export type MetaNamingOverrideRecord = {
  id: string;
  clientId: string;
  entityType: MetaGovernanceEntityType;
  entityExternalId: string | null;
  productKey: string | null;
  themeKey: string | null;
  audienceKey: string | null;
  overridePayload: MetaNamingOverridePayload;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GovernanceNameSuggestion = {
  entityType: MetaGovernanceEntityType;
  entityExternalId: string;
  currentName: string | null;
  expectedName: string;
  safeToApply: boolean;
  overrideApplied: boolean;
  overrideId?: string | null;
  tokens: Record<string, string | number | boolean | null>;
};

export type MetaGovernanceSummary = {
  audited: number;
  compliant: number;
  autoFixed: number;
  needsReview: number;
  failed: number;
  resolvedDuringRun: number;
  createdTimeBackfilled: number;
  dryRun: boolean;
};
