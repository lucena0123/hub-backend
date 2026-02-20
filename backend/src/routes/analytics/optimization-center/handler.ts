import { AnalyticsService } from '../../../services/analytics/analytics-service';
import {
  OPTIMIZATION_CENTER_PLAYBOOK_V1,
  getOptimizationTargetsForTheme,
  resolveOptimizationTheme,
} from '../../../services/optimization-playbook';
import { shiftIsoDateUtc, toIsoDateUtc, toStringArray } from '../../../utils';
import { getDaysForPeriod, pickText, safeFloat, safeInt, toJsonStringArray } from './helpers';
import { resolveBudgetAndMinSpend } from './budget';
import { scoreCreatives } from './creative-scoring';
import { evaluateOptimizationCenterRules } from '../../../services/optimization-playbook/optimization-center/engine/registry';
import { evaluateCustomPlaybookRules, type CustomPlaybookRule } from '../../../services/optimization-playbook/optimization-center/engine/custom-rules';
import type { OptimizationSeverity } from './types';

export type OptimizationCenterQuery = {
  period?: string;
  startDate?: string;
  endDate?: string;
  campaignId?: string;
};

export const buildOptimizationCenter = async (params: {
  analytics: AnalyticsService;
  clientId: string;
  query: OptimizationCenterQuery;
}) => {
  const { analytics, clientId, query } = params;
  const { period = '30d', startDate, endDate, campaignId } = query;

  const days = getDaysForPeriod(period);

  const end = endDate || toIsoDateUtc(new Date());
  const start =
    startDate || toIsoDateUtc(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

  const endMinus6 = shiftIsoDateUtc(end, -6);
  const endMinus13 = shiftIsoDateUtc(end, -13);

  // Load per-client threshold overrides
  let clientTargetOverrides: Record<string, unknown> | null = null;
  try {
    clientTargetOverrides = await analytics.getClientOptimizationTargets(clientId);
  } catch (_) {
    // Column may not exist yet (migration not run) — ignore gracefully
  }

  let ruleConfigById: Map<string, { enabled?: boolean; parameters?: any }> | undefined;
  try {
    const ruleConfigs = await analytics.getClientRuleConfigs(clientId);
    ruleConfigById = new Map(
      ruleConfigs.map((cfg) => [cfg.ruleId, { enabled: cfg.enabled, parameters: cfg.parameters }])
    );
  } catch (_) {
    // Non-fatal: if configs aren't available yet, default to all enabled.
  }

  const customRules = (await analytics.getOptimizationPlaybookRules()).filter((rule) => {
    return (
      typeof rule.id === 'string' &&
      typeof rule.title === 'string' &&
      typeof rule.description === 'string' &&
      typeof rule.condition === 'string' &&
      typeof rule.level === 'string' &&
      typeof rule.severity === 'string' &&
      typeof rule.category === 'string' &&
      typeof rule.action === 'string'
    );
  }) as CustomPlaybookRule[];

  const campaignsRows = await analytics.getCampaignOptimizationStats(
    clientId,
    start,
    end,
    endMinus6,
    endMinus13,
    campaignId || null
  );

  const primaryRow = campaignsRows.length > 0 ? (campaignsRows[0] as any) : null;
  const primaryTheme = resolveOptimizationTheme({
    campaignName: primaryRow ? String(primaryRow.campaign_name || '') : '',
    themeKey: primaryRow?.optimization_theme_key ?? null,
    subthemeKey: primaryRow?.optimization_subtheme_key ?? null,
  });
  const targets = getOptimizationTargetsForTheme(primaryTheme.themeKey, clientTargetOverrides);

  const adsetBudgetsByCampaign = new Map<string, { dailyBudget: number; lifetimeBudget: number }>();
  try {
    const adsetBudgetsRows = await analytics.getAdSetBudgets(clientId, campaignId || null);

    for (const row of adsetBudgetsRows) {
      adsetBudgetsByCampaign.set(String(row.campaign_id), {
        dailyBudget: safeFloat(row.daily_budget),
        lifetimeBudget: safeFloat(row.lifetime_budget),
      });
    }
  } catch (_error) {
    // Non-fatal: budget mode discovery falls back to campaign-level budget only.
  }

  const budgetDiagnostics = (campaignsRows as any[]).map((row) => {
    const campaignIdValue = String(row.campaign_id);
    const campaignName = String(row.campaign_name || '');
    const campaignTheme = resolveOptimizationTheme({
      campaignName,
      themeKey: row.optimization_theme_key ?? null,
      subthemeKey: row.optimization_subtheme_key ?? null,
    });
    const campaignTargets = getOptimizationTargetsForTheme(campaignTheme.themeKey, clientTargetOverrides);

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

  const leadTrackingRows = await analytics.getLeadTrackingStats(
    clientId,
    start,
    end,
    endMinus6,
    endMinus13,
    campaignId || null
  );

  const leadTrackingByCampaign = new Map<
    string,
    { recordsLast7: number; qualifiedLast7: number; qualifiedPrev7: number }
  >();
  for (const row of leadTrackingRows) {
    leadTrackingByCampaign.set(String(row.campaign_id), {
      recordsLast7: safeInt(row.tracking_records_last7),
      qualifiedLast7: safeInt(row.qualified_last7),
      qualifiedPrev7: safeInt(row.qualified_prev7),
    });
  }

  const reasonsRows = await analytics.getDisqualificationReasons(
    clientId,
    start,
    end,
    endMinus6,
    campaignId || null
  );

  const reasonsByCampaign = new Map<string, Array<{ key: string; count: number }>>();
  for (const row of reasonsRows) {
    const id = String(row.campaign_id);
    const list = reasonsByCampaign.get(id) ?? [];
    list.push({ key: String(row.reason_key), count: safeInt(row.total_count) });
    reasonsByCampaign.set(id, list);
  }

  const creativeRows = await analytics.getCreativeOptimizationStats(
    clientId,
    start,
    end,
    endMinus6,
    endMinus13,
    campaignId || null
  );

  const creatives = creativeRows.map((row: any) => {
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
      campaignThemeKeys: toStringArray(row.optimization_theme_keys),
      campaignSubthemeKeys: toStringArray(row.optimization_subtheme_keys),
      objectives: toStringArray(row.objectives),
      adNames: toStringArray(row.ad_names),
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

  // Load adset-level stats for adset rules
  let adsetRows: any[] = [];
  const adsetsByCampaign = new Map<string, any[]>();
  try {
    adsetRows = await analytics.getAdSetOptimizationStats(
      clientId, start, end, endMinus6, endMinus13, campaignId || null
    );
    for (const row of adsetRows) {
      const cId = String(row.campaign_id);
      const list = adsetsByCampaign.get(cId) ?? [];
      list.push(row);
      adsetsByCampaign.set(cId, list);
    }
  } catch (_error) {
    // Non-fatal: adset rules simply won't fire if data is unavailable
  }

  const systemItems = evaluateOptimizationCenterRules(
    {
      campaignRows: campaignsRows,
      leadTrackingByCampaign,
      reasonsByCampaign,
      adsetBudgetsByCampaign,
      primaryTheme,
      primaryTargets: targets,
      enrichedCreatives,
      winners,
      targets,
      playbookCopy: {
        preferredCtaTypes: OPTIMIZATION_CENTER_PLAYBOOK_V1.copy?.preferredCtaTypes ?? ['WHATSAPP_MESSAGE', 'SEND_MESSAGE'],
        prohibitedPhrases: OPTIMIZATION_CENTER_PLAYBOOK_V1.copy?.prohibitedPhrases ?? [],
      },
      clientTargetOverrides,
      adsetRows,
      adsetsByCampaign,
    },
    { ruleConfigById }
  );

  const customItems = evaluateCustomPlaybookRules(
    {
      campaignRows: campaignsRows,
      leadTrackingByCampaign,
      reasonsByCampaign,
      adsetBudgetsByCampaign,
      primaryTheme,
      primaryTargets: targets,
      enrichedCreatives,
      winners,
      targets,
      playbookCopy: {
        preferredCtaTypes: OPTIMIZATION_CENTER_PLAYBOOK_V1.copy?.preferredCtaTypes ?? ['WHATSAPP_MESSAGE', 'SEND_MESSAGE'],
        prohibitedPhrases: OPTIMIZATION_CENTER_PLAYBOOK_V1.copy?.prohibitedPhrases ?? [],
      },
      clientTargetOverrides,
      adsetRows,
      adsetsByCampaign,
    },
    customRules,
    { ruleConfigById }
  );

  const items = [...systemItems, ...customItems];

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
      adNames: c.adNames,
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
        adNames: c.adNames,
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
        adNames: c.adNames,
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
