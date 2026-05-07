export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'expired';

export const toNullableString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const parseLimit = (raw: unknown) => {
  const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN;
  const limit = Number.isFinite(parsed) ? parsed : 50;
  return Math.max(1, Math.min(200, limit));
};

export const parseOffset = (raw: unknown) => {
  const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN;
  const offset = Number.isFinite(parsed) ? parsed : 0;
  return Math.max(0, offset);
};

export const mapProposalRow = (row: any) => ({
  proposalId: String(row.id),
  clientId: String(row.client_id),
  platform: row.platform,
  accountId: row.account_id ?? null,
  source: row.source,
  sourceItemId: row.source_item_id ?? null,
  ruleId: row.rule_id ?? null,
  playbookVersion: row.playbook_version ?? null,
  severity: row.severity ?? null,
  category: row.category ?? null,
  action: row.action ?? null,
  title: row.title ?? null,
  description: row.description ?? null,
  entity: row.entity_type && row.entity_id ? { type: row.entity_type, id: row.entity_id } : null,
  recommendedPayload: row.recommended_payload ?? null,
  status: row.status as ProposalStatus,
  createdBy: {
    type: row.created_by_type,
    userId: row.created_by_user_id ?? null,
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastDecision: row.last_decision
    ? {
      decision: row.last_decision,
      reason: row.last_decision_reason ?? null,
      decidedByUserId: row.last_decided_by_user_id ?? null,
      decidedAt: row.last_decided_at ?? null,
    }
    : null,
});

export const mapApprovalRow = (row: any) => ({
  approvalId: String(row.id),
  proposalId: String(row.proposal_id),
  decision: row.decision,
  reason: row.reason ?? null,
  decidedByUserId: row.decided_by_user_id,
  decidedAt: row.decided_at,
  createdAt: row.created_at,
});

export const mapExecutionRow = (row: any) => ({
  executionId: String(row.id),
  proposalId: String(row.proposal_id),
  status: row.status,
  attempts: typeof row.attempts === 'number' ? row.attempts : 0,
  idempotencyKey: row.idempotency_key ?? null,
  dryRun: Boolean(row.dry_run),
  requestPayload: row.request_payload ?? null,
  metaResponse: row.meta_response ?? null,
  error: row.error_message
    ? {
      message: row.error_message,
      stack: row.error_stack ?? null,
    }
    : null,
  startedAt: row.started_at ?? null,
  completedAt: row.completed_at ?? null,
  executedBy: {
    type: row.executed_by_type,
    userId: row.executed_by_user_id ?? null,
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapHistoryRow = (row: any) => {
  const entityName =
    row.campaign_name ??
    row.adset_name ??
    row.creative_headline ??
    row.creative_primary_text ??
    null;

  return {
    executionId: String(row.execution_id),
    proposalId: String(row.proposal_id),
    clientId: String(row.client_id),
    status: row.execution_status,
    attempts: typeof row.attempts === 'number' ? row.attempts : 0,
    dryRun: Boolean(row.dry_run),
    requestPayload: row.request_payload ?? null,
    metaResponse: row.meta_response ?? null,
    error: row.error_message
      ? { message: row.error_message, stack: row.error_stack ?? null }
      : null,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    createdAt: row.execution_created_at,
    updatedAt: row.execution_updated_at,
    executedBy: {
      type: row.executed_by_type,
      userId: row.executed_by_user_id ?? null,
    },
    action: row.action ?? null,
    title: row.title ?? null,
    description: row.description ?? null,
    category: row.category ?? null,
    severity: row.severity ?? null,
    entity: row.entity_type && row.entity_id
      ? {
          type: row.entity_type,
          id: row.entity_id,
          name: entityName,
        }
      : null,
    source: row.source ?? null,
    proposalCreatedAt: row.proposal_created_at ?? null,
    proposalUpdatedAt: row.proposal_updated_at ?? null,
  };
};
