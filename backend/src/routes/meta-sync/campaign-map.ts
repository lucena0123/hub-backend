import type { FastifyBaseLogger } from 'fastify';
import { PrismaClient } from '@prisma/client';
import type { MetaAdsService } from '../../services/meta-ads-service';
import { inferOptimizationTheme } from '../../services/optimization-playbook';

export const ensureMetaCampaignsImported = async (params: {
  prisma: PrismaClient;
  metaService: MetaAdsService;
  clientId: string;
  log: FastifyBaseLogger;
}) => {
  const { prisma, metaService, clientId, log } = params;

  try {
    const campaigns = await metaService.fetchCampaigns();

    if (!campaigns || campaigns.length === 0) return;

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

    const resolveBudget = (camp: { daily_budget?: string; lifetime_budget?: string }) =>
      parseMetaBudget(camp.daily_budget ?? camp.lifetime_budget);

    const normalizeStatus = (status: string | null | undefined) => {
      const value = typeof status === 'string' ? status.trim().toLowerCase() : '';
      if (!value) return 'archived';
      if (value === 'active') return 'active';
      if (value === 'paused') return 'paused';
      if (value === 'archived') return 'archived';
      return value;
    };

    let count = 0;
    const existingCampaigns = await prisma.campaign.findMany({
      where: { externalId: { in: campaigns.map((camp) => camp.id) } },
      select: { externalId: true, clientId: true, platform: true },
    });
    const existingByExternalId = new Map(
      existingCampaigns.map((row) => [row.externalId, row])
    );

    await Promise.all(
      campaigns.map(async (camp) => {
        const externalId = camp.id;
        const name = camp.name;
        const status = normalizeStatus(camp.status);
        const budget = resolveBudget(camp);
        const objective = typeof camp.objective === 'string' && camp.objective.trim() ? camp.objective.trim() : null;
        const createdTime = parseMetaTimestamp(camp.created_time);
        const inferredTheme = inferOptimizationTheme(name);
        const existing = existingByExternalId.get(externalId);
        if (existing && (existing.clientId !== clientId || existing.platform !== 'meta')) {
          log.warn(
            {
              externalId,
              campaignName: name,
              fromClientId: existing.clientId,
              toClientId: clientId,
              fromPlatform: existing.platform,
              toPlatform: 'meta',
            },
            'Reassigning Meta campaign ownership/platform during sync'
          );
        }

        await prisma.campaign.upsert({
          where: { externalId },
          update: {
            name,
            status,
            platform: 'meta',
            clientId,
            // Preserve existing budget/objective when Meta payload omits meaningful values.
            budget: budget > 0 ? budget : undefined,
            objective: objective ?? undefined,
            createdAt: createdTime ?? undefined,
          },
          create: {
            externalId,
            platform: 'meta',
            name,
            status,
            clientId,
            budget,
            objective,
            createdAt: createdTime ?? undefined,
            optimizationThemeKey: inferredTheme.themeKey,
            optimizationSubthemeKey: null,
          }
        });
        count++;
      })
    );

    log.info({ count }, 'Auto-imported campaigns from Meta');
  } catch (error) {
    log.error({ error }, 'Failed to auto-import campaigns (non-fatal)');
  }
};

export const buildMetaCampaignMap = async (prisma: PrismaClient) => {
  const campaigns = await prisma.campaign.findMany({
    where: { platform: 'meta' },
    select: { id: true, externalId: true }
  });
  return new Map<string, string>(campaigns.map((c) => [c.externalId, c.id]));
};
