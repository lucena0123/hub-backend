import type { Pool } from 'pg';
import {
  OPTIMIZATION_CENTER_PLAYBOOK_V1,
  getOptimizationTargetsForTheme,
  inferOptimizationTheme,
} from '../../../services/optimization-playbook';
import { shiftIsoDateUtc, toIsoDateUtc, toStringArray } from '../../../utils';
import { getDaysForPeriod, pickText, safeFloat, safeInt, toJsonStringArray } from './helpers';
import { resolveBudgetAndMinSpend } from './budget';
import { scoreCreatives } from './creative-scoring';
import { buildCampaignItems } from './campaign-recommendations';
import { buildCreativeItems } from './creative-recommendations';
import type { OptimizationSeverity } from './types';

export type OptimizationCenterQuery = {
  period?: string;
  startDate?: string;
  endDate?: string;
  campaignId?: string;
};

export const buildOptimizationCenter = async (params: {
  pool: Pool;
  clientId: string;
  query: OptimizationCenterQuery;
}) => {
  const { pool, clientId, query } = params;
  const { period = '30d', startDate, endDate, campaignId } = query;

  const days = getDaysForPeriod(period);

  const end = endDate || toIsoDateUtc(new Date());
  const start =
    startDate || toIsoDateUtc(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

  const endMinus6 = shiftIsoDateUtc(end, -6);
  const endMinus13 = shiftIsoDateUtc(end, -13);


  const campaignsResult = await pool.query(
    `SELECT
      c.id as campaign_id,
      c.name as campaign_name,
      c.status as campaign_status,
      c.platform as platform,
      c.budget as budget,
      COALESCE(SUM(cm.spend), 0) as spend_total,
      COALESCE(SUM(cm.impressions), 0)::int as impressions_total,
      COALESCE(SUM(cm.clicks), 0)::int as clicks_total,
      COALESCE(SUM(cm.conversions), 0)::int as conversions_total,
      COALESCE(SUM(cm.leads), 0)::int as leads_total,
      COALESCE(SUM(cm.messaging_conversations), 0)::int as conversations_total,
      COALESCE(SUM(cm.messaging_first_reply), 0)::int as first_reply_total,
      COALESCE(AVG(cm.frequency), 0) as avg_frequency_total,
      COALESCE(AVG(cm.cpm), 0) as avg_cpm_total,
      COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.spend ELSE 0 END), 0) as spend_last7,
      COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.impressions ELSE 0 END), 0)::int as impressions_last7,
      COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.conversions ELSE 0 END), 0)::int as conversions_last7,
      COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.leads ELSE 0 END), 0)::int as leads_last7,
      COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.messaging_conversations ELSE 0 END), 0)::int as conversations_last7,
      COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.messaging_first_reply ELSE 0 END), 0)::int as first_reply_last7,
      COALESCE(AVG(CASE WHEN cm.date >= $4 THEN cm.frequency ELSE NULL END), 0) as avg_frequency_last7,
      COALESCE(AVG(CASE WHEN cm.date >= $4 THEN cm.cpm ELSE NULL END), 0) as avg_cpm_last7,
      COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.spend ELSE 0 END), 0) as spend_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.impressions ELSE 0 END), 0)::int as impressions_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.conversions ELSE 0 END), 0)::int as conversions_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.leads ELSE 0 END), 0)::int as leads_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.messaging_conversations ELSE 0 END), 0)::int as conversations_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.messaging_first_reply ELSE 0 END), 0)::int as first_reply_prev7,
      COALESCE(AVG(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.frequency ELSE NULL END), 0) as avg_frequency_prev7,
      COALESCE(AVG(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.cpm ELSE NULL END), 0) as avg_cpm_prev7
    FROM campaigns c
    LEFT JOIN campaign_metrics cm ON cm.campaign_id = c.id AND cm.date >= $2 AND cm.date <= $3
    WHERE c."clientId" = $1
      AND ($6::text IS NULL OR c.id = $6)
    GROUP BY c.id, c.name, c.status, c.platform, c.budget
    ORDER BY spend_total DESC`,
    [clientId, start, end, endMinus6, endMinus13, campaignId || null]
  );

  const primaryCampaignName =
    campaignsResult.rows.length > 0 ? String((campaignsResult.rows[0] as any).campaign_name || '') : '';
  const primaryTheme = primaryCampaignName ? inferOptimizationTheme(primaryCampaignName) : inferOptimizationTheme('');
  const targets = getOptimizationTargetsForTheme(primaryTheme.themeKey);

  const adsetBudgetsByCampaign = new Map<string, { dailyBudget: number; lifetimeBudget: number }>();
  try {
    const adsetBudgetsAgg = await pool.query(
      `SELECT
        a.campaign_id,
        COALESCE(SUM(a.daily_budget), 0) as daily_budget,
        COALESCE(SUM(a.lifetime_budget), 0) as lifetime_budget
      FROM adsets a
      JOIN campaigns c ON c.id = a.campaign_id
      WHERE c."clientId" = $1
        AND ($2::text IS NULL OR a.campaign_id = $2)
      GROUP BY a.campaign_id`,
      [clientId, campaignId || null]
    );

    for (const row of adsetBudgetsAgg.rows) {
      adsetBudgetsByCampaign.set(String(row.campaign_id), {
        dailyBudget: safeFloat(row.daily_budget),
        lifetimeBudget: safeFloat(row.lifetime_budget),
      });
    }
  } catch (_error) {
    // Non-fatal: budget mode discovery falls back to campaign-level budget only.
  }

  const budgetDiagnostics = (campaignsResult.rows as any[]).map((row) => {
    const campaignIdValue = String(row.campaign_id);
    const campaignName = String(row.campaign_name || '');
    const campaignTheme = inferOptimizationTheme(campaignName);
    const campaignTargets = getOptimizationTargetsForTheme(campaignTheme.themeKey);

    const campaignBudget = safeFloat(row.budget);
    const spendLast7 = safeFloat(row.spend_last7);
    const adsetBudgets = adsetBudgetsByCampaign.get(campaignIdValue);
    const adsetDailyBudget = safeFloat(adsetBudgets?.dailyBudget);
    const adsetLifetimeBudget = safeFloat(adsetBudgets?.lifetimeBudget);

    const budgetResolution = resolveBudgetAndMinSpend({
      playbookMinSpendForEvaluation: campaignTargets.minSpendForEvaluation,
      campaignBudget,
      spendLast7,
      adsetDailyBudget,
      adsetLifetimeBudget,
    });

    return {
      campaignId: campaignIdValue,
      campaignName,
      themeKey: campaignTheme.themeKey,
      budgetMode: budgetResolution.budgetMode,
      budgetSource: budgetResolution.budgetSource,
      assumedBudgetKind: budgetResolution.assumedBudgetKind,
      campaignBudget,
      adsetDailyBudget,
      adsetLifetimeBudget,
      expectedSpendLast7: budgetResolution.expectedSpendLast7,
      playbookMinSpendForEvaluation: campaignTargets.minSpendForEvaluation,
      minSpendForEvaluation: budgetResolution.minSpendForEvaluation,
    };
  });

  const leadTrackingAgg = await pool.query(
    `SELECT
      lt.campaign_id,
      COUNT(*) FILTER (WHERE lt.date >= $4)::int as tracking_records_last7,
      COALESCE(SUM(CASE WHEN lt.date >= $4 THEN lt.qualified_leads ELSE 0 END), 0)::int as qualified_last7,
      COALESCE(SUM(CASE WHEN lt.date >= $5 AND lt.date < $4 THEN lt.qualified_leads ELSE 0 END), 0)::int as qualified_prev7
    FROM campaign_lead_tracking lt
    JOIN campaigns c ON c.id = lt.campaign_id
    WHERE c."clientId" = $1
      AND lt.date >= $2
      AND lt.date <= $3
      AND ($6::text IS NULL OR lt.campaign_id = $6)
    GROUP BY lt.campaign_id`,
    [clientId, start, end, endMinus6, endMinus13, campaignId || null]
  );

  const leadTrackingByCampaign = new Map<
    string,
    { recordsLast7: number; qualifiedLast7: number; qualifiedPrev7: number }
  >();
  for (const row of leadTrackingAgg.rows) {
    leadTrackingByCampaign.set(String(row.campaign_id), {
      recordsLast7: safeInt(row.tracking_records_last7),
      qualifiedLast7: safeInt(row.qualified_last7),
      qualifiedPrev7: safeInt(row.qualified_prev7),
    });
  }

  const reasonsAgg = await pool.query(
    `SELECT
      lt.campaign_id,
      e.key as reason_key,
      SUM((e.value)::int)::int as total_count
    FROM campaign_lead_tracking lt
    JOIN campaigns c ON c.id = lt.campaign_id
    CROSS JOIN LATERAL jsonb_each_text(COALESCE(lt.disqualification_reasons, '{}'::jsonb)) e(key, value)
    WHERE c."clientId" = $1
      AND lt.date >= $2
      AND lt.date <= $3
      AND lt.date >= $4
      AND ($5::text IS NULL OR lt.campaign_id = $5)
    GROUP BY lt.campaign_id, e.key`,
    [clientId, start, end, endMinus6, campaignId || null]
  );

  const reasonsByCampaign = new Map<string, Array<{ key: string; count: number }>>();
  for (const row of reasonsAgg.rows) {
    const id = String(row.campaign_id);
    const list = reasonsByCampaign.get(id) ?? [];
    list.push({ key: String(row.reason_key), count: safeInt(row.total_count) });
    reasonsByCampaign.set(id, list);
  }

  const creativeQuery = `WITH creative_agg AS (
      SELECT
        m.creative_snapshot_id,
        MAX(m.creative_id) as creative_id,
        array_agg(DISTINCT c.name) as campaigns,
        COUNT(DISTINCT m.ad_id)::int as ads_count,
        COALESCE(SUM(m.spend), 0) as total_spend,
        COALESCE(SUM(m.messaging_conversations), 0)::int as total_conversations,
        COALESCE(AVG(NULLIF(m.hook_rate, 0)), 0) as hook_rate_avg,
        COALESCE(AVG(NULLIF(m.hold_rate, 0)), 0) as hold_rate_avg,
        COALESCE(SUM(CASE WHEN m.date >= $4 THEN m.spend ELSE 0 END), 0) as spend_last7,
        COALESCE(SUM(CASE WHEN m.date >= $4 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_last7,
        COALESCE(SUM(CASE WHEN m.date >= $5 AND m.date < $4 THEN m.spend ELSE 0 END), 0) as spend_prev7,
        COALESCE(SUM(CASE WHEN m.date >= $5 AND m.date < $4 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_prev7
      FROM ad_creative_metrics m
      JOIN campaigns c ON c.id = m.campaign_id
      WHERE c."clientId" = $1
        AND m.date >= $2
        AND m.date <= $3
        AND ($6::text IS NULL OR m.campaign_id = $6)
        AND m.creative_snapshot_id IS NOT NULL
      GROUP BY m.creative_snapshot_id
    )
    SELECT
      a.creative_snapshot_id,
      a.creative_id,
      a.campaigns,
      a.ads_count,
      a.total_spend,
      a.total_conversations,
      a.hook_rate_avg,
      a.hold_rate_avg,
      a.spend_last7,
      a.conv_last7,
      a.spend_prev7,
      a.conv_prev7,
      s.headline as headline,
      s.primary_text as primary_text,
      s.description as description,
      s.cta_type as cta_type,
      s.destination_url as destination_url,
      s.image_url as image_url,
      s.thumbnail_url as thumbnail_url,
      s.video_id as video_id,
      s.format as format,
      COALESCE(s.is_dynamic, false) as is_dynamic,
      s.headlines as headlines,
      s.primary_texts as primary_texts,
      s.descriptions as descriptions,
      s.cta_types as cta_types,
      s.destination_urls as destination_urls,
      cci.status as copy_insights_status,
      cci.updated_at as copy_insights_updated_at
    FROM creative_agg a
    LEFT JOIN ad_creative_snapshots s ON s.id = a.creative_snapshot_id
    LEFT JOIN creative_copy_insights cci ON cci.snapshot_id = a.creative_snapshot_id
    ORDER BY a.total_spend DESC`;

  const creativeQueryFallback = `WITH creative_agg AS (
      SELECT
        m.creative_snapshot_id,
        MAX(m.creative_id) as creative_id,
        array_agg(DISTINCT c.name) as campaigns,
        COUNT(DISTINCT m.ad_id)::int as ads_count,
        COALESCE(SUM(m.spend), 0) as total_spend,
        COALESCE(SUM(m.messaging_conversations), 0)::int as total_conversations,
        COALESCE(AVG(NULLIF(m.hook_rate, 0)), 0) as hook_rate_avg,
        COALESCE(AVG(NULLIF(m.hold_rate, 0)), 0) as hold_rate_avg,
        COALESCE(SUM(CASE WHEN m.date >= $4 THEN m.spend ELSE 0 END), 0) as spend_last7,
        COALESCE(SUM(CASE WHEN m.date >= $4 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_last7,
        COALESCE(SUM(CASE WHEN m.date >= $5 AND m.date < $4 THEN m.spend ELSE 0 END), 0) as spend_prev7,
        COALESCE(SUM(CASE WHEN m.date >= $5 AND m.date < $4 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_prev7
      FROM ad_creative_metrics m
      JOIN campaigns c ON c.id = m.campaign_id
      WHERE c."clientId" = $1
        AND m.date >= $2
        AND m.date <= $3
        AND ($6::text IS NULL OR m.campaign_id = $6)
        AND m.creative_snapshot_id IS NOT NULL
      GROUP BY m.creative_snapshot_id
    )
    SELECT
      a.creative_snapshot_id,
      a.creative_id,
      a.campaigns,
      a.ads_count,
      a.total_spend,
      a.total_conversations,
      a.hook_rate_avg,
      a.hold_rate_avg,
      a.spend_last7,
      a.conv_last7,
      a.spend_prev7,
      a.conv_prev7,
      s.headline as headline,
      s.primary_text as primary_text,
      s.description as description,
      s.cta_type as cta_type,
      s.destination_url as destination_url,
      s.image_url as image_url,
      s.thumbnail_url as thumbnail_url,
      s.video_id as video_id,
      s.format as format,
      COALESCE(s.is_dynamic, false) as is_dynamic,
      s.headlines as headlines,
      s.primary_texts as primary_texts,
      s.descriptions as descriptions,
      s.cta_types as cta_types,
      s.destination_urls as destination_urls,
      NULL::text as copy_insights_status,
      NULL::timestamp as copy_insights_updated_at
    FROM creative_agg a
    LEFT JOIN ad_creative_snapshots s ON s.id = a.creative_snapshot_id
    ORDER BY a.total_spend DESC`;

  const creativeParams = [clientId, start, end, endMinus6, endMinus13, campaignId || null];

  let creativeResult;
  try {
    creativeResult = await pool.query(creativeQuery, creativeParams);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('creative_copy_insights') && message.toLowerCase().includes('does not exist')) {
      creativeResult = await pool.query(creativeQueryFallback, creativeParams);
    } else {
      throw error;
    }
  }


  const creatives = creativeResult.rows.map((row: any) => {
    const totalSpend = safeFloat(row.total_spend);
    const totalConversations = safeInt(row.total_conversations);
    const cpl = totalConversations > 0 ? totalSpend / totalConversations : null;

    const hookRateRaw = safeFloat(row.hook_rate_avg);
    const holdRateRaw = safeFloat(row.hold_rate_avg);
    const hookRateAvg = hookRateRaw > 0 ? Number(hookRateRaw.toFixed(2)) : null;
    const holdRateAvg = holdRateRaw > 0 ? Number(holdRateRaw.toFixed(2)) : null;

    const videoId = typeof row.video_id === 'string' && row.video_id.trim() ? row.video_id.trim() : null;
    const format = typeof row.format === 'string' && row.format.trim() ? row.format.trim() : null;
    const isVideo = Boolean(videoId || (format && format.toLowerCase().includes('video')));

    const spendLast7 = safeFloat(row.spend_last7);
    const convLast7 = safeInt(row.conv_last7);
    const cplLast7 = convLast7 > 0 ? spendLast7 / convLast7 : null;

    const spendPrev7 = safeFloat(row.spend_prev7);
    const convPrev7 = safeInt(row.conv_prev7);
    const cplPrev7 = convPrev7 > 0 ? spendPrev7 / convPrev7 : null;

    const conversationsPct =
      convPrev7 > 0 ? ((convLast7 - convPrev7) / convPrev7) * 100 : null;
    const cplPct = cplPrev7 && cplLast7 ? ((cplLast7 - cplPrev7) / cplPrev7) * 100 : null;

    return {
      snapshotId: String(row.creative_snapshot_id),
      headline: pickText(row.headline, row.headlines),
      primaryText: pickText(row.primary_text, row.primary_texts),
      description: pickText(row.description, row.descriptions),
      headlines: toJsonStringArray(row.headlines),
      primaryTexts: toJsonStringArray(row.primary_texts),
      descriptions: toJsonStringArray(row.descriptions),
      ctaType: row.cta_type || null,
      ctaTypes: toJsonStringArray(row.cta_types),
      destinationUrl: row.destination_url || null,
      destinationUrls: toJsonStringArray(row.destination_urls),
      imageUrl: row.image_url || null,
      thumbnailUrl: row.thumbnail_url || null,
      videoId,
      format,
      isVideo,
      isDynamic: Boolean(row.is_dynamic),
      copyInsightsStatus: row.copy_insights_status || null,
      copyInsightsUpdatedAt: row.copy_insights_updated_at || null,
      campaigns: toStringArray(row.campaigns),
      adsCount: safeInt(row.ads_count),
      metrics: {
        totalSpend,
        totalConversations,
        cpl,
        hookRateAvg,
        holdRateAvg,
      },
      recent: {
        spend: spendLast7,
        conversations: convLast7,
        cpl: cplLast7,
      },
      previous: {
        spend: spendPrev7,
        conversations: convPrev7,
        cpl: cplPrev7,
      },
      deltas: {
        conversationsPct,
        cplPct,
      },
    };
  });

  const { enrichedCreatives, winners } = scoreCreatives(creatives, targets);

  const items = [
    ...buildCampaignItems({
      campaignRows: campaignsResult.rows as any[],
      leadTrackingByCampaign,
      reasonsByCampaign,
      primaryTargets: targets,
      adsetBudgetsByCampaign,
    }),
    ...buildCreativeItems({
      enrichedCreatives,
      winners,
      primaryTheme,
      targets,
    }),
  ];

  const summary = { critical: 0, warning: 0, info: 0, opportunity: 0 };
  for (const item of items) summary[item.severity] += 1;

  items.sort((a, b) => {
    const order: Record<OptimizationSeverity, number> = {
      critical: 0,
      warning: 1,
      opportunity: 2,
      info: 3,
    };
    return order[a.severity] - order[b.severity];
  });

  const highlights = {
    winners: winners.slice(0, 5).map((c: any) => ({
      snapshotId: c.snapshotId,
      headline: c.headline,
      ctaType: c.ctaType,
      thumbnailUrl: c.thumbnailUrl || c.imageUrl || null,
      isDynamic: c.isDynamic,
      spend: c.metrics.totalSpend,
      conversations: c.metrics.totalConversations,
      cpl: c.metrics.cpl ?? null,
    })),
    losers: enrichedCreatives
      .filter((c: any) => c.status === 'loser')
      .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
      .slice(0, 5)
      .map((c: any) => ({
        snapshotId: c.snapshotId,
        headline: c.headline,
        ctaType: c.ctaType,
        thumbnailUrl: c.thumbnailUrl || c.imageUrl || null,
        isDynamic: c.isDynamic,
        spend: c.metrics.totalSpend,
        conversations: c.metrics.totalConversations,
        cpl: c.metrics.cpl ?? null,
      })),
    fatigued: enrichedCreatives
      .filter((c: any) => c.status === 'fatigued')
      .sort((a: any, b: any) => (b.recent.spend || 0) - (a.recent.spend || 0))
      .slice(0, 5)
      .map((c: any) => ({
        snapshotId: c.snapshotId,
        headline: c.headline,
        ctaType: c.ctaType,
        thumbnailUrl: c.thumbnailUrl || c.imageUrl || null,
        isDynamic: c.isDynamic,
        spend: c.metrics.totalSpend,
        conversations: c.metrics.totalConversations,
        cpl: c.metrics.cpl ?? null,
      })),
  };

  return {
    clientId,
    period: { start, end },
    scope: campaignId ? { campaignId } : { clientId },
    generatedAt: new Date().toISOString(),
    playbookVersion: OPTIMIZATION_CENTER_PLAYBOOK_V1.version,
    theme: {
      ...primaryTheme,
      targets,
    },
    budgetDiagnostics,
    summary: { ...summary, total: items.length },
    highlights,
    items,
  };
};
