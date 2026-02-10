import jsonLogic from 'json-logic-js';
import { getCampaignFacts } from './campaign-facts';
import { percentChange, safeFloat, safeInt } from './helpers';
import type { OptimizationItem, OptimizationRuleContext } from './types';

export type CustomPlaybookRule = {
  id: string;
  title: string;
  description: string;
  condition: string;
  level: 'campaign' | 'creative' | 'adset' | 'qualification' | 'data';
  severity: 'critical' | 'warning' | 'info' | 'opportunity';
  category: 'campaign' | 'creative' | 'adset' | 'qualification' | 'data';
  action: 'review' | 'pause' | 'refresh' | 'scale' | 'track' | 'sync';
  parametersTemplate?: Record<string, unknown> | null;
};

type RuleConfig = { enabled?: boolean; parameters?: Record<string, unknown> | null };

type CustomRuleOptions = {
  ruleConfigById?: Map<string, RuleConfig>;
};

const parseJsonLogic = (condition: string): unknown | null => {
  if (!condition) return null;
  const trimmed = condition.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return null;
  }
};

export const evaluateCustomPlaybookRules = (
  ctx: OptimizationRuleContext,
  rules: CustomPlaybookRule[],
  options?: CustomRuleOptions
): OptimizationItem[] => {
  const items: OptimizationItem[] = [];
  if (!rules.length) return items;

  for (const rule of rules) {
    const config = options?.ruleConfigById?.get(rule.id);
    if (config && config.enabled === false) continue;

    const condition = parseJsonLogic(rule.condition);
    if (!condition) continue;

    const params = config?.parameters ?? rule.parametersTemplate ?? {};

    if (rule.level === 'creative') {
      for (const creative of ctx.enrichedCreatives ?? []) {
        const context = {
          params,
          entity: {
            type: 'creative',
            id: String(creative.snapshotId ?? ''),
            name: creative.headline ?? creative.primaryText ?? null,
            campaignIds: creative.campaigns ?? [],
          },
          theme: {
            keys: creative.campaignThemeKeys ?? [],
            subthemeKeys: creative.campaignSubthemeKeys ?? [],
          },
          attributes: {
            isVideo: Boolean(creative.isVideo),
            isDynamic: Boolean(creative.isDynamic),
            ctaType: creative.ctaType ?? null,
            objectives: creative.objectives ?? [],
            adsCount: creative.adsCount ?? 0,
          },
          metrics: {
            totalSpend: safeFloat(creative.metrics?.totalSpend),
            totalConversations: safeInt(creative.metrics?.totalConversations),
            cpl: creative.metrics?.cpl ?? null,
            hookRateAvg: creative.metrics?.hookRateAvg ?? null,
            holdRateAvg: creative.metrics?.holdRateAvg ?? null,
            spendLast7: safeFloat(creative.recent?.spend),
            conversationsLast7: safeInt(creative.recent?.conversations),
            cplLast7: creative.recent?.cpl ?? null,
            spendPrev7: safeFloat(creative.previous?.spend),
            conversationsPrev7: safeInt(creative.previous?.conversations),
            cplPrev7: creative.previous?.cpl ?? null,
            conversationsDeltaPct: creative.deltas?.conversationsPct ?? null,
            cplDeltaPct: creative.deltas?.cplPct ?? null,
          },
          thresholds: ctx.targets,
        };

        let shouldTrigger = false;
        try {
          shouldTrigger = Boolean(jsonLogic.apply(condition, context));
        } catch (_error) {
          shouldTrigger = false;
        }

        if (!shouldTrigger) continue;

        items.push({
          id: `custom-${rule.id}-creative-${context.entity.id}`,
          ruleId: rule.id,
          severity: rule.severity,
          category: rule.category,
          action: rule.action,
          title: rule.title,
          description: rule.description,
          entity: { type: 'creative', id: context.entity.id, name: context.entity.name },
          thresholds: ctx.targets,
          metrics: context.metrics,
        });
      }

      continue;
    }

    if (rule.level === 'adset') {
      for (const row of ctx.adsetRows ?? []) {
        const adsetId = String(row.adset_id);
        const adsetName = row.adset_name ? String(row.adset_name) : null;

        const spendTotal = safeFloat(row.spend_total);
        const conversationsTotal = safeInt(row.conversations_total);
        const cplTotal = conversationsTotal > 0 ? spendTotal / conversationsTotal : null;

        const spendLast7 = safeFloat(row.spend_last7);
        const conversationsLast7 = safeInt(row.conversations_last7);
        const cplLast7 = conversationsLast7 > 0 ? spendLast7 / conversationsLast7 : null;

        const spendPrev7 = safeFloat(row.spend_prev7);
        const conversationsPrev7 = safeInt(row.conversations_prev7);
        const cplPrev7 = conversationsPrev7 > 0 ? spendPrev7 / conversationsPrev7 : null;

        const context = {
          params,
          entity: {
            type: 'adset',
            id: adsetId,
            name: adsetName,
            campaignId: row.campaign_id ? String(row.campaign_id) : null,
          },
          metrics: {
            spendTotal,
            conversationsTotal,
            impressionsTotal: safeInt(row.impressions_total),
            reachTotal: safeInt(row.reach_total),
            avgFrequency: safeFloat(row.avg_frequency),
            spendLast7,
            conversationsLast7,
            cplLast7,
            spendPrev7,
            conversationsPrev7,
            cplPrev7,
            conversationsDeltaPct: percentChange(conversationsLast7, conversationsPrev7),
            avgFrequencyLast7: safeFloat(row.avg_frequency_last7),
            adCount: safeInt(row.ad_count),
            cplTotal,
          },
          thresholds: ctx.targets,
        };

        let shouldTrigger = false;
        try {
          shouldTrigger = Boolean(jsonLogic.apply(condition, context));
        } catch (_error) {
          shouldTrigger = false;
        }

        if (!shouldTrigger) continue;

        items.push({
          id: `custom-${rule.id}-adset-${adsetId}`,
          ruleId: rule.id,
          severity: rule.severity,
          category: rule.category,
          action: rule.action,
          title: rule.title,
          description: rule.description,
          entity: { type: 'adset', id: adsetId, name: adsetName },
          thresholds: ctx.targets,
          metrics: context.metrics,
        });
      }

      continue;
    }

    // Default: campaign-level (also covers qualification/data)
    for (const row of ctx.campaignRows as any[]) {
      const facts = getCampaignFacts(ctx, row);
      const context = {
        params,
        entity: {
          type: 'campaign',
          id: facts.campaignId,
          name: facts.campaignName,
          status: facts.campaignStatus,
        },
        theme: {
          key: facts.theme.themeKey,
          name: facts.theme.themeName,
          matchedBy: facts.theme.matchedBy,
          matchedValue: facts.theme.matchedValue,
        },
        metrics: {
          spendTotal: facts.spendTotal,
          impressionsTotal: facts.impressionsTotal,
          spendLast7: facts.spendLast7,
          spendPrev7: facts.spendPrev7,
          avgFrequencyLast7: facts.avgFrequencyLast7,
          avgCpmLast7: facts.avgCpmLast7,
          messagingLast7: facts.messagingLast7,
          messagingPrev7: facts.messagingPrev7,
          contactsLast7: facts.contactsLast7,
          contactsPrev7: facts.contactsPrev7,
          costPerContact: facts.costPerContact,
          costPerContactPrev7: facts.costPerContactPrev7,
          contactsDelta: facts.contactsDelta,
          cplChange: facts.cplChange,
          firstReplyLast7: facts.firstReplyLast7,
          firstReplyRate: facts.firstReplyRate,
          leadTrackingRecordsLast7: facts.leadTracking.recordsLast7,
          leadTrackingQualifiedLast7: facts.leadTracking.qualifiedLast7,
          leadTrackingQualifiedPrev7: facts.leadTracking.qualifiedPrev7,
          minSpendForEvaluation: facts.minSpendForEvaluation,
          budget: facts.campaignBudget,
        },
        thresholds: facts.targets,
        attributes: {
          topReasons: facts.topReasons,
        },
      };

      let shouldTrigger = false;
      try {
        shouldTrigger = Boolean(jsonLogic.apply(condition, context));
      } catch (_error) {
        shouldTrigger = false;
      }

      if (!shouldTrigger) continue;

      items.push({
        id: `custom-${rule.id}-campaign-${facts.campaignId}`,
        ruleId: rule.id,
        severity: rule.severity,
        category: rule.category,
        action: rule.action,
        title: rule.title,
        description: rule.description,
        theme: {
          key: facts.theme.themeKey,
          name: facts.theme.themeName,
          matchedBy: facts.theme.matchedBy,
          matchedValue: facts.theme.matchedValue,
        },
        entity: { type: 'campaign', id: facts.campaignId, name: facts.campaignName },
        thresholds: facts.targets,
        metrics: context.metrics,
      });
    }
  }

  return items;
};
