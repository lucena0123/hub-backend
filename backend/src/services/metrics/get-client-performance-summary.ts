import { PrismaClient, Prisma } from '@prisma/client';
import type { ClientPerformanceSummary, DailyMetric, MetricsQuery, PerformanceSummary } from '../../types/metrics';
import { calculateCPA, calculateCPM, calculateCPC, calculateCPL, calculateCTR, calculateROAS } from './calculations';
import { getDateRange } from './date-range';
import { determinePerformanceStatus } from './performance-status';
import { resolvePrimaryResult } from './primary-result';
import { buildLearningSummary } from './learning-summary';

type RankingCategory =
  | 'ABOVE_AVERAGE'
  | 'AVERAGE'
  | 'BELOW_AVERAGE_35'
  | 'BELOW_AVERAGE_20'
  | 'BELOW_AVERAGE_10'
  | 'UNKNOWN';

const MIN_IMPRESSIONS_FOR_ENGAGEMENT = 500;
const MIN_CLICKS_FOR_CONVERSION = 25;
const MIN_CONTACTS_FOR_QUALITY = 5;

const rankingFromPercentile = (percentile: number): RankingCategory => {
  if (percentile < 0.1) return 'BELOW_AVERAGE_10';
  if (percentile < 0.2) return 'BELOW_AVERAGE_20';
  if (percentile < 0.35) return 'BELOW_AVERAGE_35';
  if (percentile < 0.65) return 'AVERAGE';
  return 'ABOVE_AVERAGE';
};

const buildPercentileRankings = (
  entries: Array<{ campaignId: string; value: number }>,
  higherIsBetter: boolean
): Map<string, RankingCategory> => {
  const valid = entries.filter((entry) => Number.isFinite(entry.value));
  if (valid.length === 0) return new Map();

  const sorted = [...valid].sort((a, b) => a.value - b.value);
  const total = sorted.length;
  const map = new Map<string, RankingCategory>();

  sorted.forEach((entry, index) => {
    const percentile = total === 1 ? 0.5 : index / (total - 1);
    const adjusted = higherIsBetter ? percentile : 1 - percentile;
    map.set(entry.campaignId, rankingFromPercentile(adjusted));
  });

  return map;
};

const resolveRanking = (
  meta: string | null | undefined,
  computed: RankingCategory | undefined,
  platform: string
): string | null => {
  if (platform !== 'meta') return meta ?? null;
  if (meta && meta !== 'UNKNOWN') return meta;
  if (computed) return computed;
  if (meta === 'UNKNOWN') return meta;
  return 'UNKNOWN';
};

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
  const periodDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const platform = query.platform;

  // 2. Fetch Campaigns
  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    select: {
      id: true,
      name: true,
      platform: true,
      objective: true,
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
  const campaignById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

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
      AND (
        cm.quality_ranking IS NOT NULL
        OR cm.engagement_rate_ranking IS NOT NULL
        OR cm.conversion_rate_ranking IS NOT NULL
      )
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

  const leadTrackingByCampaign = new Map<string, { leadsResponded: number; avgResponseTimeHours: number | null }>();
  try {
    const leadTrackingRows = await prisma.$queryRaw<any[]>`
      SELECT
        campaign_id,
        COALESCE(SUM(leads_responded), 0) as leads_responded,
        AVG(response_time_hours) as avg_response_time_hours
      FROM campaign_lead_tracking
      WHERE date >= ${startDate}
        AND date <= ${endDate}
      GROUP BY campaign_id`;

    leadTrackingRows.forEach((row) => {
      leadTrackingByCampaign.set(String(row.campaign_id), {
        leadsResponded: Number(row.leads_responded),
        avgResponseTimeHours:
          row.avg_response_time_hours != null && Number.isFinite(Number(row.avg_response_time_hours))
            ? Number(row.avg_response_time_hours)
            : null,
      });
    });
  } catch (error) {
    // Silent fail if table doesn't exist or other error
  }

  const adsetObjectiveByCampaign = new Map<
    string,
    { optimizationGoal?: string | null; destinationType?: string | null; billingEvent?: string | null }
  >();
  try {
    const adsetMetaRows = await prisma.$queryRaw<any[]>`
      SELECT
        a.campaign_id,
        a.metadata
      FROM adsets a
      JOIN campaigns c ON c.id = a.campaign_id
      WHERE c."clientId" = ${clientId}
        AND a.platform = 'meta'`;

    adsetMetaRows.forEach((row) => {
      const campaignId = String(row.campaign_id);
      if (adsetObjectiveByCampaign.has(campaignId)) return;
      const metadata = row.metadata as Record<string, unknown> | null;
      if (!metadata) return;
      adsetObjectiveByCampaign.set(campaignId, {
        optimizationGoal: typeof metadata.optimizationGoal === 'string' ? metadata.optimizationGoal : null,
        destinationType: typeof metadata.destinationType === 'string' ? metadata.destinationType : null,
        billingEvent: typeof metadata.billingEvent === 'string' ? metadata.billingEvent : null,
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
      COALESCE(SUM(cm.leads), 0) as "leads",
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
    const campaign = campaignById.get(campaignId);
    // Date handling from Prisma raw queries can differ. Usually it is a Date object.
    const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0];

    const primary = resolvePrimaryResult({
      objective: campaign?.objective ?? null,
      objectiveMeta: adsetObjectiveByCampaign.get(campaignId) ?? null,
      metrics: {
        messagingConversations: Number(row.messaging_conversations),
        leads: Number(row.leads),
        linkClicks: Number(row.link_clicks),
        landingPageViews: Number(row.landing_page_views),
        conversions: Number(row.conversions),
        clicks: Number(row.clicks),
      },
    });

    const spend = Number(row.spend);
    const conversions = primary.value;

    const metric: DailyMetric = {
      date: dateStr,
      impressions: Number(row.impressions),
      clicks: Number(row.clicks),
      conversions,
      messagingConversations: Number(row.messaging_conversations),
      messagingFirstReply: Number(row.messaging_first_reply),
      linkClicks: Number(row.link_clicks),
      landingPageViews: Number(row.landing_page_views),
      spend,
      revenue: Number(row.revenue),
      ctr: Number(row.ctr),
      cpc: Number(row.cpc),
      cpl: conversions > 0 ? spend / conversions : 0,
      roas: Number(row.roas),
    };

    if (!dailyByCampaign.has(campaignId)) dailyByCampaign.set(campaignId, []);
    dailyByCampaign.get(campaignId)!.push(metric);
  });

  const campaignStats = campaigns.map((campaign) => {
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

    const primary = resolvePrimaryResult({
      objective: campaign.objective ?? null,
      objectiveMeta: adsetObjectiveByCampaign.get(campaign.id) ?? null,
      metrics: {
        messagingConversations: aggregated.totalMessagingConversations,
        leads: aggregated.totalLeads,
        linkClicks: aggregated.totalLinkClicks,
        landingPageViews: aggregated.totalLandingPageViews,
        conversions: aggregated.totalConversions,
        clicks: aggregated.totalClicks,
      },
    });

    const totalContacts = primary.value;

    const avgCtr = calculateCTR(aggregated.totalClicks, aggregated.totalImpressions);
    const avgCpl = calculateCPL(aggregated.totalSpend, totalContacts);
    const conversionRate = aggregated.totalClicks > 0 ? (totalContacts / aggregated.totalClicks) * 100 : 0;

    return {
      campaignId: campaign.id,
      totalImpressions: aggregated.totalImpressions,
      totalClicks: aggregated.totalClicks,
      totalContacts,
      avgCtr,
      avgCpl,
      conversionRate,
    };
  });

  const qualityRankings = buildPercentileRankings(
    campaignStats
      .filter((stat) => stat.totalContacts >= MIN_CONTACTS_FOR_QUALITY && stat.avgCpl > 0)
      .map((stat) => ({ campaignId: stat.campaignId, value: stat.avgCpl })),
    false
  );

  const engagementRankings = buildPercentileRankings(
    campaignStats
      .filter((stat) => stat.totalImpressions >= MIN_IMPRESSIONS_FOR_ENGAGEMENT)
      .map((stat) => ({ campaignId: stat.campaignId, value: stat.avgCtr })),
    true
  );

  const conversionRankings = buildPercentileRankings(
    campaignStats
      .filter((stat) => stat.totalClicks >= MIN_CLICKS_FOR_CONVERSION)
      .map((stat) => ({ campaignId: stat.campaignId, value: stat.conversionRate })),
    true
  );

  const computedRankings = new Map<
    string,
    {
      qualityRanking?: RankingCategory;
      engagementRateRanking?: RankingCategory;
      conversionRateRanking?: RankingCategory;
    }
  >();

  campaigns.forEach((campaign) => {
    computedRankings.set(campaign.id, {
      qualityRanking: qualityRankings.get(campaign.id),
      engagementRateRanking: engagementRankings.get(campaign.id),
      conversionRateRanking: conversionRankings.get(campaign.id),
    });
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
    const computed = computedRankings.get(campaign.id);

    const avgCtr = calculateCTR(aggregated.totalClicks, aggregated.totalImpressions);
    const avgCpc = calculateCPC(aggregated.totalSpend, aggregated.totalClicks);
    const primary = resolvePrimaryResult({
      objective: campaign.objective ?? null,
      objectiveMeta: adsetObjectiveByCampaign.get(campaign.id) ?? null,
      metrics: {
        messagingConversations: aggregated.totalMessagingConversations,
        leads: aggregated.totalLeads,
        linkClicks: aggregated.totalLinkClicks,
        landingPageViews: aggregated.totalLandingPageViews,
        conversions: aggregated.totalConversions,
        clicks: aggregated.totalClicks,
      },
    });
    const totalContacts = primary.value;
    const avgCpl = calculateCPL(aggregated.totalSpend, totalContacts);
    const avgCpa = calculateCPA(aggregated.totalSpend, totalContacts);
    const roas = calculateROAS(aggregated.totalRevenue, aggregated.totalSpend);

    // Casting budget since Prisma might return Decimal, but here we used findMany which returns mapped model type.
    // Schema says budget is Float? Let's check. Assuming it is number.
    const budget = Number(campaign.budget) || 0;
    const budgetUsed = aggregated.totalSpend;
    const adsetBudgets = adsetBudgetsByCampaign.get(campaign.id);
    const adsetDailyBudget = adsetBudgets?.dailyBudget || 0;
    const adsetLifetimeBudget = adsetBudgets?.lifetimeBudget || 0;

    const hasCampaignBudget = budget > 0;
    const hasAdsetBudget = adsetDailyBudget > 0 || adsetLifetimeBudget > 0;

    let budgetMode: 'abo' | 'cbo' | 'mixed' | 'unknown' = 'unknown';
    if (hasCampaignBudget && hasAdsetBudget) budgetMode = 'mixed';
    else if (hasCampaignBudget) budgetMode = 'cbo';
    else if (hasAdsetBudget) budgetMode = 'abo';

    let budgetType: 'daily' | 'lifetime' | 'adset_daily' | 'adset_lifetime' | 'unknown' = 'unknown';
    let budgetPeriod = budget;

    if ((budgetMode === 'abo' || budgetMode === 'mixed') && (adsetDailyBudget > 0 || adsetLifetimeBudget > 0)) {
      if (adsetDailyBudget > 0) {
        budgetType = 'adset_daily';
        budgetPeriod = adsetDailyBudget * periodDays;
      } else if (adsetLifetimeBudget > 0) {
        budgetType = 'adset_lifetime';
        budgetPeriod = adsetLifetimeBudget;
      }
    }

    if (budgetType === 'unknown' && budget > 0) {
      if (periodDays > 1 && budgetUsed > budget * 1.2) {
        budgetType = 'daily';
        budgetPeriod = budget * periodDays;
      } else {
        budgetType = 'lifetime';
        budgetPeriod = budget;
      }
    }

    const budgetRemaining = budgetPeriod > 0 ? budgetPeriod - budgetUsed : 0;
    const budgetUtilization = budgetPeriod > 0 ? (budgetUsed / budgetPeriod) * 100 : 0;

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
      objective: campaign.objective ?? null,
      objectiveMeta: adsetObjectiveByCampaign.get(campaign.id) ?? null,
      leadsResponded: leadTrackingByCampaign.get(campaign.id)?.leadsResponded ?? 0,
      avgResponseTimeHours: leadTrackingByCampaign.get(campaign.id)?.avgResponseTimeHours ?? null,
      optimizationThemeKey: campaign.optimizationThemeKey ?? null,
      optimizationSubthemeKey: campaign.optimizationSubthemeKey ?? null,
      period: { start: Dates.start, end: Dates.end }, // use Dates computed above
      totalImpressions: aggregated.totalImpressions,
      totalClicks: aggregated.totalClicks,
      totalConversions: totalContacts,
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
      qualityRanking: resolveRanking(rankings?.qualityRanking, computed?.qualityRanking, campaign.platform),
      engagementRateRanking: resolveRanking(
        rankings?.engagementRateRanking,
        computed?.engagementRateRanking,
        campaign.platform
      ),
      conversionRateRanking: resolveRanking(
        rankings?.conversionRateRanking,
        computed?.conversionRateRanking,
        campaign.platform
      ),
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
      budgetType,
      budgetPeriod: Number.isFinite(budgetPeriod) ? Number(budgetPeriod.toFixed(2)) : 0,
      dailyMetrics,
      status,
    };
  });

  const campaignsWithLearning = await Promise.all(
    campaignsPerformance.map(async (perf) => ({
      ...perf,
      learningSummary: await buildLearningSummary(prisma, perf.campaignId, perf.objective ?? null),
    }))
  );

  // Sorting
  campaignsWithLearning.sort((a, b) => {
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
  const totalContacts = totals.conversions;
  const avgCpl = calculateCPL(totals.spend, totalContacts);
  const avgCpa = calculateCPA(totals.spend, totalContacts);
  const avgRoas = calculateROAS(totals.revenue, totals.spend);

  // Consolidated Daily Metrics
  const dailyMap = new Map<string, DailyMetric>();
  const initMetric = (date: string): DailyMetric => ({
    date,
    impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0,
    ctr: 0, cpc: 0, cpl: 0, roas: 0,
  });

  campaignsWithLearning.forEach((camp) => {
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
    campaigns: campaignsWithLearning,
    dailyMetrics: finalDailyMetrics,
  };
};
