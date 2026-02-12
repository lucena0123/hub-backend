import { PrismaClient, Prisma } from '@prisma/client';

import type { DailyMetric, MetricsQuery } from '../../types/metrics';
import { getDateRange } from './date-range';
import { resolvePrimaryResult } from './primary-result';

export const getCampaignMetrics = async (
  prisma: PrismaClient,
  campaignId: string,
  query: MetricsQuery = {}
): Promise<DailyMetric[]> => {
  const { period = '30d', startDate, endDate, platform } = query;

  const dates = getDateRange(period, startDate, endDate);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { objective: true },
  });

  let objectiveMeta: { optimizationGoal?: string | null; destinationType?: string | null; billingEvent?: string | null } | null =
    null;
  try {
    const metaRows = await prisma.$queryRaw<any[]>`
      SELECT metadata
      FROM adsets
      WHERE campaign_id = ${campaignId} AND platform = 'meta'
      LIMIT 1`;

    const metadata = metaRows[0]?.metadata as Record<string, unknown> | null;
    if (metadata && typeof metadata === 'object') {
      objectiveMeta = {
        optimizationGoal: typeof metadata.optimizationGoal === 'string' ? metadata.optimizationGoal : null,
        destinationType: typeof metadata.destinationType === 'string' ? metadata.destinationType : null,
        billingEvent: typeof metadata.billingEvent === 'string' ? metadata.billingEvent : null,
      };
    }
  } catch (_error) {
    objectiveMeta = null;
  }

  const where: Prisma.CampaignMetricWhereInput = {
    campaignId,
    date: {
      gte: new Date(dates.start),
      lte: new Date(dates.end),
    },
  };

  if (platform) {
    where.platform = platform;
  }

  const metrics = await prisma.campaignMetric.groupBy({
    by: ['date'],
    where,
    _sum: {
      impressions: true,
      clicks: true,
      conversions: true,
      leads: true,
      messagingConversations: true,
      messagingFirstReply: true,
      linkClicks: true,
      landingPageViews: true,
      spend: true,
      revenue: true,
    },
    _avg: {
      ctr: true,
      cpc: true,
      cpl: true,
      roas: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  return metrics.map((m) => {
    const primary = resolvePrimaryResult({
      objective: campaign?.objective ?? null,
      objectiveMeta,
      metrics: {
        messagingConversations: m._sum.messagingConversations || 0,
        leads: m._sum.leads || 0,
        linkClicks: m._sum.linkClicks || 0,
        landingPageViews: m._sum.landingPageViews || 0,
        conversions: m._sum.conversions || 0,
        clicks: m._sum.clicks || 0,
      },
    });

    const spend = Number(m._sum.spend ?? 0);
    const conversions = primary.value;

    return {
      date: m.date.toISOString().split('T')[0],
      impressions: m._sum.impressions || 0,
      clicks: m._sum.clicks || 0,
      conversions,
      messagingConversations: m._sum.messagingConversations || 0,
      messagingFirstReply: m._sum.messagingFirstReply || 0,
      linkClicks: m._sum.linkClicks || 0,
      landingPageViews: m._sum.landingPageViews || 0,
      spend,
      revenue: Number(m._sum.revenue ?? 0),
      ctr: Number(m._avg.ctr ?? 0),
      cpc: Number(m._avg.cpc ?? 0),
      cpl: conversions > 0 ? spend / conversions : 0,
      roas: Number(m._avg.roas ?? 0),
    };
  });
};
