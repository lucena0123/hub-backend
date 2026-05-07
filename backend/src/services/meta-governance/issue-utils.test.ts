import { describe, expect, it } from 'vitest';

import {
  buildGovernanceIssueKey,
  buildGovernanceSummary,
  classifyGovernanceSuggestionStatus,
} from './issue-utils';

describe('meta-governance issue utils', () => {
  it('classifies dry-run mismatches as open and ambiguous mismatches as needs_review', () => {
    expect(
      classifyGovernanceSuggestionStatus({
        dryRun: true,
        safeToApply: true,
        hasVerificationError: false,
        hasWriteError: false,
      }),
    ).toBe('open');

    expect(
      classifyGovernanceSuggestionStatus({
        dryRun: false,
        safeToApply: false,
        hasVerificationError: false,
        hasWriteError: false,
      }),
    ).toBe('needs_review');
  });

  it('classifies write and verification failures as failed', () => {
    expect(
      classifyGovernanceSuggestionStatus({
        dryRun: false,
        safeToApply: true,
        hasVerificationError: false,
        hasWriteError: true,
      }),
    ).toBe('failed');

    expect(
      classifyGovernanceSuggestionStatus({
        dryRun: false,
        safeToApply: true,
        hasVerificationError: true,
        hasWriteError: false,
      }),
    ).toBe('failed');
  });

  it('builds deterministic keys and run summaries', () => {
    expect(
      buildGovernanceIssueKey({
        clientId: 'client-1',
        entityType: 'campaign',
        entityExternalId: '123',
        issueType: 'non_canonical_name',
        expectedName: 'X',
      }),
    ).toBe('client-1:campaign:123:non_canonical_name:X');

    expect(
      buildGovernanceSummary([
        { status: 'auto_fixed' },
        { status: 'auto_fixed' },
        { status: 'needs_review' },
        { status: 'failed' },
        { status: 'resolved' },
      ]),
    ).toMatchObject({
      autoFixed: 2,
      needsReview: 1,
      failed: 1,
      resolvedDuringRun: 1,
    });
  });
});
