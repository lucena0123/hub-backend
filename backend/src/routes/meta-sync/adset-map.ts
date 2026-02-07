import type { FastifyBaseLogger } from 'fastify';
import { PrismaClient } from '@prisma/client';
import type { MetaAdsService } from '../../services/meta-ads-service';

export const ensureMetaAdSetsImported = async (params: {
  prisma: PrismaClient;
  metaService: MetaAdsService;
  campaignMap: Map<string, string>;
  log: FastifyBaseLogger;
}) => {
  const { prisma, metaService, campaignMap, log } = params;

  try {
    const adsets = await metaService.fetchAdSets();

    if (!adsets || adsets.length === 0) return;

    const parseMetaBudget = (value: string | null | undefined) => {
      if (!value) return 0;
      const cents = Number.parseFloat(value);
      if (!Number.isFinite(cents) || cents <= 0) return 0;
      return Math.round(cents) / 100;
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

        await prisma.adSet.upsert({
          where: { adsetId }, // Using unique adsetId
          update: {
            campaignId,
            name,
            status,
            effectiveStatus,
            dailyBudget: dailyBudget > 0 ? dailyBudget : undefined,
            lifetimeBudget: lifetimeBudget > 0 ? lifetimeBudget : undefined,
            updatedAt: new Date(),
          },
          create: {
            adsetId,
            campaignId,
            platform: 'meta',
            name,
            status,
            effectiveStatus,
            dailyBudget,
            lifetimeBudget,
          },
        });
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
