import type { FastifyBaseLogger } from 'fastify';
import { PrismaClient } from '@prisma/client';
import type { CacheService } from '../../services/cache-service';
import type { MetaAdsService } from '../../services/meta-ads-service';
import type { MetaSyncInput } from '../../validators/meta-sync';
import { ensureMetaAdSetsImported } from './adset-map';
import { buildMetaCampaignMap, ensureMetaCampaignsImported } from './campaign-map';
import type { IsoDateRange } from './utils';
import type { MetaSyncProgress } from './types';
import { syncAdsetMetricsStage } from './stages/adset-metrics';
import { syncAdMetricsStage, type AdMetricsStageResult } from './stages/ad-metrics';
import { syncBreakdownsStage } from './stages/breakdowns';
import { syncCampaignMetricsStage } from './stages/campaign-metrics';

type MetaSyncCoverage = {
  missingAdCampaigns?: string[];
  failedAdChunks?: { since: string; until: string; error: string }[];
};

export type MetaSyncWorkResult =
  | {
    outcome: 'no_insights';
    totalInsights: 0;
    mappedTotal: 0;
    updated: 0;
    unmapped: string[];
    coverage?: MetaSyncCoverage;
  }
  | {
    outcome: 'dry_run';
    totalInsights: number;
    mappedTotal: number;
    updated: 0;
    unmapped: string[];
    coverage?: MetaSyncCoverage;
  }
  | {
    outcome: 'success';
    totalInsights: number;
    mappedTotal: number;
    updated: number;
    unmapped: string[];
    coverage?: MetaSyncCoverage;
  };

export const runMetaSyncWork = async (params: {
  prisma: PrismaClient;
  metaService: MetaAdsService;
  body: MetaSyncInput;
  dateChunks: IsoDateRange[];
  since: string;
  until: string;
  cacheService: CacheService | null;
  log: FastifyBaseLogger;
  progress: MetaSyncProgress;
}): Promise<MetaSyncWorkResult> => {
  const { prisma, metaService, body, dateChunks, since, until, cacheService, log, progress } = params;

  if (body.clientId) {
    await ensureMetaCampaignsImported({
      prisma,
      metaService,
      clientId: body.clientId,
      log,
    });
  }

  const campaignMap = await buildMetaCampaignMap(prisma);

  if (body.clientId) {
    await ensureMetaAdSetsImported({
      prisma,
      metaService,
      campaignMap,
      log,
    });
  }

  const ctx = {
    prisma,
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
      coverage: {},
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
      coverage: {},
    };
  }

  if (body.syncLevel === 'adset' || body.syncLevel === 'full') {
    try {
      await syncAdsetMetricsStage(ctx);
    } catch (error) {
      log.error({ error }, 'Failed to sync ad set metrics (non-fatal)');
    }
  }

  let adResult: AdMetricsStageResult | null = null;
  if (body.syncLevel === 'ad' || body.syncLevel === 'full') {
    adResult = await syncAdMetricsStage(ctx);
  }

  if (body.syncLevel === 'full') {
    await syncBreakdownsStage(ctx);
  }

  if (cacheService) {
    await cacheService.invalidatePattern('dashboard:*');
    await cacheService.invalidatePattern('campaigns:*');
  }

  const missingAdCampaigns =
    adResult && campaignResult.deliveredCampaignIds.size > 0
      ? Array.from(campaignResult.deliveredCampaignIds).filter((id) => !adResult!.campaignsWithAds.has(id))
      : [];

  const coverage: MetaSyncCoverage | undefined =
    adResult && (missingAdCampaigns.length > 0 || adResult.failedChunks.length > 0)
      ? {
          missingAdCampaigns,
          failedAdChunks: adResult.failedChunks,
        }
      : undefined;

  return {
    outcome: 'success',
    totalInsights: campaignResult.totalInsights,
    mappedTotal: campaignResult.mappedTotal,
    updated: campaignResult.updated,
    unmapped,
    coverage,
  };
};
