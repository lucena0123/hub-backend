import { PrismaClient, Prisma } from '@prisma/client';

import type { DailyMetric, MetricsQuery } from '../../types/metrics';
import { getDateRange } from './date-range';

export const getCampaignMetrics = async (
  prisma: PrismaClient,
  campaignId: string,
  query: MetricsQuery = {}
): Promise<DailyMetric[]> => {
  const { period = '30d', startDate, endDate, platform } = query;

  const dates = getDateRange(period, startDate, endDate);

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

  return metrics.map((m) => ({
    date: m.date.toISOString().split('T')[0],
    impressions: m._sum.impressions || 0,
    clicks: m._sum.clicks || 0,
    conversions: m._sum.conversions || 0,
    messagingConversations: m._sum.messagingConversations || 0,
    messagingFirstReply: m._sum.messagingFirstReply || 0,
    linkClicks: m._sum.linkClicks || 0,
    landingPageViews: m._sum.landingPageViews || 0,
    spend: Number(m._sum.spend ?? 0),
    revenue: Number(m._sum.revenue ?? 0),
    ctr: Number(m._avg.ctr ?? 0),
    cpc: Number(m._avg.cpc ?? 0),
    cpl: Number(m._avg.cpl ?? 0),
    roas: Number(m._avg.roas ?? 0),
  }));
};
