import type { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

import { requireAuth } from '../../middleware/rbac';
import { optionalAuth } from '../../middleware/auth';
import { MetaAdsService } from '../../services/meta-ads-service';
import { buildOptimizationCenter } from './optimization-center/handler';

type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'expired';

const toNullableString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseLimit = (raw: unknown) => {
  const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN;
  const limit = Number.isFinite(parsed) ? parsed : 50;
  return Math.max(1, Math.min(200, limit));
};

const mapProposalRow = (row: any) => ({
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

const mapApprovalRow = (row: any) => ({
  approvalId: String(row.id),
  proposalId: String(row.proposal_id),
  decision: row.decision,
  reason: row.reason ?? null,
  decidedByUserId: row.decided_by_user_id,
  decidedAt: row.decided_at,
  createdAt: row.created_at,
});

const mapExecutionRow = (row: any) => ({
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

const actionProposalsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  const runExecutionAsync = async (executionId: string) => {
    const accessToken = process.env.META_ACCESS_TOKEN;
    const writebackEnabled = String(process.env.META_WRITEBACK_ENABLED || '').trim().toLowerCase() === 'true';

    const markFailed = async (opts: { message: string; stack?: string | null; metaResponse?: unknown }) => {
      try {
        await pool.query(
          `UPDATE action_executions
           SET status = 'failed',
               error_message = $2,
               error_stack = $3,
               meta_response = COALESCE($4::jsonb, meta_response),
               completed_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [executionId, opts.message, opts.stack ?? null, opts.metaResponse ?? null]
        );
      } catch (error) {
        fastify.log.error({ error, executionId }, 'Failed to mark action execution as failed');
      }
    };

    const markSuccess = async (opts: { metaResponse: unknown }) => {
      try {
        await pool.query(
          `UPDATE action_executions
           SET status = 'success',
               meta_response = $2::jsonb,
               completed_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [executionId, opts.metaResponse]
        );
      } catch (error) {
        fastify.log.error({ error, executionId }, 'Failed to mark action execution as success');
      }
    };

    const startRunning = async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const current = await client.query(
          `SELECT id, status, attempts, proposal_id, dry_run
           FROM action_executions
           WHERE id = $1
           FOR UPDATE`,
          [executionId]
        );

        if (current.rows.length === 0) {
          await client.query('ROLLBACK');
          return { ok: false as const, reason: 'not_found' as const };
        }

        const status = String(current.rows[0].status || '');
        if (status !== 'queued') {
          await client.query('ROLLBACK');
          return { ok: false as const, reason: 'already_started' as const, status };
        }

        await client.query(
          `UPDATE action_executions
           SET status = 'running',
               attempts = attempts + 1,
               started_at = NOW(),
               completed_at = NULL,
               error_message = NULL,
               error_stack = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [executionId]
        );

        await client.query('COMMIT');
        return { ok: true as const };
      } catch (error) {
        await client.query('ROLLBACK');
        return { ok: false as const, reason: 'db_error' as const, error };
      } finally {
        client.release();
      }
    };

    const start = await startRunning();
    if (!start.ok) {
      if (start.reason === 'db_error') fastify.log.error({ error: (start as any).error, executionId }, 'Failed to start execution');
      return;
    }

    try {
      const executionResult = await pool.query(
        `SELECT id, proposal_id, dry_run, request_payload
         FROM action_executions
         WHERE id = $1
         LIMIT 1`,
        [executionId]
      );

      const execution = executionResult.rows?.[0];
      if (!execution) {
        await markFailed({ message: 'Execution not found after startRunning' });
        return;
      }

      const dryRun = Boolean(execution.dry_run) || !writebackEnabled;
      if (!accessToken && !dryRun) {
        await markFailed({
          message: 'Missing META_ACCESS_TOKEN (backend .env)',
          metaResponse: { error: 'missing_meta_access_token' },
        });
        return;
      }

      const proposalId = String(execution.proposal_id);
      const proposalResult = await pool.query(
        `SELECT
          id,
          client_id,
          platform,
          account_id,
          action,
          entity_type,
          entity_id,
          status,
          recommended_payload
         FROM action_proposals
         WHERE id = $1
         LIMIT 1`,
        [proposalId]
      );

      const proposal = proposalResult.rows?.[0];
      if (!proposal) {
        await markFailed({ message: 'Proposal not found for execution', metaResponse: { proposalId } });
        return;
      }

      if (String(proposal.status) !== 'approved') {
        await markFailed({
          message: `Proposal status is not approved (current=${String(proposal.status)})`,
          metaResponse: { proposalId, status: proposal.status },
        });
        return;
      }

      const accountId =
        typeof proposal.account_id === 'string' && proposal.account_id.trim() ? proposal.account_id.trim().replace(/^act_/i, '') : null;

      if (!accountId) {
        await markFailed({
          message: 'Missing Meta ad account id for proposal (account_id is null)',
          metaResponse: { proposalId, clientId: proposal.client_id },
        });
        return;
      }

      const metaService = new MetaAdsService({
        accessToken: accessToken ?? 'dry_run',
        adAccountId: accountId,
        apiVersion: process.env.META_API_VERSION,
      });

      const action = String(proposal.action || '');
      const entityType = String(proposal.entity_type || '');
      const entityId = String(proposal.entity_id || '');

      const executeWithRetry = async (fn: () => Promise<{ ok: boolean; meta: any; retryable: boolean }>) => {
        const maxAttempts = 3;
        let lastMeta: any = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          if (attempt > 1) {
            await pool.query('UPDATE action_executions SET attempts = attempts + 1, updated_at = NOW() WHERE id = $1', [executionId]);
          }
          const res = await fn();
          lastMeta = res.meta;
          if (res.ok) return { ok: true as const, meta: lastMeta };
          if (!res.retryable || attempt === maxAttempts) return { ok: false as const, meta: lastMeta };
          await sleep(1000 * Math.pow(2, attempt - 1));
        }
        return { ok: false as const, meta: lastMeta };
      };

      const result = await executeWithRetry(async () => {
        if (action === 'pause' && entityType === 'creative') {
          const adIdsResult = await pool.query(
            `SELECT ad_id, COALESCE(SUM(spend), 0) as spend
             FROM ad_creative_metrics
             WHERE creative_snapshot_id = $1
               AND platform = 'meta'
               AND date >= (CURRENT_DATE - 7)
             GROUP BY ad_id
             ORDER BY spend DESC
             LIMIT 20`,
            [entityId]
          );

          const adIds = adIdsResult.rows.map((r: any) => String(r.ad_id)).filter((id: string) => Boolean(id));
          if (adIds.length === 0) {
            return {
              ok: false,
              retryable: false,
              meta: { error: 'no_ads_found_for_snapshot', snapshotId: entityId },
            };
          }

          const operations = [];
          for (const adId of adIds) {
            operations.push(await metaService.pauseAd(adId, { dryRun }));
          }

          const ok = operations.every((op: any) => Boolean(op?.success));
          const retryable = operations.some((op: any) => {
            const status = op?.error?.status;
            const code = op?.error?.code;
            return status === null || (typeof status === 'number' && status >= 500) || code === 4 || code === 17;
          });

          return {
            ok,
            retryable: !ok && retryable,
            meta: {
              operation: 'pause_ads',
              dryRun,
              adIds,
              operations,
            },
          };
        }

        if (action === 'scale' && entityType === 'campaign') {
          const adsetsResult = await pool.query(
            `SELECT adset_id, daily_budget, status, effective_status
             FROM adsets
             WHERE campaign_id = $1
               AND platform = 'meta'
             ORDER BY daily_budget DESC
             LIMIT 20`,
            [entityId]
          );

          const adsets = adsetsResult.rows
            .map((row: any) => ({
              adsetId: typeof row.adset_id === 'string' ? row.adset_id : null,
              dailyBudget: typeof row.daily_budget === 'string' ? Number.parseFloat(row.daily_budget) : Number(row.daily_budget ?? 0),
              status: row.status ?? null,
              effectiveStatus: row.effective_status ?? null,
            }))
            .filter((row: any) => typeof row.adsetId === 'string' && row.adsetId.trim());

          if (adsets.length === 0) {
            return {
              ok: false,
              retryable: false,
              meta: { error: 'no_adsets_found_for_campaign', campaignId: entityId },
            };
          }

          const operations = [];
          for (const adset of adsets) {
            const currentBudget = Number.isFinite(adset.dailyBudget) ? adset.dailyBudget : 0;
            if (currentBudget <= 0) continue;
            const nextBudget = Math.round(currentBudget * 1.2 * 100) / 100;
            operations.push(
              await metaService.setAdSetDailyBudget(adset.adsetId, nextBudget, { dryRun })
            );
          }

          const ok = operations.length > 0 && operations.every((op: any) => Boolean(op?.success));
          const retryable = operations.some((op: any) => {
            const status = op?.error?.status;
            const code = op?.error?.code;
            return status === null || (typeof status === 'number' && status >= 500) || code === 4 || code === 17;
          });

          return {
            ok,
            retryable: !ok && retryable,
            meta: {
              operation: 'scale_campaign_adsets',
              dryRun,
              campaignId: entityId,
              adsets,
              operations,
            },
          };
        }

        return {
          ok: false,
          retryable: false,
          meta: { error: 'unsupported_action', action, entityType, entityId },
        };
      });

      const requestPayload = {
        proposalId,
        action,
        entityType,
        entityId,
        dryRun,
        generatedAt: new Date().toISOString(),
      };

      await pool.query('UPDATE action_executions SET request_payload = $2::jsonb, updated_at = NOW() WHERE id = $1', [
        executionId,
        requestPayload,
      ]);

      if (!result.ok) {
        await markFailed({
          message: 'Action execution failed',
          metaResponse: result.meta,
        });
        return;
      }

      await markSuccess({ metaResponse: result.meta });
      if (!dryRun) {
        await pool.query('UPDATE action_proposals SET status = $2, updated_at = NOW() WHERE id = $1', [proposalId, 'executed']);
      }
    } catch (error) {
      await markFailed({
        message: error instanceof Error ? error.message : 'Unknown execution error',
        stack: error instanceof Error ? error.stack ?? null : null,
      });
    }
  };

  fastify.get<{
    Params: { clientId: string };
    Querystring: { status?: string; action?: string; entityType?: string; limit?: string };
  }>(
    '/api/clients/:clientId/action-proposals',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      try {
        const { clientId } = request.params;
        const status = toNullableString(request.query.status);
        const action = toNullableString(request.query.action);
        const entityType = toNullableString(request.query.entityType);
        const limit = parseLimit(request.query.limit);

        const result = await pool.query(
          `SELECT
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
          WHERE p.client_id = $1
            AND ($2::text IS NULL OR p.status = $2)
            AND ($3::text IS NULL OR p.action = $3)
            AND ($4::text IS NULL OR p.entity_type = $4)
          ORDER BY p.created_at DESC
          LIMIT $5`,
          [clientId, status, action, entityType, limit]
        );

        const proposals = result.rows.map(mapProposalRow);
        return { clientId, total: proposals.length, proposals };
      } catch (error) {
        reply.status(500);
        return {
          error: 'Failed to list action proposals',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/api/action-proposals/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const proposalResult = await pool.query(
          `SELECT
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
          WHERE p.id = $1
          LIMIT 1`,
          [id]
        );

        if (proposalResult.rows.length === 0) {
          reply.status(404);
          return { error: 'Action proposal not found' };
        }

        const approvalsResult = await pool.query(
          `SELECT
            id, proposal_id, decision, reason, decided_by_user_id, decided_at, created_at
          FROM action_approvals
          WHERE proposal_id = $1
          ORDER BY decided_at DESC`,
          [id]
        );

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
          [id]
        );

        return {
          proposal: mapProposalRow(proposalResult.rows[0]),
          approvals: approvalsResult.rows.map(mapApprovalRow),
          executions: executionsResult.rows.map(mapExecutionRow),
        };
      } catch (error) {
        reply.status(500);
        return {
          error: 'Failed to fetch action proposal',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  fastify.post<{ Params: { id: string }; Body: { reason?: string } }>(
    '/api/action-proposals/:id/approve',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      const { id } = request.params;
      const userId = (request as any)?.user?.id || null; // Allow null for anonymous

      const reason = toNullableString(request.body?.reason);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const current = await client.query('SELECT id, status FROM action_proposals WHERE id = $1 FOR UPDATE', [id]);
        if (current.rows.length === 0) {
          await client.query('ROLLBACK');
          reply.status(404);
          return { error: 'Action proposal not found' };
        }

        const status = String(current.rows[0].status || '');
        if (status !== 'pending') {
          await client.query('ROLLBACK');
          reply.status(409);
          return {
            error: 'Invalid proposal status',
            message: `Only pending proposals can be approved (current=${status})`,
          };
        }

        const approvalId = uuidv4();
        await client.query(
          `INSERT INTO action_approvals
            (id, proposal_id, decision, reason, decided_by_user_id, decided_at, created_at)
           VALUES ($1, $2, 'approved', $3, $4, NOW(), NOW())`,
          [approvalId, id, reason, userId]
        );

        await client.query('UPDATE action_proposals SET status = $2, updated_at = NOW() WHERE id = $1', [id, 'approved']);

        await client.query('COMMIT');

        const refreshed = await pool.query(
          `SELECT
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
           WHERE p.id = $1
           LIMIT 1`,
          [id]
        );

        return { success: true, approvalId, proposal: mapProposalRow(refreshed.rows[0]) };
      } catch (error) {
        await client.query('ROLLBACK');
        reply.status(500);
        return {
          error: 'Failed to approve action proposal',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      } finally {
        client.release();
      }
    }
  );

  fastify.post<{ Params: { id: string }; Body: { reason?: string } }>(
    '/api/action-proposals/:id/reject',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      const { id } = request.params;
      const userId = (request as any)?.user?.id || null; // Allow null for anonymous

      const reason = toNullableString(request.body?.reason);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const current = await client.query('SELECT id, status FROM action_proposals WHERE id = $1 FOR UPDATE', [id]);
        if (current.rows.length === 0) {
          await client.query('ROLLBACK');
          reply.status(404);
          return { error: 'Action proposal not found' };
        }

        const status = String(current.rows[0].status || '');
        if (status !== 'pending') {
          await client.query('ROLLBACK');
          reply.status(409);
          return {
            error: 'Invalid proposal status',
            message: `Only pending proposals can be rejected (current=${status})`,
          };
        }

        const rejectionId = uuidv4();
        await client.query(
          `INSERT INTO action_approvals
            (id, proposal_id, decision, reason, decided_by_user_id, decided_at, created_at)
           VALUES ($1, $2, 'rejected', $3, $4, NOW(), NOW())`,
          [rejectionId, id, reason, userId]
        );

        await client.query('UPDATE action_proposals SET status = $2, updated_at = NOW() WHERE id = $1', [id, 'rejected']);

        await client.query('COMMIT');

        const refreshed = await pool.query(
          `SELECT
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
           WHERE p.id = $1
           LIMIT 1`,
          [id]
        );

        return { success: true, rejectionId, proposal: mapProposalRow(refreshed.rows[0]) };
      } catch (error) {
        await client.query('ROLLBACK');
        reply.status(500);
        return {
          error: 'Failed to reject action proposal',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      } finally {
        client.release();
      }
    }
  );

  fastify.post<{ Params: { id: string }; Body: { dryRun?: boolean } }>(
    '/api/action-proposals/:id/execute',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      const { id } = request.params;
      const userId = (request as any)?.user?.id || null; // Allow null for anonymous

      const writebackEnabled = String(process.env.META_WRITEBACK_ENABLED || '').trim().toLowerCase() === 'true';
      const requestedDryRun = typeof request.body?.dryRun === 'boolean' ? request.body.dryRun : true;
      const dryRun = requestedDryRun || !writebackEnabled;

      const idempotencyKey = `proposal:${id}:${dryRun ? 'dry' : 'live'}`;
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const proposal = await client.query(
          'SELECT id, status FROM action_proposals WHERE id = $1 FOR UPDATE',
          [id]
        );

        if (proposal.rows.length === 0) {
          await client.query('ROLLBACK');
          reply.status(404);
          return { error: 'Action proposal not found' };
        }

        const status = String(proposal.rows[0].status || '');
        if (status !== 'approved') {
          await client.query('ROLLBACK');
          reply.status(409);
          return {
            error: 'Invalid proposal status',
            message: `Only approved proposals can be executed (current=${status})`,
          };
        }

        const existing = await client.query(
          `SELECT id, status
           FROM action_executions
           WHERE idempotency_key = $1
           LIMIT 1`,
          [idempotencyKey]
        );

        if (existing.rows.length > 0) {
          const executionId = String(existing.rows[0].id);
          const executionStatus = String(existing.rows[0].status || '');

          if (executionStatus === 'queued') {
            await client.query('COMMIT');
            reply.status(202);
            void runExecutionAsync(executionId);
            return { success: true, queued: true, dryRun, alreadyQueued: true, executionId };
          }

          if (executionStatus === 'running') {
            await client.query('COMMIT');
            reply.status(202);
            return { success: true, queued: true, dryRun, alreadyRunning: true, executionId };
          }

          if (executionStatus === 'success') {
            await client.query('COMMIT');
            return { success: true, queued: false, dryRun, alreadyCompleted: true, executionId };
          }

          if (executionStatus === 'failed') {
            await client.query(
              `UPDATE action_executions
               SET status = 'queued',
                   completed_at = NULL,
                   started_at = NULL,
                   error_message = NULL,
                   error_stack = NULL,
                   updated_at = NOW()
               WHERE id = $1`,
              [executionId]
            );

            await client.query('COMMIT');
            reply.status(202);
            void runExecutionAsync(executionId);
            return { success: true, queued: true, dryRun, retried: true, executionId };
          }
        }

        const executionId = uuidv4();
        await client.query(
          `INSERT INTO action_executions
            (id, proposal_id, status, attempts, idempotency_key, dry_run, request_payload, executed_by_type, executed_by_user_id, created_at, updated_at)
           VALUES ($1, $2, 'queued', 0, $3, $4, $5, 'user', $6, NOW(), NOW())`,
          [executionId, id, idempotencyKey, dryRun, { proposalId: id, dryRun }, userId]
        );

        await client.query('COMMIT');

        reply.status(202);
        void runExecutionAsync(executionId);
        return { success: true, queued: true, dryRun, executionId };
      } catch (error) {
        await client.query('ROLLBACK');
        reply.status(500);
        return {
          error: 'Failed to execute action proposal',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      } finally {
        client.release();
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/api/action-proposals/:id/executions',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const { id } = request.params;
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
          [id]
        );

        return {
          proposalId: id,
          total: executionsResult.rows.length,
          executions: executionsResult.rows.map(mapExecutionRow),
        };
      } catch (error) {
        reply.status(500);
        return {
          error: 'Failed to fetch action executions',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  fastify.post<{
    Params: { clientId: string };
    Body: { period?: string; startDate?: string; endDate?: string; campaignId?: string; actions?: string[] } | undefined;
  }>(
    '/api/clients/:clientId/action-proposals/generate',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      try {
        const { clientId } = request.params;
        const body = request.body || {};
        const period = toNullableString(body.period);
        const startDate = toNullableString(body.startDate);
        const endDate = toNullableString(body.endDate);
        const campaignId = toNullableString(body.campaignId);
        const actionsRaw = Array.isArray(body.actions) ? body.actions : null;
        const allowedActions = new Set(
          (actionsRaw && actionsRaw.length > 0 ? actionsRaw : ['pause', 'scale', 'refresh']).map((a) => String(a))
        );

        const clientConfig = await pool.query('SELECT \"metaAdAccountId\" FROM clients WHERE id = $1', [clientId]);
        const accountIdRaw = clientConfig.rows?.[0]?.metaAdAccountId;
        const accountId =
          typeof accountIdRaw === 'string' && accountIdRaw.trim() ? accountIdRaw.trim().replace(/^act_/i, '') : null;

        const optimization = await buildOptimizationCenter({
          pool,
          clientId,
          query: {
            ...(period ? { period } : {}),
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
            ...(campaignId ? { campaignId } : {}),
          },
        });

        const playbookVersion = (optimization as any)?.playbookVersion ?? null;
        const items = Array.isArray((optimization as any)?.items) ? ((optimization as any).items as any[]) : [];
        const candidates = items.filter((item) => {
          if (!item || typeof item !== 'object') return false;
          if (!allowedActions.has(String(item.action || ''))) return false;
          if (!item.entity || typeof item.entity !== 'object') return false;
          return typeof item.entity.type === 'string' && typeof item.entity.id === 'string' && item.entity.id.trim();
        });

        const existingResult = await pool.query(
          `SELECT
            entity_type,
            entity_id,
            action,
            COALESCE(rule_id, '') AS rule_id,
            COALESCE(playbook_version, '') AS playbook_version
          FROM action_proposals
          WHERE client_id = $1
            AND created_at >= NOW() - INTERVAL '7 days'
            AND status IN ('pending', 'approved')`,
          [clientId]
        );

        const existingKeys = new Set(
          existingResult.rows.map(
            (row: any) =>
              `${row.entity_type}:${row.entity_id}:${row.action}:${String(row.rule_id || '')}:${String(row.playbook_version || '')}`
          )
        );

        const toInsert: any[] = [];
        for (const item of candidates) {
          const entityType = String(item.entity.type);
          const entityId = String(item.entity.id);
          const ruleId = toNullableString(item.ruleId);
          const action = String(item.action || '');
          const key = `${entityType}:${entityId}:${action}:${ruleId ?? ''}:${playbookVersion ?? ''}`;
          if (existingKeys.has(key)) continue;
          existingKeys.add(key);

          toInsert.push({
            id: uuidv4(),
            clientId,
            platform: 'meta',
            accountId,
            source: 'optimization_center',
            sourceItemId: toNullableString(item.id),
            ruleId,
            playbookVersion,
            severity: toNullableString(item.severity),
            category: toNullableString(item.category),
            action: toNullableString(item.action),
            title: toNullableString(item.title),
            description: toNullableString(item.description),
            entityType,
            entityId,
            recommendedPayload: {
              theme: item.theme ?? null,
              entity: item.entity ?? null,
              metrics: item.metrics ?? null,
              thresholds: item.thresholds ?? null,
            },
          });
        }

        const createdByUserId = (request as any)?.user?.id;
        const createdByType = typeof createdByUserId === 'string' && createdByUserId.trim() ? 'user' : 'system';
        const createdByUserIdValue = createdByType === 'user' ? createdByUserId : null;

        let createdCount = 0;
        let createdIds: string[] = [];

        if (toInsert.length > 0) {
          const placeholders: string[] = [];
          const values: any[] = [];
          let pIndex = 1;

          for (const row of toInsert) {
            const rowPh: string[] = [];
            for (let i = 0; i < 18; i++) rowPh.push(`$${pIndex++}`);
            placeholders.push(`(${rowPh.join(', ')}, NOW(), NOW())`);

            values.push(
              row.id,
              row.clientId,
              row.platform,
              row.accountId,
              row.source,
              row.sourceItemId,
              row.ruleId,
              row.playbookVersion,
              row.severity,
              row.category,
              row.action,
              row.title,
              row.description,
              row.entityType,
              row.entityId,
              row.recommendedPayload,
              createdByType,
              createdByUserIdValue
            );
          }

          const insertResult = await pool.query(
            `INSERT INTO action_proposals (
              id,
              client_id,
              platform,
              account_id,
              source,
              source_item_id,
              rule_id,
              playbook_version,
              severity,
              category,
              action,
              title,
              description,
              entity_type,
              entity_id,
              recommended_payload,
              created_by_type,
              created_by_user_id,
              created_at,
              updated_at
            ) VALUES ${placeholders.join(', ')}
            RETURNING id`,
            values
          );

          createdCount = insertResult.rows.length;
          createdIds = insertResult.rows.map((r: any) => String(r.id));
        }

        return {
          clientId,
          playbookVersion,
          period: (optimization as any)?.period ?? null,
          candidates: candidates.length,
          created: createdCount,
          createdIds,
          skipped: candidates.length - createdCount,
        };
      } catch (error) {
        reply.status(500);
        return {
          error: 'Failed to generate action proposals',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

export default actionProposalsRoutes;
