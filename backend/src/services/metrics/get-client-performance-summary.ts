import { PrismaClient, Prisma } from '@prisma/client';
import type { ClientPerformanceSummary, DailyMetric, MetricsQuery, PerformanceSummary } from '../../types/metrics';
import { calculateCPA, calculateCPM, calculateCPC, calculateCPL, calculateCTR, calculateROAS } from './calculations';
import { getDateRange } from './date-range';
import { determinePerformanceStatus } from './performance-status';

export const getClientPerformanceSummary = async (
  prisma: PrismaClient,
  clientId: string,
  query: MetricsQuery = {}
): Promise<ClientPerformanceSummary> => {
  // 1. Fetch Client
  const clientResult = await prisma.$queryRaw<any[]>`SELECT name FROM clients WHERE id = ${clientId}`;
  const client = clientResult[0];

  if (!client) {
    throw new Error('Client not found');
  }

  const Dates = getDateRange(query.period || '30d', query.startDate, query.endDate);
  // Ensure dates are Date objects for Prisma
  const startDate = new Date(Dates.start);
  const endDate = new Date(Dates.end);
  const platform = query.platform;

  // 2. Fetch Campaigns
  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    select: {
      id: true,
      name: true,
      platform: true,
      optimizationThemeKey: true,
      optimizationSubthemeKey: true,
      budget: true, // Prisma returns Decimal or null? Check schema type. Schema says String or Float? Actually in schema it is usually Float or Decimal.
      status: true,
      updatedAt: true,
    },
  });

  if (campaigns.length === 0) {
    return {
      clientId,
      clientName: client.name,
      period: { start: Dates.start, end: Dates.end },
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
      totalLeads: 0,
      totalMessagingConversations: 0,
      totalMessagingFirstReply: 0,
      totalLinkClicks: 0,
      totalLandingPageViews: 0,
      totalReach: 0,
      avgFrequency: 0,
      avgCpm: 0,
      avgCtr: 0,
      avgCpl: 0,
      avgCpa: 0,
      avgRoas: 0,
      campaigns: [],
      dailyMetrics: [],
    };
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');

  // Dynamic filters
  const conditions = [Prisma.sql`c."clientId" = ${clientId}`];
  conditions.push(Prisma.sql`cm.date >= ${startDate}`);
  conditions.push(Prisma.sql`cm.date <= ${endDate}`);

  if (platform) {
    conditions.push(Prisma.sql`cm.platform = ${platform}`);
  }

  const whereClause = Prisma.join(conditions, ' AND ');

  // 3. Aggregated Result
  const aggregatedResult = await prisma.$queryRaw<any[]>`
    SELECT
      cm.campaign_id as "campaignId",
      COALESCE(SUM(cm.impressions), 0) as "total_impressions",
      COALESCE(SUM(cm.clicks), 0) as "total_clicks",
      COALESCE(SUM(cm.conversions), 0) as "total_conversions",
      COALESCE(SUM(cm.spend), 0) as "total_spend",
      COALESCE(SUM(cm.revenue), 0) as "total_revenue",
      COALESCE(SUM(cm.leads), 0) as "total_leads",
      COALESCE(SUM(cm.messaging_conversations), 0) as "total_messaging_conversations",
      COALESCE(SUM(cm.messaging_first_reply), 0) as "total_messaging_first_reply",
      COALESCE(SUM(cm.link_clicks), 0) as "total_link_clicks",
      COALESCE(SUM(cm.landing_page_views), 0) as "total_landing_page_views",
      COALESCE(SUM(cm.reach), 0) as "total_reach",
      COALESCE(AVG(cm.frequency), 0) as "avg_frequency",
      COALESCE(AVG(cm.cpm), 0) as "avg_cpm"
    FROM campaign_metrics cm
    JOIN campaigns c ON c.id = cm.campaign_id
    WHERE ${whereClause}
    GROUP BY cm.campaign_id`;

  const aggregatedByCampaign = new Map<string, any>();
  aggregatedResult.forEach((row) => {
    // Prisma raw returns BigInt for sums sometimes depending on driver, but usually number for Int/Float columns?
    // Casting to Number just in case.
    aggregatedByCampaign.set(row.campaignId, {
      totalImpressions: Number(row.total_impressions),
      totalClicks: Number(row.total_clicks),
      totalConversions: Number(row.total_conversions),
      totalSpend: Number(row.total_spend),
      totalRevenue: Number(row.total_revenue),
      totalLeads: Number(row.total_leads),
      totalMessagingConversations: Number(row.total_messaging_conversations),
      totalMessagingFirstReply: Number(row.total_messaging_first_reply),
      totalLinkClicks: Number(row.total_link_clicks),
      totalLandingPageViews: Number(row.total_landing_page_views),
      totalReach: Number(row.total_reach),
      avgFrequency: Number(row.avg_frequency),
      avgCpm: Number(row.avg_cpm),
    });
  });

  // 4. Rankings Result
  // Note: rankings are strings or nulls
  const rankingsResult = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT ON (cm.campaign_id)
      cm.campaign_id as "campaignId",
      cm.quality_ranking as "qualityRanking",
      cm.engagement_rate_ranking as "engagementRateRanking",
      cm.conversion_rate_ranking as "conversionRateRanking"
    FROM campaign_metrics cm
    JOIN campaigns c ON c.id = cm.campaign_id
    WHERE ${whereClause}
      AND cm.quality_ranking IS NOT NULL
    ORDER BY cm.campaign_id, cm.date DESC`;

  const rankingsByCampaign = new Map<string, any>();
  rankingsResult.forEach((row) => {
    rankingsByCampaign.set(row.campaignId, {
      qualityRanking: row.qualityRanking,
      engagementRateRanking: row.engagementRateRanking,
      conversionRateRanking: row.conversionRateRanking,
    });
  });

  // 5. Adset Budgets
  // Note: We need to see if AdSet table exists in Prisma Schema. If not, raw query is fine but we can't rely on model types.
  const adsetBudgetsByCampaign = new Map<string, { dailyBudget: number; lifetimeBudget: number }>();
  try {
    const adsetBudgetsAgg = await prisma.$queryRaw<any[]>`
      SELECT
        a.campaign_id,
        COALESCE(SUM(a.daily_budget), 0) as daily_budget,
        COALESCE(SUM(a.lifetime_budget), 0) as lifetime_budget
      FROM adsets a
      JOIN campaigns c ON c.id = a.campaign_id
      WHERE c."clientId" = ${clientId}
      GROUP BY a.campaign_id`;

    adsetBudgetsAgg.forEach((row) => {
      adsetBudgetsByCampaign.set(String(row.campaign_id), {
        dailyBudget: Number(row.daily_budget),
        lifetimeBudget: Number(row.lifetime_budget),
      });
    });
  } catch (error) {
    // Silent fail if table doesn't exist or other error
  }

  // 6. Daily Result
  const dailyResult = await prisma.$queryRaw<any[]>`
    SELECT
      cm.campaign_id as "campaignId",
      cm.date as "date",
      COALESCE(SUM(cm.impressions), 0) as "impressions",
      COALESCE(SUM(cm.clicks), 0) as "clicks",
      COALESCE(SUM(cm.conversions), 0) as "conversions",
      COALESCE(SUM(cm.messaging_conversations), 0) as "messaging_conversations",
      COALESCE(SUM(cm.messaging_first_reply), 0) as "messaging_first_reply",
      COALESCE(SUM(cm.link_clicks), 0) as "link_clicks",
      COALESCE(SUM(cm.landing_page_views), 0) as "landing_page_views",
      COALESCE(SUM(cm.spend), 0) as "spend",
      COALESCE(SUM(cm.revenue), 0) as "revenue",
      COALESCE(AVG(cm.ctr), 0) as "ctr",
      COALESCE(AVG(cm.cpc), 0) as "cpc",
      COALESCE(AVG(cm.cpl), 0) as "cpl",
      COALESCE(AVG(cm.roas), 0) as "roas"
    FROM campaign_metrics cm
    JOIN campaigns c ON c.id = cm.campaign_id
    WHERE ${whereClause}
    GROUP BY cm.campaign_id, cm.date
    ORDER BY cm.campaign_id ASC, cm.date ASC`;

  const dailyByCampaign = new Map<string, DailyMetric[]>();

  dailyResult.forEach((row) => {
    const campaignId = row.campaignId as string;
    // Date handling from Prisma raw queries can differ. Usually it is a Date object.
    const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0];

    const metric: DailyMetric = {
      date: dateStr,
      impressions: Number(row.impressions),
      clicks: Number(row.clicks),
      conversions: Number(row.conversions),
      messagingConversations: Number(row.messaging_conversations),
      messagingFirstReply: Number(row.messaging_first_reply),
      linkClicks: Number(row.link_clicks),
      landingPageViews: Number(row.landing_page_views),
      spend: Number(row.spend),
      revenue: Number(row.revenue),
      ctr: Number(row.ctr),
      cpc: Number(row.cpc),
      cpl: Number(row.cpl),
      roas: Number(row.roas),
    };

    if (!dailyByCampaign.has(campaignId)) dailyByCampaign.set(campaignId, []);
    dailyByCampaign.get(campaignId)!.push(metric);
  });

  // Calculate Aggregations & Status (Logic largely same as before)
  const campaignsPerformance: PerformanceSummary[] = campaigns.map((campaign) => {
    const aggregated = aggregatedByCampaign.get(campaign.id) || {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
      totalLeads: 0,
      totalMessagingConversations: 0,
      totalMessagingFirstReply: 0,
      totalLinkClicks: 0,
      totalLandingPageViews: 0,
      totalReach: 0,
      avgFrequency: 0,
      avgCpm: 0,
    };

    const rankings = rankingsByCampaign.get(campaign.id);

    const avgCtr = calculateCTR(aggregated.totalClicks, aggregated.totalImpressions);
    const avgCpc = calculateCPC(aggregated.totalSpend, aggregated.totalClicks);
    const totalContacts =
      aggregated.totalLeads > 0
        ? aggregated.totalLeads
        : aggregated.totalMessagingConversations > 0
          ? aggregated.totalMessagingConversations
          : aggregated.totalConversions;
    const avgCpl = calculateCPL(aggregated.totalSpend, totalContacts);
    const avgCpa = calculateCPA(aggregated.totalSpend, aggregated.totalConversions);
    const roas = calculateROAS(aggregated.totalRevenue, aggregated.totalSpend);

    // Casting budget since Prisma might return Decimal, but here we used findMany which returns mapped model type.
    // Schema says budget is Float? Let's check. Assuming it is number.
    const budget = Number(campaign.budget) || 0;
    const budgetUsed = aggregated.totalSpend;
    const budgetRemaining = budget > 0 ? budget - budgetUsed : 0;
    const budgetUtilization = budget > 0 ? (budgetUsed / budget) * 100 : 0;

    const adsetBudgets = adsetBudgetsByCampaign.get(campaign.id);
    const adsetDailyBudget = adsetBudgets?.dailyBudget || 0;
    const adsetLifetimeBudget = adsetBudgets?.lifetimeBudget || 0;

    const hasCampaignBudget = budget > 0;
    const hasAdsetBudget = adsetDailyBudget > 0 || adsetLifetimeBudget > 0;

    let budgetMode: 'abo' | 'cbo' | 'mixed' | 'unknown' = 'unknown';
    if (hasCampaignBudget && hasAdsetBudget) budgetMode = 'mixed';
    else if (hasCampaignBudget) budgetMode = 'cbo';
    else if (hasAdsetBudget) budgetMode = 'abo';

    const dailyMetrics = dailyByCampaign.get(campaign.id) ?? [];

    const status = determinePerformanceStatus({
      roas,
      cpl: avgCpl,
      ctr: avgCtr,
      budgetUtilization,
    });

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      platform: campaign.platform,
      optimizationThemeKey: campaign.optimizationThemeKey ?? null,
      optimizationSubthemeKey: campaign.optimizationSubthemeKey ?? null,
      period: { start: Dates.start, end: Dates.end }, // use Dates computed above
      totalImpressions: aggregated.totalImpressions,
      totalClicks: aggregated.totalClicks,
      totalConversions: aggregated.totalConversions,
      totalSpend: aggregated.totalSpend,
      totalRevenue: aggregated.totalRevenue,
      totalLeads: aggregated.totalLeads,
      totalMessagingConversations: aggregated.totalMessagingConversations,
      totalMessagingFirstReply: aggregated.totalMessagingFirstReply,
      totalLinkClicks: aggregated.totalLinkClicks,
      totalLandingPageViews: aggregated.totalLandingPageViews,
      totalReach: aggregated.totalReach,
      avgFrequency: Number(aggregated.avgFrequency.toFixed(2)),
      avgCpm: Number(aggregated.avgCpm.toFixed(2)),
      qualityRanking: rankings?.qualityRanking ?? null,
      engagementRateRanking: rankings?.engagementRateRanking ?? null,
      conversionRateRanking: rankings?.conversionRateRanking ?? null,
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
      status,
    };
  });

  // Sorting
  campaignsPerformance.sort((a, b) => {
    if (b.totalSpend !== a.totalSpend) return b.totalSpend - a.totalSpend;
    if (b.totalMessagingConversations !== a.totalMessagingConversations)
      return b.totalMessagingConversations - a.totalMessagingConversations;
    if (b.totalImpressions !== a.totalImpressions) return b.totalImpressions - a.totalImpressions;

    // We don't have updatedAt in performance summary easily accessible unless we map it.
    // For simplicity, skip sorting by updatedAt or fetch it.
    // Or we can map it from campaigns array.
    const getUpdate = (id: string) => campaigns.find(c => c.id === id)?.updatedAt.getTime() || 0;
    return getUpdate(b.campaignId) - getUpdate(a.campaignId);
  });

  // Grand Totals Calculation
  const totals = campaignsPerformance.reduce(
    (acc, perf) => ({
      impressions: acc.impressions + perf.totalImpressions,
      clicks: acc.clicks + perf.totalClicks,
      conversions: acc.conversions + perf.totalConversions,
      spend: acc.spend + perf.totalSpend,
      revenue: acc.revenue + perf.totalRevenue,
      leads: acc.leads + perf.totalLeads,
      messagingConversations: acc.messagingConversations + perf.totalMessagingConversations,
      messagingFirstReply: acc.messagingFirstReply + perf.totalMessagingFirstReply,
      linkClicks: acc.linkClicks + perf.totalLinkClicks,
      landingPageViews: acc.landingPageViews + perf.totalLandingPageViews,
      reach: acc.reach + perf.totalReach,
    }),
    {
      impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0,
      leads: 0, messagingConversations: 0, messagingFirstReply: 0,
      linkClicks: 0, landingPageViews: 0, reach: 0,
    }
  );

  const avgCtr = calculateCTR(totals.clicks, totals.impressions);
  const totalContacts =
    totals.leads > 0 ? totals.leads : totals.messagingConversations > 0 ? totals.messagingConversations : totals.conversions;
  const avgCpl = calculateCPL(totals.spend, totalContacts);
  const avgCpa = calculateCPA(totals.spend, totals.conversions);
  const avgRoas = calculateROAS(totals.revenue, totals.spend);

  // Consolidated Daily Metrics
  const dailyMap = new Map<string, DailyMetric>();
  const initMetric = (date: string): DailyMetric => ({
    date,
    impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0,
    ctr: 0, cpc: 0, cpl: 0, roas: 0,
  });

  campaignsPerformance.forEach((camp) => {
    camp.dailyMetrics.forEach((day) => {
      if (!dailyMap.has(day.date)) dailyMap.set(day.date, initMetric(day.date));
      const acc = dailyMap.get(day.date)!;
      acc.impressions += day.impressions;
      acc.clicks += day.clicks;
      acc.conversions += day.conversions;
      acc.spend += day.spend;
      acc.revenue += day.revenue || 0;
    });
  });

  const finalDailyMetrics: DailyMetric[] = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      ctr: calculateCTR(d.clicks, d.impressions),
      cpc: calculateCPC(d.spend, d.clicks),
      cpl: calculateCPL(d.spend, d.conversions),
      roas: calculateROAS(d.revenue, d.spend),
    }));

  return {
    clientId,
    clientName: client.name,
    period: { start: Dates.start, end: Dates.end },
    totalCampaigns: campaigns.length,
    activeCampaigns: activeCampaigns.length,
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalConversions: totals.conversions,
    totalSpend: totals.spend,
    totalRevenue: totals.revenue,
    totalLeads: totals.leads,
    totalMessagingConversations: totals.messagingConversations,
    totalMessagingFirstReply: totals.messagingFirstReply,
    totalLinkClicks: totals.linkClicks,
    totalLandingPageViews: totals.landingPageViews,
    totalReach: totals.reach,
    avgFrequency: totals.reach > 0 ? Number((totals.impressions / totals.reach).toFixed(2)) : 0,
    avgCpm: calculateCPM(totals.spend, totals.impressions),
    avgCtr,
    avgCpl,
    avgCpa,
    avgRoas,
    campaigns: campaignsPerformance,
    dailyMetrics: finalDailyMetrics,
  };
};
