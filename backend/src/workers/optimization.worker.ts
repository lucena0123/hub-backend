/**
 * Optimization Worker
 * Runs daily (after sync) to generate action proposals from the optimization center.
 * Reuses the same logic as POST /api/clients/:clientId/action-proposals/generate.
 */

import { Worker, type Job } from 'bullmq';
import type { Pool } from 'pg';
import type IORedis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { QUEUE_NAMES } from '../config/queues';
import { buildOptimizationCenter } from '../routes/analytics/optimization-center/handler';
import { NotificationService } from '../services/notification-service';
import { AnalyticsService } from '../services/analytics/analytics-service';

type OptimizationJobData = { clientId: string };

const toNullableString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export function createOptimizationWorker(pool: Pool, connection: IORedis, analytics: AnalyticsService) {
  return new Worker<OptimizationJobData>(
    QUEUE_NAMES.OPTIMIZATION,
    async (job: Job<OptimizationJobData>) => {
      const { clientId } = job.data;

      // Verify client exists and is active
      const clientResult = await pool.query(
        `SELECT id, "metaAdAccountId" FROM clients WHERE id = $1 AND status = 'active'`,
        [clientId]
      );

      if (clientResult.rows.length === 0) {
        return { clientId, skipped: true, reason: 'client_not_found_or_inactive' };
      }

      const accountIdRaw = clientResult.rows[0].metaAdAccountId;
      const accountId =
        typeof accountIdRaw === 'string' && accountIdRaw.trim()
          ? accountIdRaw.trim().replace(/^act_/i, '')
          : null;

      // Build optimization center analysis
      const optimization = await buildOptimizationCenter({
        analytics,
        clientId,
        query: { period: '7d' },
      });

      const playbookVersion = (optimization as any)?.playbookVersion ?? null;
      const items: any[] = Array.isArray((optimization as any)?.items) ? (optimization as any).items : [];

      const allowedActions = new Set(['pause', 'scale', 'refresh', 'pause_campaign', 'activate_campaign', 'pause_adset', 'activate_adset', 'reduce_budget', 'set_budget']);

      const candidates = items.filter((item) => {
        if (!item || typeof item !== 'object') return false;
        if (!allowedActions.has(String(item.action || ''))) return false;
        if (!item.entity || typeof item.entity !== 'object') return false;
        return typeof item.entity.type === 'string' && typeof item.entity.id === 'string' && item.entity.id.trim();
      });

      if (candidates.length === 0) {
        return { clientId, candidates: 0, created: 0 };
      }

      // Deduplicate against existing proposals (last 7 days)
      const existingResult = await pool.query(
        `SELECT entity_type, entity_id, action, COALESCE(rule_id, '') AS rule_id, COALESCE(playbook_version, '') AS playbook_version
         FROM action_proposals
         WHERE client_id = $1 AND created_at >= NOW() - INTERVAL '7 days' AND status IN ('pending', 'approved')`,
        [clientId]
      );

      const existingKeys = new Set(
        existingResult.rows.map(
          (row: any) => `${row.entity_type}:${row.entity_id}:${row.action}:${row.rule_id}:${row.playbook_version}`
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

      let createdCount = 0;

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
            'system',
            null // created_by_user_id
          );
        }

        const insertResult = await pool.query(
          `INSERT INTO action_proposals (
            id, client_id, platform, account_id, source, source_item_id,
            rule_id, playbook_version, severity, category, action, title, description,
            entity_type, entity_id, recommended_payload,
            created_by_type, created_by_user_id,
            created_at, updated_at
          ) VALUES ${placeholders.join(', ')}
          RETURNING id`,
          values
        );

        createdCount = insertResult.rows.length;
      }

      // Notify if proposals were created
      if (createdCount > 0) {
        const notificationService = new NotificationService(pool);
        await notificationService.create({
          clientId,
          type: 'proposal_created',
          severity: 'info',
          title: `${createdCount} proposta${createdCount > 1 ? 's' : ''} de otimização`,
          message: `O sistema gerou ${createdCount} proposta${createdCount > 1 ? 's' : ''} de otimização aguardando sua aprovação.`,
          metadata: { created: createdCount, candidates: candidates.length },
          expiresInHours: 72,
        }).catch(() => { });
      }

      return {
        clientId,
        playbookVersion,
        candidates: candidates.length,
        created: createdCount,
        skipped: candidates.length - createdCount,
      };
    },
    {
      connection,
      concurrency: 2,
    }
  );
}
