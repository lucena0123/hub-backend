/**
 * Meta Sync Worker
 * Runs daily to synchronise Meta Ads data for each active client.
 * After a successful sync, enqueues an optimisation job for the same client.
 */

import { Worker, type Job } from 'bullmq';
import type { Pool } from 'pg';
import type IORedis from 'ioredis';
import { QUEUE_NAMES } from '../config/queues';
import { prisma } from '../config/prisma';
import { MetaAdsService } from '../services/meta-ads-service';
import { SyncHistoryService } from '../services/sync-history-service';
import { CacheService } from '../services/cache-service';
import { NotificationService } from '../services/notification-service';
import { runMetaSyncWork } from '../routes/meta-sync/sync-work';
import { getMetaSyncChunkDays, splitDateRange } from '../routes/meta-sync/utils';

type MetaSyncJobData = { clientId: string };

const noopLogger = {
  info: () => { },
  warn: () => { },
  error: console.error,
  debug: () => { },
  trace: () => { },
  fatal: console.error,
  child: () => noopLogger as any,
};

export function createMetaSyncWorker(pool: Pool, connection: IORedis, deps: { cacheRedis: any }) {
  const syncHistoryService = new SyncHistoryService(prisma);
  const cacheService = new CacheService(deps.cacheRedis);
  const notificationService = new NotificationService(pool);

  return new Worker<MetaSyncJobData>(
    QUEUE_NAMES.META_SYNC,
    async (job: Job<MetaSyncJobData>) => {
      const { clientId } = job.data;
      const startTime = Date.now();

      // Resolve client credentials
      const clientResult = await pool.query(
        `SELECT id, "metaAdAccountId" FROM clients WHERE id = $1 AND status = 'active'`,
        [clientId]
      );

      if (clientResult.rows.length === 0) {
        throw new Error(`Client ${clientId} not found or inactive`);
      }

      const storedAccountId = clientResult.rows[0].metaAdAccountId;
      const adAccountId =
        typeof storedAccountId === 'string' && storedAccountId.trim()
          ? storedAccountId.trim().replace(/^act_/i, '')
          : process.env.META_AD_ACCOUNT_ID || null;

      const accessToken = process.env.META_ACCESS_TOKEN || null;

      if (!accessToken || !adAccountId) {
        throw new Error(`Client ${clientId}: missing Meta credentials (accessToken or adAccountId)`);
      }

      // Date range: last 7 days
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      const since = start.toISOString().split('T')[0];
      const until = end.toISOString().split('T')[0];

      const chunkDays = getMetaSyncChunkDays();
      const dateChunks = splitDateRange(since, until, chunkDays);

      const metaService = new MetaAdsService({
        accessToken,
        adAccountId,
        apiVersion: process.env.META_API_VERSION,
      });

      // Create sync record
      const syncId = await syncHistoryService.createSyncRecord({
        platform: 'meta',
        accountId: adAccountId,
        dateRangeStart: since,
        dateRangeEnd: until,
        dryRun: false,
        triggeredBy: 'scheduler',
        metadata: {
          state: 'running',
          syncLevel: 'full',
          chunkDays,
          chunksTotal: dateChunks.length,
          progress: {
            overallTotal: dateChunks.length * 4 + dateChunks.length * 3, // campaign + adset + ad + breakdowns
            overallCompleted: 0,
            stage: 'campaign',
            stageTotal: dateChunks.length,
            stageCompleted: 0,
            message: 'Sincronização automática iniciada...',
            updatedAt: new Date().toISOString(),
          },
        },
      });

      let overallCompleted = 0;
      let stageCompleted = 0;

      const progressTracker = {
        setStage: async (stage: string, stageTotal: number, message: string) => {
          stageCompleted = 0;
          await syncHistoryService.updateSyncMetadata(syncId, {
            state: 'running',
            syncLevel: 'full',
            progress: {
              overallCompleted,
              stage,
              stageTotal,
              stageCompleted,
              message,
              updatedAt: new Date().toISOString(),
            },
          });
        },
        completeUnit: async (currentSince: string | null, currentUntil: string | null, message?: string) => {
          overallCompleted += 1;
          stageCompleted += 1;
          // update progress periodically, not every unit
          if (overallCompleted % 3 === 0 || message) {
            await syncHistoryService.updateSyncMetadata(syncId, {
              state: 'running',
              syncLevel: 'full',
              progress: {
                overallCompleted,
                stageCompleted,
                currentSince,
                currentUntil,
                ...(message ? { message } : {}),
                updatedAt: new Date().toISOString(),
              },
            });
          }
        },
      };

      try {
        const result = await runMetaSyncWork({
          pool,
          metaService,
          body: { syncLevel: 'full' as const, dryRun: false, async: false, clientId },
          dateChunks,
          since,
          until,
          cacheService,
          log: noopLogger as any,
          progress: progressTracker,
        });

        const duration = Date.now() - startTime;

        if (result.outcome === 'no_insights') {
          await syncHistoryService.completeSyncSuccess(syncId, {
            totalInsights: 0,
            mappedCampaigns: 0,
            updatedMetrics: 0,
            unmappedCampaigns: [],
            durationMs: duration,
          });
        } else {
          await syncHistoryService.completeSyncSuccess(syncId, {
            totalInsights: result.totalInsights,
            mappedCampaigns: result.mappedTotal,
            updatedMetrics: result.outcome === 'dry_run' ? 0 : result.updated,
            unmappedCampaigns: result.unmapped,
            durationMs: duration,
          });
        }

        // Notify on success
        await notificationService.create({
          clientId,
          type: 'sync_completed',
          severity: 'info',
          title: 'Sincronização concluída',
          message: `Meta Ads sincronizado: ${result.totalInsights} insights importados.`,
          metadata: { syncId, outcome: result.outcome, totalInsights: result.totalInsights, duration },
          expiresInHours: 48,
        }).catch(() => { });

        return {
          clientId,
          syncId,
          outcome: result.outcome,
          totalInsights: result.totalInsights,
          duration,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        if (error instanceof Error) {
          await syncHistoryService.completeSyncFailure(syncId, error, duration);
        }

        // Notify on failure
        await notificationService.create({
          clientId,
          type: 'sync_failed',
          severity: 'critical',
          title: 'Erro na sincronização',
          message: `Falha ao sincronizar Meta Ads: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          metadata: { syncId, duration },
          expiresInHours: 72,
        }).catch(() => { });

        throw error; // BullMQ will handle retry
      }
    },
    {
      connection,
      concurrency: 2,
    }
  );
}
