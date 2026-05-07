import type { Pool } from 'pg';

import {
  mapApprovalRow,
  mapExecutionRow,
  mapHistoryRow,
  mapProposalRow,
} from './mappers';

export type ActionProposalFilters = {
  status: string | null;
  action: string | null;
  entityType: string | null;
  limit: number;
};

export type ActionHistoryFilters = {
  status: string | null;
  action: string | null;
  entityType: string | null;
  entityId: string | null;
  campaignId: string | null;
  startDate: string | null;
  endDate: string | null;
  limit: number;
  offset: number;
};

const proposalWithLastDecisionSelect = `
  SELECT
    p.*,
    a.decision AS last_decision,
    a.reason AS last_decision_reason,
    a.decided_by_user_id AS last_decided_by_user_id,
    a.decided_at AS last_decided_at
  FROM action_proposals p
  LEFT JOIN LATERAL (
    SELECT decision, reason, decided_by_user_id, decided_at
    FROM action_approvals
    WHERE proposal_id = p.id
    ORDER BY decided_at DESC
    LIMIT 1
  ) a ON TRUE
`;

export const listActionProposals = async (
  pool: Pool,
  clientId: string,
  filters: ActionProposalFilters
) => {
  const result = await pool.query(
    `${proposalWithLastDecisionSelect}
     WHERE p.client_id = $1
       AND ($2::text IS NULL OR p.status = $2)
       AND ($3::text IS NULL OR p.action = $3)
       AND ($4::text IS NULL OR p.entity_type = $4)
     ORDER BY p.created_at DESC
     LIMIT $5`,
    [clientId, filters.status, filters.action, filters.entityType, filters.limit]
  );

  return result.rows.map(mapProposalRow);
};

export const listActionHistory = async (
  pool: Pool,
  clientId: string,
  filters: ActionHistoryFilters
) => {
  const params = [
    clientId,
    filters.status,
    filters.action,
    filters.entityType,
    filters.entityId,
    filters.startDate,
    filters.endDate,
    filters.campaignId,
  ];

  const whereClause = `
    p.client_id = $1
    AND ($2::text IS NULL OR e.status = $2)
    AND ($3::text IS NULL OR p.action = $3)
    AND ($4::text IS NULL OR p.entity_type = $4)
    AND ($5::text IS NULL OR p.entity_id = $5)
    AND ($6::date IS NULL OR e.created_at::date >= $6::date)
    AND ($7::date IS NULL OR e.created_at::date <= $7::date)
    AND (
      $8::text IS NULL OR (
        (p.entity_type = 'campaign' AND p.entity_id = $8)
        OR (p.entity_type = 'adset' AND EXISTS (
          SELECT 1 FROM adsets a2 WHERE a2.adset_id = p.entity_id AND a2.campaign_id = $8
        ))
        OR (p.entity_type = 'creative' AND EXISTS (
          SELECT 1 FROM ad_creative_metrics m WHERE m.creative_snapshot_id = p.entity_id AND m.campaign_id = $8
        ))
      )
    )
  `;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM action_executions e
     JOIN action_proposals p ON p.id = e.proposal_id
     WHERE ${whereClause}`,
    params
  );

  const result = await pool.query(
    `SELECT
      e.id as execution_id,
      e.status as execution_status,
      e.attempts,
      e.dry_run,
      e.request_payload,
      e.meta_response,
      e.error_message,
      e.error_stack,
      e.started_at,
      e.completed_at,
      e.executed_by_type,
      e.executed_by_user_id,
      e.created_at as execution_created_at,
      e.updated_at as execution_updated_at,
      p.id as proposal_id,
      p.client_id,
      p.action,
      p.title,
      p.description,
      p.category,
      p.severity,
      p.entity_type,
      p.entity_id,
      p.source,
      p.created_at as proposal_created_at,
      p.updated_at as proposal_updated_at,
      c.name as campaign_name,
      a.adset_name as adset_name,
      s.headline as creative_headline,
      s.primary_text as creative_primary_text
    FROM action_executions e
    JOIN action_proposals p ON p.id = e.proposal_id
    LEFT JOIN campaigns c
      ON p.entity_type = 'campaign'
     AND (c.id = p.entity_id OR c."externalId" = p.entity_id)
    LEFT JOIN adsets a
      ON p.entity_type = 'adset'
     AND a.adset_id = p.entity_id
    LEFT JOIN ad_creative_snapshots s
      ON p.entity_type = 'creative'
     AND s.id = p.entity_id
    WHERE ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT $9 OFFSET $10`,
    [...params, filters.limit, filters.offset]
  );

  return {
    total: Number(countResult.rows?.[0]?.total ?? 0),
    history: result.rows.map(mapHistoryRow),
  };
};

export const getActionProposalDetail = async (pool: Pool, id: string) => {
  const proposalResult = await pool.query(
    `${proposalWithLastDecisionSelect}
     WHERE p.id = $1
     LIMIT 1`,
    [id]
  );

  if (proposalResult.rows.length === 0) {
    return null;
  }

  const approvalsResult = await pool.query(
    `SELECT
      id, proposal_id, decision, reason, decided_by_user_id, decided_at, created_at
    FROM action_approvals
    WHERE proposal_id = $1
    ORDER BY decided_at DESC`,
    [id]
  );

  const executions = await listActionExecutions(pool, id);

  return {
    proposal: mapProposalRow(proposalResult.rows[0]),
    approvals: approvalsResult.rows.map(mapApprovalRow),
    executions,
  };
};

export const listActionExecutions = async (pool: Pool, proposalId: string) => {
  const executionsResult = await pool.query(
    `SELECT
      id, proposal_id, status, attempts, idempotency_key, dry_run,
      request_payload, meta_response, error_message, error_stack,
      started_at, completed_at,
      executed_by_type, executed_by_user_id,
      created_at, updated_at
    FROM action_executions
    WHERE proposal_id = $1
    ORDER BY created_at DESC`,
    [proposalId]
  );

  return executionsResult.rows.map(mapExecutionRow);
};
