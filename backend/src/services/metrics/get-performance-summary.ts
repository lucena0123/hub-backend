import type { Pool } from 'pg';

import type { MetricsQuery, PerformanceSummary } from '../../types/metrics';
import { calculateCPA, calculateCPC, calculateCPL, calculateCTR, calculateROAS } from './calculations';
import { getDateRange } from './date-range';
import { getCampaignMetrics } from './get-campaign-metrics';
import { determinePerformanceStatus } from './performance-status';

export const getPerformanceSummary = async (
  pool: Pool,
  campaignId: string,
  query: MetricsQuery = {}
): Promise<PerformanceSummary> => {
  const { period = '30d', startDate, endDate } = query;
  const dates = getDateRange(period, startDate, endDate);

  const campaignResult = await pool.query('SELECT name, platform, budget FROM campaigns WHERE id = $1', [campaignId]);

  if (campaignResult.rows.length === 0) {
    throw new Error('Campaign not found');
  }

  const campaign = campaignResult.rows[0];

  const metricsResult = await pool.query(
    `SELECT
      SUM(impressions) as total_impressions,
      SUM(clicks) as total_clicks,
      SUM(conversions) as total_conversions,
      SUM(spend) as total_spend,
      SUM(revenue) as total_revenue,
      SUM(leads) as total_leads,
      SUM(messaging_conversations) as total_messaging_conversations,
      SUM(messaging_first_reply) as total_messaging_first_reply,
      SUM(link_clicks) as total_link_clicks,
      SUM(landing_page_views) as total_landing_page_views,
      SUM(reach) as total_reach,
      AVG(frequency) as avg_frequency,
      AVG(cpm) as avg_cpm
    FROM campaign_metrics
    WHERE campaign_id = $1
      AND date >= $2
      AND date <= $3`,
    [campaignId, dates.start, dates.end]
  );

  const rankingsResult = await pool.query(
    `SELECT quality_ranking, engagement_rate_ranking, conversion_rate_ranking
     FROM campaign_metrics
     WHERE campaign_id = $1 AND date >= $2 AND date <= $3
       AND quality_ranking IS NOT NULL
     ORDER BY date DESC LIMIT 1`,
    [campaignId, dates.start, dates.end]
  );
  const rankings = rankingsResult.rows[0] || {};

  const metrics = metricsResult.rows[0];
  const totalImpressions = parseInt(metrics.total_impressions) || 0;
  const totalClicks = parseInt(metrics.total_clicks) || 0;
  const totalConversions = parseInt(metrics.total_conversions) || 0;
  const totalSpend = parseFloat(metrics.total_spend) || 0;
  const totalRevenue = parseFloat(metrics.total_revenue) || 0;
  const totalLeads = parseInt(metrics.total_leads) || 0;
  const totalMessagingConversations = parseInt(metrics.total_messaging_conversations) || 0;
  const totalMessagingFirstReply = parseInt(metrics.total_messaging_first_reply) || 0;
  const totalLinkClicks = parseInt(metrics.total_link_clicks) || 0;
  const totalLandingPageViews = parseInt(metrics.total_landing_page_views) || 0;
  const totalReach = parseInt(metrics.total_reach) || 0;
  const avgFrequency = parseFloat(metrics.avg_frequency) || 0;
  const avgCpm = parseFloat(metrics.avg_cpm) || 0;

  const avgCtr = calculateCTR(totalClicks, totalImpressions);
  const avgCpc = calculateCPC(totalSpend, totalClicks);
  const totalContacts =
    totalLeads > 0 ? totalLeads : totalMessagingConversations > 0 ? totalMessagingConversations : totalConversions;
  const avgCpl = calculateCPL(totalSpend, totalContacts);
  const avgCpa = calculateCPA(totalSpend, totalConversions);
  const roas = calculateROAS(totalRevenue, totalSpend);

  const budget = parseFloat(campaign.budget) || 0;
  const budgetUsed = totalSpend;
  const budgetRemaining = budget > 0 ? budget - budgetUsed : 0;
  const budgetUtilization = budget > 0 ? (budgetUsed / budget) * 100 : 0;

  const dailyMetrics = await getCampaignMetrics(pool, campaignId, query);

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
    qualityRanking: rankings.quality_ranking || null,
    engagementRateRanking: rankings.engagement_rate_ranking || null,
    conversionRateRanking: rankings.conversion_rate_ranking || null,
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
};
