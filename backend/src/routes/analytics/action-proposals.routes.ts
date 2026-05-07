import type { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

import { requireAuth } from '../../middleware/rbac';
import { buildOptimizationCenter } from './optimization-center/handler';
import {
  mapProposalRow,
  parseLimit,
  parseOffset,
  toNullableString,
} from './action-proposals/mappers';
import {
  getActionProposalDetail,
  listActionExecutions,
  listActionHistory,
  listActionProposals,
} from './action-proposals/repository';

const actionProposalsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  const enqueueExecutionJob = async (executionId: string) => {
    const job = await fastify.services.queue.addActionExecutionJob(executionId);
    if (!job) {
      throw new Error('Queue service not available (BullMQ disabled)');
    }
    return job;
  };

  fastify.get<{
    Params: { clientId: string };
    Querystring: { status?: string; action?: string; entityType?: string; limit?: string };
  }>(
    '/api/clients/:clientId/action-proposals',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const { clientId } = request.params;
        const status = toNullableString(request.query.status);
        const action = toNullableString(request.query.action);
        const entityType = toNullableString(request.query.entityType);
        const limit = parseLimit(request.query.limit);

        const proposals = await listActionProposals(pool, clientId, { status, action, entityType, limit });
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

  fastify.get<{
    Params: { clientId: string };
    Querystring: {
      status?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      campaignId?: string;
      startDate?: string;
      endDate?: string;
      limit?: string;
      offset?: string;
    };
  }>(
    '/api/clients/:clientId/action-history',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const { clientId } = request.params;
        const status = toNullableString(request.query.status);
        const action = toNullableString(request.query.action);
        const entityType = toNullableString(request.query.entityType);
        const entityId = toNullableString(request.query.entityId);
        const campaignId = toNullableString(request.query.campaignId);
        const startDate = toNullableString(request.query.startDate);
        const endDate = toNullableString(request.query.endDate);
        const limit = parseLimit(request.query.limit);
        const offset = parseOffset(request.query.offset);

        const { total, history } = await listActionHistory(pool, clientId, {
          status,
          action,
          entityType,
          entityId,
          campaignId,
          startDate,
          endDate,
          limit,
          offset,
        });
        return { clientId, total, history };
      } catch (error) {
        reply.status(500);
        return {
          error: 'Failed to fetch action history',
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

        const detail = await getActionProposalDetail(pool, id);

        if (!detail) {
          reply.status(404);
          return { error: 'Action proposal not found' };
        }

        return detail;
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
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params;
      const userId = (request as any)?.user?.id || null;

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
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params;
      const userId = (request as any)?.user?.id || null;

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
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params;
      const userId = (request as any)?.user?.id || null;
      if (!fastify.services.queue?.available) {
        reply.status(503);
        return { error: 'Queue service not available (BullMQ disabled)' };
      }

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
            try {
              await enqueueExecutionJob(executionId);
              reply.status(202);
              return { success: true, queued: true, dryRun, retried: true, executionId };
            } catch (enqueueError) {
              await pool.query(
                `UPDATE action_executions
                 SET status = 'failed',
                     error_message = $2,
                     updated_at = NOW()
                 WHERE id = $1`,
                [executionId, enqueueError instanceof Error ? enqueueError.message : 'Failed to enqueue action execution']
              );
              reply.status(503);
              return {
                error: 'Failed to enqueue action execution',
                message: enqueueError instanceof Error ? enqueueError.message : 'Unknown queue error',
                executionId,
              };
            }
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
        try {
          await enqueueExecutionJob(executionId);
          reply.status(202);
          return { success: true, queued: true, dryRun, executionId };
        } catch (enqueueError) {
          await pool.query(
            `UPDATE action_executions
             SET status = 'failed',
                 error_message = $2,
                 updated_at = NOW()
             WHERE id = $1`,
            [executionId, enqueueError instanceof Error ? enqueueError.message : 'Failed to enqueue action execution']
          );
          reply.status(503);
          return {
            error: 'Failed to enqueue action execution',
            message: enqueueError instanceof Error ? enqueueError.message : 'Unknown queue error',
            executionId,
          };
        }
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
        const executions = await listActionExecutions(pool, id);

        return {
          proposalId: id,
          total: executions.length,
          executions,
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
    { preHandler: [requireAuth] },
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
          (actionsRaw && actionsRaw.length > 0 ? actionsRaw : ['pause', 'scale']).map((a) => String(a))
        );

        const clientConfig = await pool.query('SELECT \"metaAdAccountId\" FROM clients WHERE id = $1', [clientId]);
        const accountIdRaw = clientConfig.rows?.[0]?.metaAdAccountId;
        const accountId =
          typeof accountIdRaw === 'string' && accountIdRaw.trim() ? accountIdRaw.trim().replace(/^act_/i, '') : null;

        const { analytics, ruleProfiles } = fastify.services;
        const optimization = await buildOptimizationCenter({
          analytics,
          ruleProfiles,
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

        // ─── Auto-approve eligible proposals ───
        let autoApproved = 0;
        let autoSkipped = 0;

        let autoApproveEnabled = false;
        try {
          const targetsResult = await pool.query(
            `SELECT optimization_targets FROM clients WHERE id = $1`,
            [clientId]
          );
          const raw = targetsResult.rows?.[0]?.optimization_targets;
          if (raw && typeof raw === 'object' && raw.autoApproveEnabled === true) {
            autoApproveEnabled = true;
          }
        } catch (_) {}

        if (autoApproveEnabled && createdIds.length > 0) {
          const autoApproveMaxSpend = 500;
          const maxAutoApprovals = 5;

          for (const proposalId of createdIds) {
            if (autoApproved >= maxAutoApprovals) {
              autoSkipped++;
              continue;
            }

            const matching = toInsert.find((r) => r.id === proposalId);
            if (!matching) { autoSkipped++; continue; }

            const payload = matching.recommendedPayload;
            const metrics = payload?.metrics ?? {};
            const ruleId = matching.ruleId ?? '';
            const spend = parseFloat(metrics.spend ?? metrics.spendLast7 ?? 0) || 0;
            const conversations = parseInt(metrics.conversations ?? metrics.conversationsLast7 ?? 0) || 0;

            const isLoser = ruleId.includes('loser') && spend >= 200 && conversations === 0;
            const isFatigued = ruleId.includes('fatigued');

            if (!isLoser && !isFatigued) { autoSkipped++; continue; }
            if (spend > autoApproveMaxSpend) { autoSkipped++; continue; }

            try {
              const approvalId = uuidv4();
              await pool.query(
                `INSERT INTO action_approvals
                  (id, proposal_id, decision, reason, decided_by_user_id, decided_at, created_at)
                 VALUES ($1, $2, 'approved', $3, NULL, NOW(), NOW())`,
                [approvalId, proposalId, `Auto-approved: ${ruleId} (spend=${spend}, conv=${conversations})`]
              );
              await pool.query(
                `UPDATE action_proposals SET status = 'approved', updated_at = NOW() WHERE id = $1`,
                [proposalId]
              );
              autoApproved++;
            } catch (_) {
              autoSkipped++;
            }
          }
        }

        return {
          clientId,
          playbookVersion,
          period: (optimization as any)?.period ?? null,
          candidates: candidates.length,
          created: createdCount,
          createdIds,
          skipped: candidates.length - createdCount,
          autoApproved,
          autoSkipped,
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
