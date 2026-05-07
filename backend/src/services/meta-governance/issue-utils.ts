import type { MetaGovernanceIssueStatus } from './types';

export const buildGovernanceIssueKey = (params: {
  clientId: string;
  entityType: string;
  entityExternalId: string;
  issueType: string;
  expectedName: string | null;
}) => [params.clientId, params.entityType, params.entityExternalId, params.issueType, params.expectedName ?? ''].join(':');

export const classifyGovernanceSuggestionStatus = (params: {
  dryRun: boolean;
  safeToApply: boolean;
  hasWriteError: boolean;
  hasVerificationError: boolean;
}): MetaGovernanceIssueStatus => {
  if (params.hasWriteError || params.hasVerificationError) {
    return 'failed';
  }

  if (!params.safeToApply) {
    return 'needs_review';
  }

  if (params.dryRun) {
    return 'open';
  }

  return 'auto_fixed';
};

export const buildGovernanceSummary = (items: Array<{ status: MetaGovernanceIssueStatus }>) => ({
  audited: items.length,
  compliant: 0,
  autoFixed: items.filter((item) => item.status === 'auto_fixed').length,
  needsReview: items.filter((item) => item.status === 'needs_review').length,
  failed: items.filter((item) => item.status === 'failed').length,
  resolvedDuringRun: items.filter((item) => item.status === 'resolved').length,
  createdTimeBackfilled: 0,
  dryRun: false,
});
