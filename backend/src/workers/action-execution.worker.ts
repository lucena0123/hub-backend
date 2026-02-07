/**
 * Action Execution Worker
 * Executes approved action proposals via Meta API.
 * Replaces the in-memory `runExecutionAsync` from action-proposals.routes.ts.
 */

import { Worker, type Job } from 'bullmq';
import type { Pool } from 'pg';
import type IORedis from 'ioredis';
import { QUEUE_NAMES } from '../config/queues';
import { MetaAdsService } from '../services/meta-ads-service';

type ActionExecutionJobData = { executionId: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createActionExecutionWorker(pool: Pool, connection: IORedis) {
  return new Worker<ActionExecutionJobData>(
    QUEUE_NAMES.ACTION_EXECUTION,
    async (job: Job<ActionExecutionJobData>) => {
      const { executionId } = job.data;

      const accessToken = process.env.META_ACCESS_TOKEN;
      const writebackEnabled = String(process.env.META_WRITEBACK_ENABLED || '').trim().toLowerCase() === 'true';

      const markFailed = async (opts: { message: string; stack?: string | null; metaResponse?: unknown }) => {
        await pool.query(
          `UPDATE action_executions
           SET status = 'failed', error_message = $2, error_stack = $3,
               meta_response = COALESCE($4::jsonb, meta_response),
               completed_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [executionId, opts.message, opts.stack ?? null, opts.metaResponse ? JSON.stringify(opts.metaResponse) : null]
        );
      };

      const markSuccess = async (opts: { metaResponse: unknown }) => {
        await pool.query(
          `UPDATE action_executions
           SET status = 'success', meta_response = $2::jsonb,
               completed_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [executionId, JSON.stringify(opts.metaResponse)]
        );
      };

      // Transition to running
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const current = await client.query(
          `SELECT id, status FROM action_executions WHERE id = $1 FOR UPDATE`,
          [executionId]
        );

        if (current.rows.length === 0) {
          await client.query('ROLLBACK');
          return { executionId, skipped: true, reason: 'not_found' };
        }

        const status = String(current.rows[0].status || '');
        if (status !== 'queued') {
          await client.query('ROLLBACK');
          return { executionId, skipped: true, reason: 'already_started', status };
        }

        await client.query(
          `UPDATE action_executions
           SET status = 'running', attempts = attempts + 1,
               started_at = NOW(), completed_at = NULL,
               error_message = NULL, error_stack = NULL, updated_at = NOW()
           WHERE id = $1`,
          [executionId]
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Load execution + proposal
      const executionResult = await pool.query(
        `SELECT id, proposal_id, dry_run FROM action_executions WHERE id = $1 LIMIT 1`,
        [executionId]
      );
      const execution = executionResult.rows?.[0];
      if (!execution) {
        await markFailed({ message: 'Execution not found after startRunning' });
        return;
      }

      const dryRun = Boolean(execution.dry_run) || !writebackEnabled;
      if (!accessToken && !dryRun) {
        await markFailed({ message: 'Missing META_ACCESS_TOKEN', metaResponse: { error: 'missing_meta_access_token' } });
        return;
      }

      const proposalId = String(execution.proposal_id);
      const proposalResult = await pool.query(
        `SELECT id, client_id, platform, account_id, action, entity_type, entity_id, status, recommended_payload
         FROM action_proposals WHERE id = $1 LIMIT 1`,
        [proposalId]
      );
      const proposal = proposalResult.rows?.[0];
      if (!proposal) {
        await markFailed({ message: 'Proposal not found', metaResponse: { proposalId } });
        return;
      }

      if (String(proposal.status) !== 'approved') {
        await markFailed({ message: `Proposal not approved (status=${proposal.status})`, metaResponse: { proposalId, status: proposal.status } });
        return;
      }

      const accountId = typeof proposal.account_id === 'string' && proposal.account_id.trim()
        ? proposal.account_id.trim().replace(/^act_/i, '')
        : null;

      if (!accountId) {
        await markFailed({ message: 'Missing Meta ad account id', metaResponse: { proposalId, clientId: proposal.client_id } });
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

      const isRetryableError = (error: any) => {
        const status = error?.status;
        const code = error?.code;
        return status === null || (typeof status === 'number' && status >= 500) || code === 4 || code === 17;
      };

      try {
        const result = await executeWithRetry(async () => {
          // Pause creative (existing)
          if (action === 'pause' && entityType === 'creative') {
            const adIdsResult = await pool.query(
              `SELECT ad_id FROM ad_creative_metrics
               WHERE creative_snapshot_id = $1 AND platform = 'meta' AND date >= (CURRENT_DATE - 7)
               GROUP BY ad_id ORDER BY COALESCE(SUM(spend), 0) DESC LIMIT 20`,
              [entityId]
            );
            const adIds = adIdsResult.rows.map((r: any) => String(r.ad_id)).filter(Boolean);
            if (adIds.length === 0) {
              return { ok: false, retryable: false, meta: { error: 'no_ads_found_for_snapshot', snapshotId: entityId } };
            }
            const ops = [];
            for (const adId of adIds) ops.push(await metaService.pauseAd(adId, { dryRun }));
            const ok = ops.every((op: any) => Boolean(op?.success));
            return { ok, retryable: !ok && ops.some((op: any) => isRetryableError(op?.error)), meta: { operation: 'pause_ads', dryRun, adIds, ops } };
          }

          // Scale campaign (existing)
          if (action === 'scale' && entityType === 'campaign') {
            const adsetsResult = await pool.query(
              `SELECT adset_id, daily_budget FROM adsets WHERE campaign_id = $1 AND platform = 'meta' LIMIT 20`,
              [entityId]
            );
            const adsets = adsetsResult.rows
              .map((r: any) => ({ adsetId: String(r.adset_id), dailyBudget: Number(r.daily_budget ?? 0) }))
              .filter((r: any) => r.adsetId && r.dailyBudget > 0);
            if (adsets.length === 0) {
              return { ok: false, retryable: false, meta: { error: 'no_adsets_found_for_campaign', campaignId: entityId } };
            }
            const ops = [];
            for (const adset of adsets) {
              const nextBudget = Math.round(adset.dailyBudget * 1.2 * 100) / 100;
              ops.push(await metaService.setAdSetDailyBudget(adset.adsetId, nextBudget, { dryRun }));
            }
            const ok = ops.length > 0 && ops.every((op: any) => Boolean(op?.success));
            return { ok, retryable: !ok && ops.some((op: any) => isRetryableError(op?.error)), meta: { operation: 'scale_campaign', dryRun, campaignId: entityId, ops } };
          }

          // Pause campaign (new)
          if (action === 'pause_campaign' && entityType === 'campaign') {
            const res = await metaService.pauseCampaign(entityId, { dryRun });
            return { ok: res.success, retryable: !res.success && isRetryableError(res.error), meta: { operation: 'pause_campaign', dryRun, campaignId: entityId, response: res } };
          }

          // Activate campaign (new)
          if (action === 'activate_campaign' && entityType === 'campaign') {
            const res = await metaService.activateCampaign(entityId, { dryRun });
            return { ok: res.success, retryable: !res.success && isRetryableError(res.error), meta: { operation: 'activate_campaign', dryRun, campaignId: entityId, response: res } };
          }

          // Pause adset (new)
          if (action === 'pause_adset' && entityType === 'adset') {
            const res = await metaService.pauseAdSet(entityId, { dryRun });
            return { ok: res.success, retryable: !res.success && isRetryableError(res.error), meta: { operation: 'pause_adset', dryRun, adsetId: entityId, response: res } };
          }

          // Activate adset (new)
          if (action === 'activate_adset' && entityType === 'adset') {
            const res = await metaService.activateAdSet(entityId, { dryRun });
            return { ok: res.success, retryable: !res.success && isRetryableError(res.error), meta: { operation: 'activate_adset', dryRun, adsetId: entityId, response: res } };
          }

          // Reduce budget (new)
          if (action === 'reduce_budget' && entityType === 'adset') {
            const percentage = (proposal.recommended_payload as any)?.percentage ?? 20;
            const currentResult = await pool.query(`SELECT daily_budget FROM adsets WHERE adset_id = $1 AND platform = 'meta' LIMIT 1`, [entityId]);
            const currentBudget = Number(currentResult.rows?.[0]?.daily_budget ?? 0);
            if (currentBudget <= 0) {
              return { ok: false, retryable: false, meta: { error: 'no_budget_found', adsetId: entityId } };
            }
            const newBudget = Math.round(currentBudget * (1 - percentage / 100) * 100) / 100;
            const res = await metaService.setAdSetDailyBudget(entityId, Math.max(newBudget, 1), { dryRun });
            return { ok: res.success, retryable: !res.success && isRetryableError(res.error), meta: { operation: 'reduce_budget', dryRun, adsetId: entityId, percentage, from: currentBudget, to: newBudget, response: res } };
          }

          // Set budget (new)
          if (action === 'set_budget' && entityType === 'adset') {
            const amount = (proposal.recommended_payload as any)?.amount;
            if (!amount || amount <= 0) {
              return { ok: false, retryable: false, meta: { error: 'invalid_budget_amount', amount } };
            }
            const res = await metaService.setAdSetDailyBudget(entityId, amount, { dryRun });
            return { ok: res.success, retryable: !res.success && isRetryableError(res.error), meta: { operation: 'set_budget', dryRun, adsetId: entityId, amount, response: res } };
          }

          return { ok: false, retryable: false, meta: { error: 'unsupported_action', action, entityType, entityId } };
        });

        const requestPayload = { proposalId, action, entityType, entityId, dryRun, generatedAt: new Date().toISOString() };
        await pool.query('UPDATE action_executions SET request_payload = $2::jsonb, updated_at = NOW() WHERE id = $1', [executionId, JSON.stringify(requestPayload)]);

        if (!result.ok) {
          await markFailed({ message: 'Action execution failed', metaResponse: result.meta });
          return { executionId, success: false };
        }

        await markSuccess({ metaResponse: result.meta });
        if (!dryRun) {
          await pool.query('UPDATE action_proposals SET status = $2, updated_at = NOW() WHERE id = $1', [proposalId, 'executed']);
        }

        return { executionId, success: true, dryRun };
      } catch (error) {
        await markFailed({
          message: error instanceof Error ? error.message : 'Unknown execution error',
          stack: error instanceof Error ? error.stack ?? null : null,
        });
        throw error;
      }
    },
    {
      connection,
      concurrency: 2,
    }
  );
}
