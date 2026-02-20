import type { Pool } from 'pg';

import { getDateRange } from './metrics/date-range';
import { shiftIsoDateUtc } from '../utils/date';

export type BenchmarkInsight = {
  code: 'cpl_above_p75' | 'ctr_below_p25' | 'within_baseline';
  message: string;
  metric: 'cpl' | 'ctr';
  currentValue: number;
  baselineValue: number | null;
};

export type CampaignBenchmark = {
  campaignId: string;
  campaignName: string;
  themeKey: string;
  metrics: { cpl: number | null; ctr: number | null };
  baseline: { cplMedian: number | null; cplP75: number | null; ctrMedian: number | null; ctrP25: number | null };
  insights: BenchmarkInsight[];
};

export type CampaignBenchmarksResponse = {
  clientId: string;
  period: { start: string; end: string };
  baselinePeriod: { start: string; end: string };
  campaigns: CampaignBenchmark[];
};

export type CreativeBenchmarkResponse = {
  snapshotId: string;
  clientId: string;
  themeKey: string;
  period: { start: string; end: string };
  baselinePeriod: { start: string; end: string };
  metrics: { cpl: number | null; ctr: number | null };
  baseline: { cplMedian: number | null; cplP75: number | null; ctrMedian: number | null; ctrP25: number | null };
  insights: BenchmarkInsight[];
};

const DEFAULT_BASELINE_DAYS = 90;

const safeNumber = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildInsights = (metrics: { cpl: number | null; ctr: number | null }, baseline: CampaignBenchmark['baseline']) => {
  const insights: BenchmarkInsight[] = [];

  if (metrics.cpl != null && baseline.cplP75 != null && metrics.cpl > baseline.cplP75) {
    insights.push({
      code: 'cpl_above_p75',
      metric: 'cpl',
      currentValue: metrics.cpl,
      baselineValue: baseline.cplP75,
      message: `CPL atual acima do p75 do cliente (R$ ${baseline.cplP75.toFixed(2)}).`,
    });
  }

  if (metrics.ctr != null && baseline.ctrP25 != null && metrics.ctr < baseline.ctrP25) {
    insights.push({
      code: 'ctr_below_p25',
      metric: 'ctr',
      currentValue: metrics.ctr,
      baselineValue: baseline.ctrP25,
      message: `CTR abaixo do p25 do cliente (${baseline.ctrP25.toFixed(2)}%).`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      code: 'within_baseline',
      metric: 'cpl',
      currentValue: metrics.cpl ?? 0,
      baselineValue: baseline.cplMedian,
      message: 'Performance dentro do baseline do cliente.',
    });
  }

  return insights;
};

export class BenchmarkService {
  constructor(private pool: Pool) {}

  async getCampaignBenchmarks(
    clientId: string,
    query: { period?: string; startDate?: string; endDate?: string; baselineDays?: number }
  ): Promise<CampaignBenchmarksResponse> {
    const period = getDateRange(query.period || '30d', query.startDate, query.endDate);
    const baselineDays = query.baselineDays ?? DEFAULT_BASELINE_DAYS;
    const baselineStart = shiftIsoDateUtc(period.end, -baselineDays);

    const baselineResult = await this.pool.query(
      `WITH campaign_stats AS (
        SELECT
          c.id as campaign_id,
          COALESCE(c.optimization_theme_key, 'geral') as theme_key,
          COALESCE(SUM(cm.spend), 0)::float as spend,
          COALESCE(SUM(cm.impressions), 0)::int as impressions,
          COALESCE(SUM(cm.clicks), 0)::int as clicks,
          COALESCE(SUM(cm.leads), 0)::int as leads,
          COALESCE(SUM(cm.messaging_conversations), 0)::int as messaging,
          COALESCE(SUM(cm.conversions), 0)::int as conversions
        FROM campaign_metrics cm
        JOIN campaigns c ON c.id = cm.campaign_id
        WHERE c."clientId" = $1
          AND cm.date >= $2
          AND cm.date <= $3
        GROUP BY c.id, theme_key
      ),
      campaign_kpis AS (
        SELECT
          theme_key,
          spend,
          impressions,
          clicks,
          CASE
            WHEN leads > 0 THEN leads
            WHEN messaging > 0 THEN messaging
            ELSE conversions
          END as contacts
        FROM campaign_stats
      )
      SELECT
        theme_key,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY CASE WHEN contacts > 0 THEN spend / contacts ELSE NULL END) as cpl_median,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY CASE WHEN contacts > 0 THEN spend / contacts ELSE NULL END) as cpl_p75,
        percentile_cont(0.25) WITHIN GROUP (ORDER BY CASE WHEN impressions > 0 THEN (clicks::float / impressions) * 100 ELSE NULL END) as ctr_p25,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY CASE WHEN impressions > 0 THEN (clicks::float / impressions) * 100 ELSE NULL END) as ctr_median
      FROM campaign_kpis
      WHERE contacts > 0 OR impressions > 0
      GROUP BY theme_key`,
      [clientId, baselineStart, period.end]
    );

    const baselineByTheme = new Map<string, CampaignBenchmark['baseline']>();
    for (const row of baselineResult.rows) {
      baselineByTheme.set(String(row.theme_key), {
        cplMedian: safeNumber(row.cpl_median),
        cplP75: safeNumber(row.cpl_p75),
        ctrMedian: safeNumber(row.ctr_median),
        ctrP25: safeNumber(row.ctr_p25),
      });
    }

    const currentResult = await this.pool.query(
      `SELECT
        c.id as campaign_id,
        c.name as campaign_name,
        COALESCE(c.optimization_theme_key, 'geral') as theme_key,
        COALESCE(SUM(cm.spend), 0)::float as spend,
        COALESCE(SUM(cm.impressions), 0)::int as impressions,
        COALESCE(SUM(cm.clicks), 0)::int as clicks,
        COALESCE(SUM(cm.leads), 0)::int as leads,
        COALESCE(SUM(cm.messaging_conversations), 0)::int as messaging,
        COALESCE(SUM(cm.conversions), 0)::int as conversions
      FROM campaigns c
      LEFT JOIN campaign_metrics cm
        ON cm.campaign_id = c.id
        AND cm.date >= $2
        AND cm.date <= $3
      WHERE c."clientId" = $1
      GROUP BY c.id, c.name, theme_key
      ORDER BY spend DESC`,
      [clientId, period.start, period.end]
    );

    const campaigns: CampaignBenchmark[] = currentResult.rows.map((row: any) => {
      const themeKey = String(row.theme_key ?? 'geral');
      const leads = Number(row.leads) || 0;
      const messaging = Number(row.messaging) || 0;
      const conversions = Number(row.conversions) || 0;
      const contacts = leads > 0 ? leads : messaging > 0 ? messaging : conversions;
      const spend = Number(row.spend) || 0;
      const impressions = Number(row.impressions) || 0;
      const clicks = Number(row.clicks) || 0;
      const cpl = contacts > 0 ? spend / contacts : null;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;

      const baseline = baselineByTheme.get(themeKey) ?? {
        cplMedian: null,
        cplP75: null,
        ctrMedian: null,
        ctrP25: null,
      };

      return {
        campaignId: row.campaign_id,
        campaignName: row.campaign_name,
        themeKey,
        metrics: { cpl, ctr },
        baseline,
        insights: buildInsights({ cpl, ctr }, baseline),
      };
    });

    return {
      clientId,
      period,
      baselinePeriod: { start: baselineStart, end: period.end },
      campaigns,
    };
  }

  async getCreativeBenchmark(
    snapshotId: string,
    query: { period?: string; startDate?: string; endDate?: string; baselineDays?: number }
  ): Promise<CreativeBenchmarkResponse | null> {
    const period = getDateRange(query.period || '30d', query.startDate, query.endDate);
    const baselineDays = query.baselineDays ?? DEFAULT_BASELINE_DAYS;
    const baselineStart = shiftIsoDateUtc(period.end, -baselineDays);

    const metaResult = await this.pool.query(
      `SELECT
        COALESCE(c.optimization_theme_key, 'geral') as theme_key,
        c."clientId" as client_id
       FROM ad_creative_metrics m
       JOIN campaigns c ON c.id = m.campaign_id
       WHERE m.creative_snapshot_id = $1
       ORDER BY m.date DESC
       LIMIT 1`,
      [snapshotId]
    );

    if (!metaResult.rows.length) return null;
    const themeKey = String(metaResult.rows[0].theme_key ?? 'geral');
    const clientId = String(metaResult.rows[0].client_id);

    const currentResult = await this.pool.query(
      `SELECT
        COALESCE(SUM(m.spend), 0)::float as spend,
        COALESCE(SUM(m.messaging_conversations), 0)::int as conversations,
        COALESCE(SUM(m.conversions), 0)::int as conversions,
        COALESCE(SUM(m.impressions), 0)::int as impressions,
        COALESCE(SUM(m.clicks), 0)::int as clicks
       FROM ad_creative_metrics m
       WHERE m.creative_snapshot_id = $1
         AND m.date >= $2
         AND m.date <= $3`,
      [snapshotId, period.start, period.end]
    );

    const currentRow = currentResult.rows[0] ?? {};
    const spend = Number(currentRow.spend) || 0;
    const conversations = Number(currentRow.conversations) || 0;
    const conversions = Number(currentRow.conversions) || 0;
    const contacts = conversations > 0 ? conversations : conversions;
    const impressions = Number(currentRow.impressions) || 0;
    const clicks = Number(currentRow.clicks) || 0;
    const cpl = contacts > 0 ? spend / contacts : null;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;

    const baselineResult = await this.pool.query(
      `WITH creative_stats AS (
        SELECT
          m.creative_snapshot_id,
          COALESCE(c.optimization_theme_key, 'geral') as theme_key,
          COALESCE(SUM(m.spend), 0)::float as spend,
          COALESCE(SUM(m.messaging_conversations), 0)::int as conversations,
          COALESCE(SUM(m.conversions), 0)::int as conversions,
          COALESCE(SUM(m.impressions), 0)::int as impressions,
          COALESCE(SUM(m.clicks), 0)::int as clicks
        FROM ad_creative_metrics m
        JOIN campaigns c ON c.id = m.campaign_id
        WHERE c."clientId" = $1
          AND m.date >= $2
          AND m.date <= $3
          AND COALESCE(c.optimization_theme_key, 'geral') = $4
        GROUP BY m.creative_snapshot_id, theme_key
      ),
      creative_kpis AS (
        SELECT
          spend,
          impressions,
          clicks,
          CASE WHEN conversations > 0 THEN conversations ELSE conversions END as contacts
        FROM creative_stats
      )
      SELECT
        percentile_cont(0.5) WITHIN GROUP (ORDER BY CASE WHEN contacts > 0 THEN spend / contacts ELSE NULL END) as cpl_median,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY CASE WHEN contacts > 0 THEN spend / contacts ELSE NULL END) as cpl_p75,
        percentile_cont(0.25) WITHIN GROUP (ORDER BY CASE WHEN impressions > 0 THEN (clicks::float / impressions) * 100 ELSE NULL END) as ctr_p25,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY CASE WHEN impressions > 0 THEN (clicks::float / impressions) * 100 ELSE NULL END) as ctr_median
      FROM creative_kpis`,
      [clientId, baselineStart, period.end, themeKey]
    );

    const baselineRow = baselineResult.rows[0] ?? {};
    const baseline = {
      cplMedian: safeNumber(baselineRow.cpl_median),
      cplP75: safeNumber(baselineRow.cpl_p75),
      ctrMedian: safeNumber(baselineRow.ctr_median),
      ctrP25: safeNumber(baselineRow.ctr_p25),
    };

    return {
      snapshotId,
      clientId,
      themeKey,
      period,
      baselinePeriod: { start: baselineStart, end: period.end },
      metrics: { cpl, ctr },
      baseline,
      insights: buildInsights({ cpl, ctr }, baseline),
    };
  }
}
