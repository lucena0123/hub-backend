import type { FastifyBaseLogger } from 'fastify';
import type { Pool } from 'pg';
import type { CacheService } from '../../services/cache-service';
import type { MetaAdsService } from '../../services/meta-ads-service';
import type { MetaSyncInput } from '../../validators/meta-sync';
import { ensureMetaAdSetsImported } from './adset-map';
import { buildMetaCampaignMap, ensureMetaCampaignsImported } from './campaign-map';
import type { IsoDateRange } from './utils';
import type { MetaSyncProgress } from './types';
import { syncAdsetMetricsStage } from './stages/adset-metrics';
import { syncAdMetricsStage } from './stages/ad-metrics';
import { syncBreakdownsStage } from './stages/breakdowns';
import { syncCampaignMetricsStage } from './stages/campaign-metrics';

export type MetaSyncWorkResult =
  | {
      outcome: 'no_insights';
      totalInsights: 0;
      mappedTotal: 0;
      updated: 0;
      unmapped: string[];
    }
  | {
      outcome: 'dry_run';
      totalInsights: number;
      mappedTotal: number;
      updated: 0;
      unmapped: string[];
    }
  | {
      outcome: 'success';
      totalInsights: number;
      mappedTotal: number;
      updated: number;
      unmapped: string[];
    };

export const runMetaSyncWork = async (params: {
  pool: Pool;
  metaService: MetaAdsService;
  body: MetaSyncInput;
  dateChunks: IsoDateRange[];
  since: string;
  until: string;
  cacheService: CacheService | null;
  log: FastifyBaseLogger;
  progress: MetaSyncProgress;
}): Promise<MetaSyncWorkResult> => {
  const { pool, metaService, body, dateChunks, since, until, cacheService, log, progress } = params;

  if (body.clientId) {
    await ensureMetaCampaignsImported({
      pool,
      metaService,
      clientId: body.clientId,
      log,
    });
  }

  const campaignMap = await buildMetaCampaignMap(pool);

  if (body.clientId) {
    await ensureMetaAdSetsImported({
      pool,
      metaService,
      campaignMap,
      log,
    });
  }

  const ctx = {
    pool,
    metaService,
    body,
    dateChunks,
    since,
    until,
    campaignMap,
    progress,
    log,
  };

  const campaignResult = await syncCampaignMetricsStage(ctx);

  if (campaignResult.totalInsights === 0) {
    return {
      outcome: 'no_insights',
      totalInsights: 0,
      mappedTotal: 0,
      updated: 0,
      unmapped: [],
    };
  }

  const unmapped = Array.from(campaignResult.unmapped);

  if (body.dryRun) {
    return {
      outcome: 'dry_run',
      totalInsights: campaignResult.totalInsights,
      mappedTotal: campaignResult.mappedTotal,
      updated: 0,
      unmapped,
    };
  }

  if (body.syncLevel === 'adset' || body.syncLevel === 'full') {
    try {
      await syncAdsetMetricsStage(ctx);
    } catch (error) {
      log.error({ error }, 'Failed to sync ad set metrics (non-fatal)');
    }
  }

  if (body.syncLevel === 'ad' || body.syncLevel === 'full') {
    await syncAdMetricsStage(ctx);
  }

  if (body.syncLevel === 'full') {
    await syncBreakdownsStage(ctx);
  }

  if (cacheService) {
    await cacheService.invalidatePattern('dashboard:*');
    await cacheService.invalidatePattern('campaigns:*');
  }

  return {
    outcome: 'success',
    totalInsights: campaignResult.totalInsights,
    mappedTotal: campaignResult.mappedTotal,
    updated: campaignResult.updated,
    unmapped,
  };
};
