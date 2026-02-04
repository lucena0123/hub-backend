import type { Pool } from 'pg';

import type { ClientPerformanceSummary, DailyMetric, MetricsQuery, PerformanceSummary } from '../../types/metrics';
import { calculateCPA, calculateCPM, calculateCPC, calculateCPL, calculateCTR, calculateROAS } from './calculations';
import { getDateRange } from './date-range';
import { determinePerformanceStatus } from './performance-status';

export const getClientPerformanceSummary = async (
  pool: Pool,
  clientId: string,
  query: MetricsQuery = {}
): Promise<ClientPerformanceSummary> => {
  const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [clientId]);

  if (clientResult.rows.length === 0) {
    throw new Error('Client not found');
  }

  const client = clientResult.rows[0];
  const dates = getDateRange(query.period || '30d', query.startDate, query.endDate);
  const platform = query.platform;

  const campaignsResult = await pool.query(
    'SELECT id, name, platform, budget, status, "updatedAt" FROM campaigns WHERE "clientId" = $1',
    [clientId]
  );

  const campaigns = campaignsResult.rows as Array<{
    id: string;
    name: string;
    platform: string;
    budget: string | number | null;
    status: string;
    updatedAt: Date;
  }>;

  if (campaigns.length === 0) {
    return {
      clientId,
      clientName: client.name,
      period: { start: dates.start, end: dates.end },
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

  const baseParams: Array<string> = [clientId, dates.start, dates.end];
  const platformFilter = platform ? 'AND cm.platform = $4' : '';
  const params = platform ? [...baseParams, platform] : baseParams;

  const aggregatedResult = await pool.query(
    `SELECT
      cm.campaign_id as "campaignId",
      COALESCE(SUM(cm.impressions), 0) as total_impressions,
      COALESCE(SUM(cm.clicks), 0) as total_clicks,
      COALESCE(SUM(cm.conversions), 0) as total_conversions,
      COALESCE(SUM(cm.spend), 0) as total_spend,
      COALESCE(SUM(cm.revenue), 0) as total_revenue,
      COALESCE(SUM(cm.leads), 0) as total_leads,
      COALESCE(SUM(cm.messaging_conversations), 0) as total_messaging_conversations,
      COALESCE(SUM(cm.messaging_first_reply), 0) as total_messaging_first_reply,
      COALESCE(SUM(cm.link_clicks), 0) as total_link_clicks,
      COALESCE(SUM(cm.landing_page_views), 0) as total_landing_page_views,
      COALESCE(SUM(cm.reach), 0) as total_reach,
      COALESCE(AVG(cm.frequency), 0) as avg_frequency,
      COALESCE(AVG(cm.cpm), 0) as avg_cpm
    FROM campaign_metrics cm
    JOIN campaigns c ON c.id = cm.campaign_id
    WHERE c."clientId" = $1
      AND cm.date >= $2
      AND cm.date <= $3
      ${platformFilter}
    GROUP BY cm.campaign_id`,
    params
  );

  const aggregatedByCampaign = new Map<
    string,
    {
      totalImpressions: number;
      totalClicks: number;
      totalConversions: number;
      totalSpend: number;
      totalRevenue: number;
      totalLeads: number;
      totalMessagingConversations: number;
      totalMessagingFirstReply: number;
      totalLinkClicks: number;
      totalLandingPageViews: number;
      totalReach: number;
      avgFrequency: number;
      avgCpm: number;
    }
  >();

  aggregatedResult.rows.forEach((row: any) => {
    aggregatedByCampaign.set(row.campaignId, {
      totalImpressions: parseInt(row.total_impressions) || 0,
      totalClicks: parseInt(row.total_clicks) || 0,
      totalConversions: parseInt(row.total_conversions) || 0,
      totalSpend: parseFloat(row.total_spend) || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      totalLeads: parseInt(row.total_leads) || 0,
      totalMessagingConversations: parseInt(row.total_messaging_conversations) || 0,
      totalMessagingFirstReply: parseInt(row.total_messaging_first_reply) || 0,
      totalLinkClicks: parseInt(row.total_link_clicks) || 0,
      totalLandingPageViews: parseInt(row.total_landing_page_views) || 0,
      totalReach: parseInt(row.total_reach) || 0,
      avgFrequency: parseFloat(row.avg_frequency) || 0,
      avgCpm: parseFloat(row.avg_cpm) || 0,
    });
  });

  const rankingsResult = await pool.query(
    `SELECT DISTINCT ON (cm.campaign_id)
      cm.campaign_id as "campaignId",
      cm.quality_ranking as "qualityRanking",
      cm.engagement_rate_ranking as "engagementRateRanking",
      cm.conversion_rate_ranking as "conversionRateRanking"
     FROM campaign_metrics cm
     JOIN campaigns c ON c.id = cm.campaign_id
     WHERE c."clientId" = $1
       AND cm.date >= $2
       AND cm.date <= $3
       ${platformFilter}
       AND cm.quality_ranking IS NOT NULL
     ORDER BY cm.campaign_id, cm.date DESC`,
    params
  );

  const rankingsByCampaign = new Map<
    string,
    {
      qualityRanking: string | null;
      engagementRateRanking: string | null;
      conversionRateRanking: string | null;
    }
  >();

  rankingsResult.rows.forEach((row: any) => {
    rankingsByCampaign.set(row.campaignId, {
      qualityRanking: row.qualityRanking || null,
      engagementRateRanking: row.engagementRateRanking || null,
      conversionRateRanking: row.conversionRateRanking || null,
    });
  });

  const dailyResult = await pool.query(
    `SELECT
      cm.campaign_id as "campaignId",
      cm.date as date,
      COALESCE(SUM(cm.impressions), 0) as impressions,
      COALESCE(SUM(cm.clicks), 0) as clicks,
      COALESCE(SUM(cm.conversions), 0) as conversions,
      COALESCE(SUM(cm.messaging_conversations), 0) as messaging_conversations,
      COALESCE(SUM(cm.messaging_first_reply), 0) as messaging_first_reply,
      COALESCE(SUM(cm.link_clicks), 0) as link_clicks,
      COALESCE(SUM(cm.landing_page_views), 0) as landing_page_views,
      COALESCE(SUM(cm.spend), 0) as spend,
      COALESCE(SUM(cm.revenue), 0) as revenue,
      COALESCE(AVG(cm.ctr), 0) as ctr,
      COALESCE(AVG(cm.cpc), 0) as cpc,
      COALESCE(AVG(cm.cpl), 0) as cpl,
      COALESCE(AVG(cm.roas), 0) as roas
    FROM campaign_metrics cm
    JOIN campaigns c ON c.id = cm.campaign_id
    WHERE c."clientId" = $1
      AND cm.date >= $2
      AND cm.date <= $3
      ${platformFilter}
    GROUP BY cm.campaign_id, cm.date
    ORDER BY cm.campaign_id ASC, cm.date ASC`,
    params
  );

  const dailyByCampaign = new Map<string, DailyMetric[]>();

  dailyResult.rows.forEach((row: any) => {
    const campaignId = row.campaignId as string;
    const date = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0];
    const metric: DailyMetric = {
      date,
      impressions: parseInt(row.impressions) || 0,
      clicks: parseInt(row.clicks) || 0,
      conversions: parseInt(row.conversions) || 0,
      messagingConversations: parseInt(row.messaging_conversations) || 0,
      messagingFirstReply: parseInt(row.messaging_first_reply) || 0,
      linkClicks: parseInt(row.link_clicks) || 0,
      landingPageViews: parseInt(row.landing_page_views) || 0,
      spend: parseFloat(row.spend) || 0,
      revenue: parseFloat(row.revenue) || 0,
      ctr: parseFloat(row.ctr) || 0,
      cpc: parseFloat(row.cpc) || 0,
      cpl: parseFloat(row.cpl) || 0,
      roas: parseFloat(row.roas) || 0,
    };

    if (!dailyByCampaign.has(campaignId)) dailyByCampaign.set(campaignId, []);
    dailyByCampaign.get(campaignId)!.push(metric);
  });

  const updatedAtByCampaign = new Map<string, number>(
    campaigns.map((campaign) => [
      campaign.id,
      campaign.updatedAt instanceof Date ? campaign.updatedAt.getTime() : new Date(campaign.updatedAt).getTime(),
    ])
  );

  const campaignsPerformance: PerformanceSummary[] = campaigns.map((campaign) => {
    const aggregated =
      aggregatedByCampaign.get(campaign.id) ??
      ({
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
      } satisfies ReturnType<typeof aggregatedByCampaign.get>);

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

    const budget = parseFloat(String(campaign.budget ?? 0)) || 0;
    const budgetUsed = aggregated.totalSpend;
    const budgetRemaining = budget - budgetUsed;
    const budgetUtilization = budget > 0 ? (budgetUsed / budget) * 100 : 0;

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
      period: { start: dates.start, end: dates.end },
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
      dailyMetrics,
      status,
    };
  });

  campaignsPerformance.sort((a, b) => {
    if (b.totalSpend !== a.totalSpend) return b.totalSpend - a.totalSpend;
    if (b.totalMessagingConversations !== a.totalMessagingConversations)
      return b.totalMessagingConversations - a.totalMessagingConversations;
    if (b.totalImpressions !== a.totalImpressions) return b.totalImpressions - a.totalImpressions;

    const aUpdatedAt = updatedAtByCampaign.get(a.campaignId) ?? 0;
    const bUpdatedAt = updatedAtByCampaign.get(b.campaignId) ?? 0;
    if (bUpdatedAt !== aUpdatedAt) return bUpdatedAt - aUpdatedAt;

    return a.campaignName.localeCompare(b.campaignName, 'pt-BR', { sensitivity: 'base' });
  });

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
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
      leads: 0,
      messagingConversations: 0,
      messagingFirstReply: 0,
      linkClicks: 0,
      landingPageViews: 0,
      reach: 0,
    }
  );

  const avgCtr = calculateCTR(totals.clicks, totals.impressions);
  const totalContacts =
    totals.leads > 0 ? totals.leads : totals.messagingConversations > 0 ? totals.messagingConversations : totals.conversions;
  const avgCpl = calculateCPL(totals.spend, totalContacts);
  const avgCpa = calculateCPA(totals.spend, totals.conversions);
  const avgRoas = calculateROAS(totals.revenue, totals.spend);

  const dailyMap = new Map<string, DailyMetric>();
  const initMetric = (date: string): DailyMetric => ({
    date,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spend: 0,
    revenue: 0,
    ctr: 0,
    cpc: 0,
    cpl: 0,
    roas: 0,
  });

  campaignsPerformance.forEach((camp) => {
    camp.dailyMetrics.forEach((day) => {
      if (!dailyMap.has(day.date)) {
        dailyMap.set(day.date, initMetric(day.date));
      }
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
    period: { start: dates.start, end: dates.end },
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
    avgFrequency: totals.impressions > 0 && totals.reach > 0 ? Number((totals.impressions / totals.reach).toFixed(2)) : 0,
    avgCpm: calculateCPM(totals.spend, totals.impressions),
    avgCtr,
    avgCpl,
    avgCpa,
    avgRoas,
    campaigns: campaignsPerformance,
    dailyMetrics: finalDailyMetrics,
  };
};
