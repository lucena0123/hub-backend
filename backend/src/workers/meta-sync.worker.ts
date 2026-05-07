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
import { runMetaGovernanceStage } from '../services/meta-governance/runner';
import { SyncHistoryService } from '../services/sync-history-service';
import { CacheService } from '../services/cache-service';
import { NotificationService } from '../services/notification-service';
import { runMetaSyncWork } from '../routes/meta-sync/sync-work';
import { getMetaSyncChunkDays, splitDateRange } from '../routes/meta-sync/utils';

type MetaSyncJobData = { clientId: string };

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: console.error,
  debug: () => {},
  trace: () => {},
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

      const clientResult = await pool.query(`SELECT id, "metaAdAccountId" FROM clients WHERE id = $1 AND status = 'active'`, [clientId]);
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

      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      const since = start.toISOString().split('T')[0];
      const until = end.toISOString().split('T')[0];

      const chunkDays = getMetaSyncChunkDays();
      const dateChunks = splitDateRange(since, until, chunkDays);
      const totalUnits = dateChunks.length + dateChunks.length + (dateChunks.length + 1) + dateChunks.length * 5 + 1;

      const metaService = new MetaAdsService({
        accessToken,
        adAccountId,
        apiVersion: process.env.META_API_VERSION,
      });

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
            overallTotal: totalUnits,
            overallCompleted: 0,
            stage: 'campaign',
            stageTotal: dateChunks.length,
            stageCompleted: 0,
            message: 'Sincronização automática iniciada...',
            updatedAt: new Date().toISOString(),
          },
        },
      });

      const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null && !Array.isArray(value);

      const mergeRecords = (target: Record<string, unknown>, patch: Record<string, unknown>) => {
        const output: Record<string, unknown> = { ...target };
        for (const [key, value] of Object.entries(patch)) {
          if (isRecord(value) && isRecord(output[key])) {
            output[key] = mergeRecords(output[key] as Record<string, unknown>, value);
          } else {
            output[key] = value;
          }
        }
        return output;
      };

      let syncMetadata: Record<string, unknown> = {
        state: 'running',
        syncLevel: 'full',
        chunkDays,
        chunksTotal: dateChunks.length,
        progress: {
          overallTotal: totalUnits,
          overallCompleted: 0,
          stage: 'campaign',
          stageTotal: dateChunks.length,
          stageCompleted: 0,
          message: 'Sincronização automática iniciada...',
          updatedAt: new Date().toISOString(),
        },
      };

      const updateProgress = async (next: Partial<Record<string, unknown>>) => {
        const currentProgress = (syncMetadata.progress as Record<string, unknown>) || {};
        syncMetadata = {
          ...syncMetadata,
          progress: {
            ...currentProgress,
            ...next,
            updatedAt: new Date().toISOString(),
          },
        };
        await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
      };

      const updateMetadata = async (patch: Record<string, unknown>) => {
        syncMetadata = mergeRecords(syncMetadata, patch);
        await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
      };

      let overallCompleted = 0;
      let stageCompleted = 0;

      const progressTracker = {
        setStage: async (stage: string, stageTotal: number, message: string) => {
          stageCompleted = 0;
          await updateProgress({
            overallCompleted,
            stage,
            stageTotal,
            stageCompleted,
            message,
          });
        },
        completeUnit: async (currentSince: string | null, currentUntil: string | null, message?: string) => {
          overallCompleted += 1;
          stageCompleted += 1;
          if (overallCompleted % 3 === 0 || message) {
            await updateProgress({
              overallCompleted,
              stageCompleted,
              currentSince,
              currentUntil,
              ...(message ? { message } : {}),
            });
          }
        },
        setMetadata: async (patch: Record<string, unknown>) => {
          await updateMetadata(patch);
        },
      };

      try {
        const result = await runMetaSyncWork({
          prisma,
          metaService,
          body: { syncLevel: 'full' as const, dryRun: false, async: false, clientId },
          dateChunks,
          since,
          until,
          cacheService,
          log: noopLogger as any,
          progress: progressTracker,
        });

        let governanceSummary: Record<string, unknown> | null = null;
        let governanceError: string | null = null;

        await progressTracker.setStage('governance', 1, 'Validando nomenclatura e datas da Meta...');
        try {
          const governanceResult = await runMetaGovernanceStage({
            pool,
            metaService,
            clientId,
            accountId: adAccountId,
            syncId,
            dryRun: false,
          });
          governanceSummary = governanceResult.summary as unknown as Record<string, unknown>;
          await updateMetadata({ governance: { summary: governanceSummary } });
        } catch (error) {
          governanceError = error instanceof Error ? error.message : 'Falha desconhecida na governança Meta';
          await updateMetadata({ governance: { error: governanceError } });
          noopLogger.error(error);
        }
        await progressTracker.completeUnit(null, null, governanceError ? 'Governança Meta finalizada com falhas.' : 'Governança Meta concluída.');

        const duration = Date.now() - startTime;
        const governancePatch = governanceSummary
          ? { governance: { summary: governanceSummary } }
          : governanceError
            ? { governance: { error: governanceError } }
            : {};

        if (result.outcome === 'no_insights') {
          await syncHistoryService.completeSyncSuccess(syncId, {
            totalInsights: 0,
            mappedCampaigns: 0,
            updatedMetrics: 0,
            unmappedCampaigns: [],
            partial: false,
            durationMs: duration,
          });

          syncMetadata = mergeRecords(syncMetadata, {
            ...governancePatch,
            state: 'success',
            progress: {
              overallCompleted: totalUnits,
              stage: 'governance',
              stageTotal: 1,
              stageCompleted: 1,
              currentSince: null,
              currentUntil: null,
              message: 'Concluído (nenhum insight no período).',
              updatedAt: new Date().toISOString(),
            },
          });
          await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
        } else {
          const adCoverage = result.coverage;
          const adCoverageHasIssues = Boolean(adCoverage?.missingAdCampaigns?.length) || Boolean(adCoverage?.failedAdChunks?.length);
          const isPartial = result.unmapped.length > 0 || adCoverageHasIssues;

          await syncHistoryService.completeSyncSuccess(syncId, {
            totalInsights: result.totalInsights,
            mappedCampaigns: result.mappedTotal,
            updatedMetrics: result.outcome === 'dry_run' ? 0 : result.updated,
            unmappedCampaigns: result.unmapped,
            partial: isPartial,
            durationMs: duration,
          });

          syncMetadata = mergeRecords(syncMetadata, {
            ...governancePatch,
            state: isPartial ? 'partial' : 'success',
            ...(adCoverageHasIssues
              ? {
                  adCoverage: {
                    missingCampaigns: adCoverage?.missingAdCampaigns ?? [],
                    failedChunks: adCoverage?.failedAdChunks ?? [],
                  },
                }
              : {}),
            progress: {
              overallCompleted: totalUnits,
              stage: 'governance',
              stageTotal: 1,
              stageCompleted: 1,
              currentSince: null,
              currentUntil: null,
              message: isPartial ? 'Concluído com pendências.' : 'Concluído com sucesso.',
              updatedAt: new Date().toISOString(),
            },
          });
          await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
        }

        await notificationService
          .create({
            clientId,
            type: 'sync_completed',
            severity: 'info',
            title: 'Sincronização concluída',
            message: `Meta Ads sincronizado: ${result.totalInsights} insights importados.`,
            metadata: { syncId, outcome: result.outcome, totalInsights: result.totalInsights, duration },
            expiresInHours: 48,
          })
          .catch(() => {});

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

        syncMetadata = mergeRecords(syncMetadata, {
          state: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          progress: {
            overallCompleted,
            stageCompleted,
            message: 'Falha na sincronização Meta.',
            updatedAt: new Date().toISOString(),
          },
        });
        await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);

        await notificationService
          .create({
            clientId,
            type: 'sync_failed',
            severity: 'critical',
            title: 'Erro na sincronização',
            message: `Falha ao sincronizar Meta Ads: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            metadata: { syncId, duration },
            expiresInHours: 72,
          })
          .catch(() => {});

        throw error;
      }
    },
    {
      connection,
      concurrency: 2,
    },
  );
}
