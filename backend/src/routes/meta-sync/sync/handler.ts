import { validateMetaSync } from '../../../validators/meta-sync';
import { MetaAdsService } from '../../../services/meta-ads-service';
import { runningMetaSyncJobsByAccount } from '../running-jobs';
import { getMetaSyncChunkDays, splitDateRange } from '../utils';
import { runMetaSyncWork } from '../sync-work';

export const createSyncMetaAdsHandler = (fastify: any) => {
  const { pool } = fastify;
  const { syncHistory: syncHistoryService, cache: cacheService } = fastify.services;

  return async (request: any, reply: any) => {
    const startTime = Date.now();
    let syncId: string | null = null;
    let syncMetadata: Record<string, unknown> | null = null;

    try {
      const validation = validateMetaSync(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const body = validation.data!;

      const accessToken = process.env.META_ACCESS_TOKEN;

      const fromBody =
        typeof body.accountId === 'string' && body.accountId.trim() ? body.accountId.trim().replace(/^act_/i, '') : null;

      let fromClient: string | null = null;
      if (body.clientId) {
        const clientResult = await pool.query('SELECT \"metaAdAccountId\" FROM clients WHERE id = $1', [body.clientId]);
        const stored = clientResult.rows?.[0]?.metaAdAccountId;
        if (typeof stored === 'string' && stored.trim()) {
          fromClient = stored.trim().replace(/^act_/i, '');
        }
      }

      if (fromBody && fromClient && fromBody !== fromClient) {
        reply.status(400);
        return {
          error: 'Meta Ad Account mismatch',
          message:
            'O Meta Ad Account ID informado não corresponde ao Meta Ad Account ID cadastrado para este cliente. Corrija o cadastro do cliente ou remova o accountId do body.',
        };
      }

      const adAccountId = fromBody || fromClient || process.env.META_AD_ACCOUNT_ID || null;

      if (!accessToken || !adAccountId) {
        reply.status(400);
        return {
          error: 'Missing Meta Ads credentials',
          message:
            'Defina META_ACCESS_TOKEN e META_AD_ACCOUNT_ID no .env (backend) ou configure o Meta Ad Account ID no cadastro do cliente.',
        };
      }

      const resolveDateRange = (since?: string, until?: string) => {
        if (since && until) {
          return { since, until };
        }
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return {
          since: start.toISOString().split('T')[0],
          until: end.toISOString().split('T')[0],
        };
      };

      const { since, until } = resolveDateRange(body.since, body.until);
      const chunkDays = getMetaSyncChunkDays();
      const dateChunks = splitDateRange(since, until, chunkDays);

      const shouldRunAsync = body.async || body.syncLevel === 'full' || (body.since && body.until && dateChunks.length > 1);

      if (shouldRunAsync) {
        const existing = runningMetaSyncJobsByAccount.get(adAccountId);
        if (existing) {
          reply.status(202);
          return {
            success: true,
            async: true,
            alreadyRunning: true,
            syncId: existing.syncId,
            message: 'Já existe uma sincronização em andamento para esta conta.',
            totalInsights: 0,
            mapped: 0,
          };
        }
      }

      const breakdownUnits = body.syncLevel === 'full' ? dateChunks.length * 3 : 0;
      const adUnits = body.syncLevel === 'ad' || body.syncLevel === 'full' ? dateChunks.length + 1 : 0; // +1 = creative metadata linking
      const totalUnits =
        dateChunks.length + // campaign metrics always
        (body.syncLevel === 'adset' || body.syncLevel === 'full' ? dateChunks.length : 0) +
        adUnits +
        breakdownUnits;

      syncId = await syncHistoryService.createSyncRecord({
        platform: 'meta',
        accountId: adAccountId,
        dateRangeStart: since,
        dateRangeEnd: until,
        dryRun: body.dryRun,
        triggeredBy: 'manual',
        metadata: {
          state: 'running',
          syncLevel: body.syncLevel,
          chunkDays,
          chunksTotal: dateChunks.length,
          progress: {
            overallTotal: totalUnits,
            overallCompleted: 0,
            stage: 'campaign',
            stageTotal: dateChunks.length,
            stageCompleted: 0,
            currentSince: null,
            currentUntil: null,
            message: 'Preparando sincronização...',
            updatedAt: new Date().toISOString(),
          },
        },
      });

      syncMetadata = {
        state: 'running',
        syncLevel: body.syncLevel,
        chunkDays,
        chunksTotal: dateChunks.length,
        progress: {
          overallTotal: totalUnits,
          overallCompleted: 0,
          stage: 'campaign',
          stageTotal: dateChunks.length,
          stageCompleted: 0,
          currentSince: null,
          currentUntil: null,
          message: 'Preparando sincronização...',
          updatedAt: new Date().toISOString(),
        },
      };

      const updateProgress = async (next: Partial<Record<string, unknown>>) => {
        if (!syncId || !syncMetadata) return;
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

      fastify.log.info({ since, until, accountId: adAccountId, dryRun: body.dryRun, syncId }, 'Starting Meta Ads sync');
      fastify.log.info({ chunks: dateChunks.length, chunkDays }, 'Meta sync will run in chunks');

      const metaService = new MetaAdsService({
        accessToken,
        adAccountId,
        apiVersion: process.env.META_API_VERSION,
      });

      let overallCompleted = 0;
      let stageCompleted = 0;

      const progressTracker = {
        setStage: async (stage: string, stageTotal: number, message: string) => {
          stageCompleted = 0;
          await updateProgress({
            stage,
            stageTotal,
            stageCompleted,
            message,
          });
        },
        completeUnit: async (currentSince: string | null, currentUntil: string | null, message?: string) => {
          overallCompleted += 1;
          stageCompleted += 1;
          await updateProgress({
            overallCompleted,
            stageCompleted,
            currentSince,
            currentUntil,
            ...(message ? { message } : {}),
          });
        },
      };

      const runWork = async () => {
        const result = await runMetaSyncWork({
          pool,
          metaService,
          body,
          dateChunks,
          since,
          until,
          cacheService,
          log: fastify.log,
          progress: progressTracker,
        });

        const duration = Date.now() - startTime;

        if (result.outcome === 'no_insights') {
          if (syncId) {
            await syncHistoryService.completeSyncSuccess(syncId, {
              totalInsights: 0,
              mappedCampaigns: 0,
              updatedMetrics: 0,
              unmappedCampaigns: [],
              durationMs: duration,
            });
          }

          if (syncId && syncMetadata) {
            const progress = (syncMetadata.progress as Record<string, unknown>) || {};
            syncMetadata = {
              ...syncMetadata,
              state: 'success',
              progress: {
                ...progress,
                overallCompleted: totalUnits,
                stageCompleted: (progress.stageTotal as any) ?? (progress.stageCompleted as any) ?? 0,
                currentSince: null,
                currentUntil: null,
                message: 'Concluído (nenhum insight no período).',
                updatedAt: new Date().toISOString(),
              },
            };
            await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
          }

          fastify.log.info({ syncId, duration }, 'Meta sync completed - no insights found');
          return {
            success: true,
            message: 'No insights returned for the selected period',
            totalInsights: 0,
            mapped: 0,
            unmapped: 0,
            since,
            until,
            duration,
          };
        }

        if (result.outcome === 'dry_run') {
          if (syncId) {
            await syncHistoryService.completeSyncSuccess(syncId, {
              totalInsights: result.totalInsights,
              mappedCampaigns: result.mappedTotal,
              updatedMetrics: 0,
              unmappedCampaigns: result.unmapped,
              durationMs: duration,
            });
          }

          if (syncId && syncMetadata) {
            const progress = (syncMetadata.progress as Record<string, unknown>) || {};
            syncMetadata = {
              ...syncMetadata,
              state: result.unmapped.length > 0 ? 'partial' : 'success',
              progress: {
                ...progress,
                overallCompleted: totalUnits,
                stageCompleted: (progress.stageTotal as any) ?? (progress.stageCompleted as any) ?? 0,
                currentSince: null,
                currentUntil: null,
                message: 'Concluído (dry-run).',
                updatedAt: new Date().toISOString(),
              },
            };
            await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
          }

          fastify.log.info(
            { syncId, totalInsights: result.totalInsights, mapped: result.mappedTotal, unmapped: result.unmapped.length, duration },
            'Meta sync dry-run completed'
          );

          return {
            success: true,
            dryRun: true,
            syncId,
            totalInsights: result.totalInsights,
            mapped: result.mappedTotal,
            unmapped: result.unmapped,
            since,
            until,
            duration,
          };
        }

        if (syncId) {
          await syncHistoryService.completeSyncSuccess(syncId, {
            totalInsights: result.totalInsights,
            mappedCampaigns: result.mappedTotal,
            updatedMetrics: result.updated,
            unmappedCampaigns: result.unmapped,
            durationMs: duration,
          });
        }

        fastify.log.info(
          {
            syncId,
            totalInsights: result.totalInsights,
            mapped: result.mappedTotal,
            updated: result.updated,
            unmapped: result.unmapped.length,
            duration,
          },
          'Meta sync completed successfully'
        );

        if (syncId && syncMetadata) {
          syncMetadata = {
            ...syncMetadata,
            state: result.unmapped.length > 0 ? 'partial' : 'success',
          };
          await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
        }

        return {
          success: true,
          syncId,
          totalInsights: result.totalInsights,
          mapped: result.mappedTotal,
          updated: result.updated,
          unmapped: result.unmapped,
          since,
          until,
          duration,
        };
      };

      if (shouldRunAsync) {
        const accountKey = adAccountId;
        const startedAt = Date.now();

        const jobPromise: Promise<void> = (async () => {
          try {
            await runWork();
          } catch (error) {
            const duration = Date.now() - startTime;

            if (syncId && error instanceof Error) {
              await syncHistoryService.completeSyncFailure(syncId, error, duration);
            }

            if (syncId && syncMetadata) {
              syncMetadata = {
                ...syncMetadata,
                state: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
              };
              await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
            }

            fastify.log.error(
              {
                syncId,
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                duration,
              },
              'Meta sync failed (async)'
            );
          } finally {
            const running = runningMetaSyncJobsByAccount.get(accountKey);
            if (running && running.startedAt === startedAt) {
              runningMetaSyncJobsByAccount.delete(accountKey);
            }
          }
        })();

        const runningSyncId = syncId;
        if (!runningSyncId) {
          throw new Error('Missing syncId after creating the sync record.');
        }

        runningMetaSyncJobsByAccount.set(accountKey, {
          syncId: runningSyncId,
          accountId: accountKey,
          startedAt,
          promise: jobPromise,
        });

        reply.status(202);
        return {
          success: true,
          async: true,
          syncId: runningSyncId,
          message: 'Sincronização iniciada. Acompanhe o progresso no histórico de sync.',
          totalInsights: 0,
          mapped: 0,
        };
      }

      return await runWork();
    } catch (error) {
      const duration = Date.now() - startTime;

      if (syncId && error instanceof Error) {
        await syncHistoryService.completeSyncFailure(syncId, error, duration);
      }

      if (syncId && syncMetadata) {
        syncMetadata = {
          ...syncMetadata,
          state: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
      }

      fastify.log.error(
        {
          syncId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          duration,
        },
        'Meta sync failed'
      );

      reply.status(500);
      return {
        error: 'Failed to sync Meta Ads metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  };
};
