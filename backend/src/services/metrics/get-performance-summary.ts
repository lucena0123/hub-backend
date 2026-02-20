import { PrismaClient } from '@prisma/client';

import type { MetricsQuery, PerformanceSummary } from '../../types/metrics';
import { calculateCPA, calculateCPM, calculateCPC, calculateCPL, calculateCTR, calculateROAS } from './calculations';
import { getDateRange } from './date-range';
import { getCampaignMetrics } from './get-campaign-metrics';
import { buildLearningSummary } from './learning-summary';
import { resolvePrimaryResult } from './primary-result';
import { determinePerformanceStatus } from './performance-status';

export const getPerformanceSummary = async (
  prisma: PrismaClient,
  campaignId: string,
  query: MetricsQuery = {}
): Promise<PerformanceSummary> => {
  const { period = '30d', startDate, endDate } = query;
  const dates = getDateRange(period, startDate, endDate);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      name: true,
      platform: true,
      objective: true,
      budget: true,
      optimizationThemeKey: true,
      optimizationSubthemeKey: true,
    },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const metricsAgg = await prisma.campaignMetric.aggregate({
    where: {
      campaignId,
      date: {
        gte: new Date(dates.start),
        lte: new Date(dates.end),
      },
    },
    _sum: {
      impressions: true,
      clicks: true,
      conversions: true,
      spend: true,
      revenue: true,
      leads: true,
      messagingConversations: true,
      messagingFirstReply: true,
      linkClicks: true,
      landingPageViews: true,
      reach: true,
    },
    _avg: {
      frequency: true,
    },
  });

  const rankings = await prisma.campaignMetric.findFirst({
    where: {
      campaignId,
      date: {
        gte: new Date(dates.start),
        lte: new Date(dates.end),
      },
      qualityRanking: { not: null },
    },
    orderBy: {
      date: 'desc',
    },
    select: {
      qualityRanking: true,
      engagementRateRanking: true,
      conversionRateRanking: true,
    },
  });

  let adsetDailyBudget = 0;
  let adsetLifetimeBudget = 0;
  let objectiveMeta: { optimizationGoal?: string | null; destinationType?: string | null; billingEvent?: string | null } | null =
    null;

  try {
    const adsetBudgetsResult = await prisma.$queryRaw<any[]>`
      SELECT
        COALESCE(SUM(daily_budget), 0) as daily_budget,
        COALESCE(SUM(lifetime_budget), 0) as lifetime_budget
       FROM adsets
       WHERE campaign_id = ${campaignId}`;

    if (adsetBudgetsResult.length > 0) {
      adsetDailyBudget = Number(adsetBudgetsResult[0].daily_budget) || 0;
      adsetLifetimeBudget = Number(adsetBudgetsResult[0].lifetime_budget) || 0;
    }
  } catch (_error) {
    // Non-fatal
  }

  try {
    const adsetMetaRows = await prisma.$queryRaw<any[]>`
      SELECT metadata
      FROM adsets
      WHERE campaign_id = ${campaignId} AND platform = 'meta'
      LIMIT 1`;
    const metadata = adsetMetaRows[0]?.metadata as Record<string, unknown> | null;
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

  const sums = metricsAgg._sum;
  const avgs = metricsAgg._avg;

  const totalImpressions = sums.impressions || 0;
  const totalClicks = sums.clicks || 0;
  const primaryResult = resolvePrimaryResult({
    objective: campaign.objective ?? null,
    objectiveMeta,
    metrics: {
      messagingConversations: sums.messagingConversations || 0,
      leads: sums.leads || 0,
      linkClicks: sums.linkClicks || 0,
      landingPageViews: sums.landingPageViews || 0,
      conversions: sums.conversions || 0,
      clicks: sums.clicks || 0,
    },
  });
  const totalConversions = primaryResult.value;
  const totalSpend = Number(sums.spend ?? 0);
  const totalRevenue = Number(sums.revenue ?? 0);
  const totalLeads = sums.leads || 0;
  const totalMessagingConversations = sums.messagingConversations || 0;
  const totalMessagingFirstReply = sums.messagingFirstReply || 0;
  const totalLinkClicks = sums.linkClicks || 0;
  const totalLandingPageViews = sums.landingPageViews || 0;
  const totalReach = sums.reach || 0;
  const avgFrequency = Number(avgs.frequency ?? 0);

  const avgCpm = calculateCPM(totalSpend, totalImpressions);

  const avgCtr = calculateCTR(totalClicks, totalImpressions);
  const avgCpc = calculateCPC(totalSpend, totalClicks);
  const totalContacts = totalConversions;
  const avgCpl = calculateCPL(totalSpend, totalContacts);
  const avgCpa = calculateCPA(totalSpend, totalContacts);
  const roas = calculateROAS(totalRevenue, totalSpend);

  const budget = Number(campaign.budget) || 0;
  const budgetUsed = totalSpend;
  const budgetRemaining = budget > 0 ? budget - budgetUsed : 0;
  const budgetUtilization = budget > 0 ? (budgetUsed / budget) * 100 : 0;

  const hasCampaignBudget = budget > 0;
  const hasAdsetBudget = adsetDailyBudget > 0 || adsetLifetimeBudget > 0;

  let budgetMode: 'abo' | 'cbo' | 'mixed' | 'unknown' = 'unknown';

  if (hasCampaignBudget && hasAdsetBudget) {
    budgetMode = 'mixed';
  } else if (hasCampaignBudget) {
    budgetMode = 'cbo';
  } else if (hasAdsetBudget) {
    budgetMode = 'abo';
  }

  const dailyMetrics = await getCampaignMetrics(prisma, campaignId, query);
  const learningSummary = await buildLearningSummary(prisma, campaignId, campaign.objective ?? null);

  const status = determinePerformanceStatus({
    roas,
    cpl: avgCpl,
    ctr: avgCtr,
    budgetUtilization,
  });

  return {
    campaignId,
    campaignName: campaign.name,
    platform: campaign.platform,
    objective: campaign.objective ?? null,
    objectiveMeta,
    optimizationThemeKey: campaign.optimizationThemeKey ?? null,
    optimizationSubthemeKey: campaign.optimizationSubthemeKey ?? null,
    period: {
      start: dates.start,
      end: dates.end,
    },
    totalImpressions,
    totalClicks,
    totalConversions,
    totalSpend,
    totalRevenue,
    totalLeads,
    totalMessagingConversations,
    totalMessagingFirstReply,
    totalLinkClicks,
    totalLandingPageViews,
    totalReach,
    avgFrequency: Number(avgFrequency.toFixed(2)),
    avgCpm: Number(avgCpm.toFixed(2)),
    qualityRanking: rankings?.qualityRanking || null,
    engagementRateRanking: rankings?.engagementRateRanking || null,
    conversionRateRanking: rankings?.conversionRateRanking || null,
    avgCtr,
    avgCpc,
    avgCpl,
    avgCpa,
    roas,
    budget,
    budgetUsed,
    budgetRemaining,
    budgetUtilization: Number(budgetUtilization.toFixed(2)),
    budgetMode,
    dailyMetrics,
    learningSummary,
    status,
  };
};
