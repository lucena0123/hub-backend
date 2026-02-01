/**
 * Metrics Service
 * Handles all campaign performance calculations and aggregations
 */

import { Pool } from 'pg';
import type {
  CampaignMetrics,
  DailyMetric,
  PerformanceSummary,
  ClientPerformanceSummary,
  MetricsQuery,
} from '../types/metrics';

export class MetricsService {
  constructor(private pool: Pool) {}

  /**
   * Calculate CPL (Cost Per Lead)
   */
  calculateCPL(spend: number, leads: number): number {
    if (leads === 0) return 0;
    return Number((spend / leads).toFixed(2));
  }

  /**
   * Calculate CPA (Cost Per Acquisition/Conversion)
   */
  calculateCPA(spend: number, conversions: number): number {
    if (conversions === 0) return 0;
    return Number((spend / conversions).toFixed(2));
  }

  /**
   * Calculate CPC (Cost Per Click)
   */
  calculateCPC(spend: number, clicks: number): number {
    if (clicks === 0) return 0;
    return Number((spend / clicks).toFixed(2));
  }

  /**
   * Calculate CTR (Click-Through Rate) in percentage
   */
  calculateCTR(clicks: number, impressions: number): number {
    if (impressions === 0) return 0;
    return Number(((clicks / impressions) * 100).toFixed(2));
  }

  /**
   * Calculate ROAS (Return on Ad Spend)
   */
  calculateROAS(revenue: number, spend: number): number {
    if (spend === 0) return 0;
    return Number((revenue / spend).toFixed(2));
  }

  /**
   * Calculate CPM (Cost Per Mille / 1000 impressions)
   */
  calculateCPM(spend: number, impressions: number): number {
    if (impressions === 0) return 0;
    return Number(((spend / impressions) * 1000).toFixed(2));
  }

  /**
   * Get campaign metrics for a specific period
   */
  async getCampaignMetrics(
    campaignId: string,
    query: MetricsQuery = {}
  ): Promise<DailyMetric[]> {
    const { period = '30d', startDate, endDate, platform } = query;

    // Calculate date range
    const dates = this.getDateRange(period, startDate, endDate);

    const queryParams: any[] = [campaignId, dates.start, dates.end];
    let platformFilter = '';

    if (platform) {
      queryParams.push(platform);
      platformFilter = 'AND platform = $4';
    }

    const result = await this.pool.query(
      `SELECT
        date,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions,
        SUM(spend) as spend,
        AVG(ctr) as ctr,
        AVG(cpc) as cpc,
        AVG(cpl) as cpl,
        AVG(roas) as roas
      FROM campaign_metrics
      WHERE campaign_id = $1
        AND date >= $2
        AND date <= $3
        ${platformFilter}
      GROUP BY date
      ORDER BY date ASC`,
      queryParams
    );

    return result.rows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      impressions: parseInt(row.impressions) || 0,
      clicks: parseInt(row.clicks) || 0,
      conversions: parseInt(row.conversions) || 0,
      spend: parseFloat(row.spend) || 0,
      ctr: parseFloat(row.ctr) || 0,
      cpc: parseFloat(row.cpc) || 0,
      cpl: parseFloat(row.cpl) || 0,
      roas: parseFloat(row.roas) || 0,
    }));
  }

  /**
   * Get performance summary for a campaign
   */
  async getPerformanceSummary(
    campaignId: string,
    query: MetricsQuery = {}
  ): Promise<PerformanceSummary> {
    const { period = '30d', startDate, endDate } = query;
    const dates = this.getDateRange(period, startDate, endDate);

    // Get campaign info
    const campaignResult = await this.pool.query(
      'SELECT name, platform, budget FROM campaigns WHERE id = $1',
      [campaignId]
    );

    if (campaignResult.rows.length === 0) {
      throw new Error('Campaign not found');
    }

    const campaign = campaignResult.rows[0];

    // Get aggregated metrics
    const metricsResult = await this.pool.query(
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

    // Get most recent quality rankings
    const rankingsResult = await this.pool.query(
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

    // Calculate averages
    const avgCtr = this.calculateCTR(totalClicks, totalImpressions);
    const avgCpc = this.calculateCPC(totalSpend, totalClicks);
    const avgCpl = this.calculateCPL(totalSpend, totalLeads);
    const avgCpa = this.calculateCPA(totalSpend, totalConversions);
    const roas = this.calculateROAS(totalRevenue, totalSpend);

    // Budget calculations
    const budget = parseFloat(campaign.budget) || 0;
    const budgetUsed = totalSpend;
    const budgetRemaining = budget - budgetUsed;
    const budgetUtilization = budget > 0 ? (budgetUsed / budget) * 100 : 0;

    // Get daily metrics for trends
    const dailyMetrics = await this.getCampaignMetrics(campaignId, query);

    // Determine performance status
    const status = this.determinePerformanceStatus({
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
  }

  /**
   * Get client performance summary (all campaigns)
   */
  async getClientPerformanceSummary(
    clientId: string,
    query: MetricsQuery = {}
  ): Promise<ClientPerformanceSummary> {
    // Get client info
    const clientResult = await this.pool.query(
      'SELECT name FROM clients WHERE id = $1',
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      throw new Error('Client not found');
    }

    const client = clientResult.rows[0];
    const dates = this.getDateRange(query.period || '30d', query.startDate, query.endDate);

    // Get all campaigns for this client
    const campaignsResult = await this.pool.query(
      'SELECT id, status FROM campaigns WHERE "clientId" = $1',
      [clientId]
    );

    const allCampaigns = campaignsResult.rows;
    const activeCampaigns = allCampaigns.filter((c) => c.status === 'active');

    // Get performance for each campaign
    const campaignsPerformance: PerformanceSummary[] = [];
    for (const campaign of allCampaigns) {
      try {
        const performance = await this.getPerformanceSummary(campaign.id, query);
        campaignsPerformance.push(performance);
      } catch (error) {
        console.error(`Error getting performance for campaign ${campaign.id}:`, error);
      }
    }

    // Aggregate totals
    const totals = campaignsPerformance.reduce(
      (acc, perf) => ({
        impressions: acc.impressions + perf.totalImpressions,
        clicks: acc.clicks + perf.totalClicks,
        conversions: acc.conversions + perf.totalConversions,
        spend: acc.spend + perf.totalSpend,
        revenue: acc.revenue + perf.totalRevenue,
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
        messagingConversations: 0,
        messagingFirstReply: 0,
        linkClicks: 0,
        landingPageViews: 0,
        reach: 0,
      }
    );

    // Calculate overall averages
    const avgCtr = this.calculateCTR(totals.clicks, totals.impressions);
    const avgCpl = this.calculateCPL(totals.spend, totals.conversions); // Assuming conversions = leads
    const avgRoas = this.calculateROAS(totals.revenue, totals.spend);

    return {
      clientId,
      clientName: client.name,
      period: {
        start: dates.start,
        end: dates.end,
      },
      totalCampaigns: allCampaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalConversions: totals.conversions,
      totalSpend: totals.spend,
      totalRevenue: totals.revenue,
      totalMessagingConversations: totals.messagingConversations,
      totalMessagingFirstReply: totals.messagingFirstReply,
      totalLinkClicks: totals.linkClicks,
      totalLandingPageViews: totals.landingPageViews,
      totalReach: totals.reach,
      avgFrequency: totals.impressions > 0 && totals.reach > 0
        ? Number((totals.impressions / totals.reach).toFixed(2))
        : 0,
      avgCpm: this.calculateCPM(totals.spend, totals.impressions),
      avgCtr,
      avgCpl,
      avgRoas,
      campaigns: campaignsPerformance,
    };
  }

  /**
   * Helper: Get date range based on period
   */
  private getDateRange(
    period: string,
    startDate?: string,
    endDate?: string
  ): { start: string; end: string } {
    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    const end = new Date();
    const start = new Date();

    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '14d':
        start.setDate(end.getDate() - 14);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '60d':
        start.setDate(end.getDate() - 60);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  /**
   * Helper: Determine performance status
   */
  private determinePerformanceStatus(metrics: {
    roas: number;
    cpl: number;
    ctr: number;
    budgetUtilization: number;
  }): 'excellent' | 'good' | 'fair' | 'poor' {
    // Simple scoring system (can be improved with industry benchmarks)
    let score = 0;

    // ROAS scoring
    if (metrics.roas >= 4) score += 3;
    else if (metrics.roas >= 2) score += 2;
    else if (metrics.roas >= 1) score += 1;

    // CTR scoring (assuming 2%+ is good)
    if (metrics.ctr >= 3) score += 3;
    else if (metrics.ctr >= 2) score += 2;
    else if (metrics.ctr >= 1) score += 1;

    // Budget utilization (not overspending)
    if (metrics.budgetUtilization <= 100 && metrics.budgetUtilization >= 80) score += 2;
    else if (metrics.budgetUtilization > 100) score -= 2;

    // Map score to status
    if (score >= 7) return 'excellent';
    if (score >= 5) return 'good';
    if (score >= 3) return 'fair';
    return 'poor';
  }
}
