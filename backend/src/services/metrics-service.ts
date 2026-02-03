/**
 * Metrics Service
 * Handles all campaign performance calculations and aggregations
 */

import { Pool } from 'pg';
import type {
  DailyMetric,
  PerformanceSummary,
  ClientPerformanceSummary,
  MetricsQuery,
} from '../types/metrics';

export class MetricsService {
  constructor(private pool: Pool) { }

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
        SUM(messaging_conversations) as messaging_conversations,
        SUM(messaging_first_reply) as messaging_first_reply,
        SUM(link_clicks) as link_clicks,
        SUM(landing_page_views) as landing_page_views,
        SUM(spend) as spend,
        SUM(revenue) as revenue,
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
      messagingConversations: parseInt(row.messaging_conversations) || 0,
      messagingFirstReply: parseInt(row.messaging_first_reply) || 0,
      linkClicks: parseInt(row.link_clicks) || 0,
      landingPageViews: parseInt(row.landing_page_views) || 0,
      spend: parseFloat(row.spend) || 0,
      revenue: parseFloat(row.revenue) || 0, // Now using real revenue
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
  }

  /**
   * Get client performance summary (all campaigns)
   */
  async getClientPerformanceSummary(
    clientId: string,
    query: MetricsQuery = {}
  ): Promise<ClientPerformanceSummary> {
    const clientResult = await this.pool.query('SELECT name FROM clients WHERE id = $1', [clientId]);

    if (clientResult.rows.length === 0) {
      throw new Error('Client not found');
    }

    const client = clientResult.rows[0];
    const dates = this.getDateRange(query.period || '30d', query.startDate, query.endDate);
    const platform = query.platform;

    const campaignsResult = await this.pool.query(
      'SELECT id, name, platform, budget, status FROM campaigns WHERE "clientId" = $1',
      [clientId]
    );

    const campaigns = campaignsResult.rows as Array<{
      id: string;
      name: string;
      platform: string;
      budget: string | number | null;
      status: string;
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

    const aggregatedResult = await this.pool.query(
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

    const rankingsResult = await this.pool.query(
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

    const dailyResult = await this.pool.query(
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

      const avgCtr = this.calculateCTR(aggregated.totalClicks, aggregated.totalImpressions);
      const avgCpc = this.calculateCPC(aggregated.totalSpend, aggregated.totalClicks);
      const avgCpl = this.calculateCPL(aggregated.totalSpend, aggregated.totalLeads);
      const avgCpa = this.calculateCPA(aggregated.totalSpend, aggregated.totalConversions);
      const roas = this.calculateROAS(aggregated.totalRevenue, aggregated.totalSpend);

      const budget = parseFloat(String(campaign.budget ?? 0)) || 0;
      const budgetUsed = aggregated.totalSpend;
      const budgetRemaining = budget - budgetUsed;
      const budgetUtilization = budget > 0 ? (budgetUsed / budget) * 100 : 0;

      const dailyMetrics = dailyByCampaign.get(campaign.id) ?? [];

      const status = this.determinePerformanceStatus({
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

    const avgCtr = this.calculateCTR(totals.clicks, totals.impressions);
    const avgCpl = this.calculateCPL(totals.spend, totals.leads || totals.conversions);
    const avgCpa = this.calculateCPA(totals.spend, totals.conversions);
    const avgRoas = this.calculateROAS(totals.revenue, totals.spend);

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
        ctr: this.calculateCTR(d.clicks, d.impressions),
        cpc: this.calculateCPC(d.spend, d.clicks),
        cpl: this.calculateCPL(d.spend, d.conversions),
        roas: this.calculateROAS(d.revenue, d.spend),
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
      avgCpm: this.calculateCPM(totals.spend, totals.impressions),
      avgCtr,
      avgCpl,
      avgCpa,
      avgRoas,
      campaigns: campaignsPerformance,
      dailyMetrics: finalDailyMetrics,
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
