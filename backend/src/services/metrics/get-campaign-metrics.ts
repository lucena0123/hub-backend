import type { Pool } from 'pg';

import type { DailyMetric, MetricsQuery } from '../../types/metrics';
import { getDateRange } from './date-range';

export const getCampaignMetrics = async (
  pool: Pool,
  campaignId: string,
  query: MetricsQuery = {}
): Promise<DailyMetric[]> => {
  const { period = '30d', startDate, endDate, platform } = query;

  const dates = getDateRange(period, startDate, endDate);

  const queryParams: any[] = [campaignId, dates.start, dates.end];
  let platformFilter = '';

  if (platform) {
    queryParams.push(platform);
    platformFilter = 'AND platform = $4';
  }

  const result = await pool.query(
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
    revenue: parseFloat(row.revenue) || 0,
    ctr: parseFloat(row.ctr) || 0,
    cpc: parseFloat(row.cpc) || 0,
    cpl: parseFloat(row.cpl) || 0,
    roas: parseFloat(row.roas) || 0,
  }));
};

