import type { FastifyBaseLogger } from 'fastify';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import type { MetaAdsService } from '../../services/meta-ads-service';
import { toJsonb } from './utils';

export const ensureMetaAdSetsImported = async (params: {
  prisma: PrismaClient;
  metaService: MetaAdsService;
  campaignMap: Map<string, string>;
  log: FastifyBaseLogger;
}) => {
  const { prisma, metaService, campaignMap, log } = params;

  try {
    const adsets = await metaService.fetchAdSets({ includeLearningInfo: true });

    if (!adsets || adsets.length === 0) return;

    const snapshotDate = new Date();

    const parseMetaBudget = (value: string | null | undefined) => {
      if (!value) return 0;
      const cents = Number.parseFloat(value);
      if (!Number.isFinite(cents) || cents <= 0) return 0;
      return Math.round(cents) / 100;
    };

    const parseMetaTimestamp = (value: unknown) => {
      if (!value || typeof value !== 'string') return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const normalizeStatus = (status: string | null | undefined) => {
      const value = typeof status === 'string' ? status.trim().toLowerCase() : '';
      if (!value) return 'archived';
      if (value === 'active') return 'active';
      if (value === 'paused') return 'paused';
      if (value === 'archived') return 'archived';
      return value;
    };

    let mappedCount = 0;

    await Promise.all(
      adsets.map(async (adset) => {
        const metaCampaignId = String(adset.campaign_id || '');
        const campaignId = metaCampaignId ? campaignMap.get(metaCampaignId) : undefined;
        if (!campaignId) return;

        const adsetId = adset.id;
        const name = adset.name || `AdSet ${adsetId}`;
        const status = normalizeStatus(adset.status);
        const effectiveStatus = adset.effective_status
          ? String(adset.effective_status).trim().toLowerCase()
          : null;
        const dailyBudget = parseMetaBudget(adset.daily_budget);
        const lifetimeBudget = parseMetaBudget(adset.lifetime_budget);
        const learningStageInfo =
          adset.learning_stage_info && typeof adset.learning_stage_info === 'object'
            ? adset.learning_stage_info
            : null;
        const learningStatus =
          typeof (learningStageInfo as any)?.status === 'string'
            ? String((learningStageInfo as any).status)
            : typeof (learningStageInfo as any)?.learning_status === 'string'
              ? String((learningStageInfo as any).learning_status)
              : null;
        const lastSignificantEdit =
          parseMetaTimestamp(adset.last_significant_edit) ??
          parseMetaTimestamp((learningStageInfo as any)?.last_significant_edit) ??
          parseMetaTimestamp((learningStageInfo as any)?.last_significant_edit_time);
        const learningStatusUpdatedAt =
          parseMetaTimestamp((learningStageInfo as any)?.last_status_change) ??
          parseMetaTimestamp((learningStageInfo as any)?.last_updated_time);
        const createdTime = parseMetaTimestamp(adset.created_time);

        const metadata = {
          billingEvent: adset.billing_event ?? null,
          optimizationGoal: adset.optimization_goal ?? null,
          bidStrategy: adset.bid_strategy ?? null,
          bidAmount: adset.bid_amount ?? null,
          bidCap: adset.bid_cap ?? null,
          costCap: adset.cost_cap ?? null,
          destinationType: adset.destination_type ?? null,
          promotedObject: adset.promoted_object ?? null,
          attributionSpec: adset.attribution_spec ?? null,
          targeting: adset.targeting ?? null,
          startTime: adset.start_time ?? null,
          endTime: adset.end_time ?? null,
          configuredStatus: adset.configured_status ?? null,
        };

        const platform = 'meta';
        const recordId = `${platform}:${adsetId}`;

        await prisma.$executeRaw`
          INSERT INTO adsets (
            id,
            campaign_id,
            adset_id,
            adset_name,
            status,
            effective_status,
            daily_budget,
            lifetime_budget,
            learning_status,
            learning_stage_info,
            learning_status_updated_at,
            last_significant_edit,
            platform,
            metadata,
            created_time,
            created_at,
            updated_at
          ) VALUES (
            ${recordId},
            ${campaignId},
            ${adsetId},
            ${name},
            ${status},
            ${effectiveStatus},
            ${dailyBudget},
            ${lifetimeBudget},
            ${learningStatus},
            ${toJsonb(learningStageInfo)}::jsonb,
            ${learningStatusUpdatedAt},
            ${lastSignificantEdit},
            ${platform},
            ${toJsonb(metadata)}::jsonb,
            ${createdTime},
            NOW(),
            NOW()
          )
          ON CONFLICT (adset_id, platform) DO UPDATE SET
            campaign_id = EXCLUDED.campaign_id,
            adset_name = EXCLUDED.adset_name,
            status = EXCLUDED.status,
            effective_status = EXCLUDED.effective_status,
            daily_budget = CASE
              WHEN EXCLUDED.daily_budget > 0 THEN EXCLUDED.daily_budget
              ELSE adsets.daily_budget
            END,
            lifetime_budget = CASE
              WHEN EXCLUDED.lifetime_budget > 0 THEN EXCLUDED.lifetime_budget
              ELSE adsets.lifetime_budget
            END,
            learning_status = EXCLUDED.learning_status,
            learning_stage_info = EXCLUDED.learning_stage_info,
            learning_status_updated_at = EXCLUDED.learning_status_updated_at,
            last_significant_edit = EXCLUDED.last_significant_edit,
            metadata = CASE
              WHEN EXCLUDED.metadata IS NOT NULL THEN EXCLUDED.metadata
              ELSE adsets.metadata
            END,
            created_time = COALESCE(EXCLUDED.created_time, adsets.created_time),
            updated_at = NOW()
        `;

        await prisma.$executeRaw`
          INSERT INTO adset_budget_history (
            id,
            campaign_id,
            adset_id,
            date,
            daily_budget,
            lifetime_budget,
            status,
            effective_status,
            configured_status,
            learning_status,
            last_significant_edit,
            learning_stage_info,
            metadata,
            platform,
            created_at
          ) VALUES (
            ${randomUUID()},
            ${campaignId},
            ${adsetId},
            ${snapshotDate},
            ${dailyBudget},
            ${lifetimeBudget},
            ${status},
            ${effectiveStatus},
            ${adset.configured_status ?? null},
            ${learningStatus},
            ${lastSignificantEdit},
            ${toJsonb(learningStageInfo)}::jsonb,
            ${toJsonb(metadata)}::jsonb,
            ${platform},
            NOW()
          )
          ON CONFLICT (adset_id, date, platform) DO UPDATE SET
            daily_budget = EXCLUDED.daily_budget,
            lifetime_budget = EXCLUDED.lifetime_budget,
            status = EXCLUDED.status,
            effective_status = EXCLUDED.effective_status,
            configured_status = EXCLUDED.configured_status,
            learning_status = EXCLUDED.learning_status,
            last_significant_edit = EXCLUDED.last_significant_edit,
            learning_stage_info = EXCLUDED.learning_stage_info,
            metadata = EXCLUDED.metadata
        `;
        mappedCount++;
      })
    );

    log.info({ count: mappedCount }, 'Auto-imported adsets from Meta');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('adsets') && message.toLowerCase().includes('does not exist')) {
      log.warn({ error: message }, 'Skipping adsets import (missing table)');
      return;
    }
    log.error({ error }, 'Failed to auto-import adsets (non-fatal)');
  }
};
