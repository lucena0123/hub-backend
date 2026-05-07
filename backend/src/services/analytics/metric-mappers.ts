import { resolvePrimaryResult } from '../metrics/primary-result';
import type { AdMetric, AdSetMetric } from './types';

type ObjectiveMeta = {
    optimizationGoal: string | null;
    destinationType: string | null;
    billingEvent: string | null;
};

const parseIntValue = (value: unknown) => parseInt(String(value ?? '')) || 0;
const parseFloatValue = (value: unknown) => parseFloat(String(value ?? '')) || 0;

const readObjectiveMeta = (metadata: Record<string, unknown> | null | undefined): ObjectiveMeta => ({
    optimizationGoal: typeof metadata?.optimizationGoal === 'string' ? metadata.optimizationGoal : null,
    destinationType: typeof metadata?.destinationType === 'string' ? metadata.destinationType : null,
    billingEvent: typeof metadata?.billingEvent === 'string' ? metadata.billingEvent : null,
});

export function mapAdSetMetricRow(
    row: any,
    config: any,
    campaignObjective: string | null | undefined,
): AdSetMetric {
    const spend = parseFloatValue(row.total_spend);
    const conversations = parseIntValue(row.total_messaging_conversations);
    const adsetName = (row.adset_name || config?.adset_name || row.adset_id) as string;
    const objectiveMeta = readObjectiveMeta(config?.metadata);

    const primary = resolvePrimaryResult({
        objective: campaignObjective ?? null,
        objectiveMeta,
        metrics: {
            messagingConversations: conversations,
            leads: parseIntValue(row.total_leads),
            linkClicks: parseIntValue(row.total_link_clicks),
            landingPageViews: parseIntValue(row.total_landing_page_views),
            conversions: parseIntValue(row.total_conversions),
            clicks: parseIntValue(row.total_clicks),
        },
    });
    const totalConversions = primary.value;

    return {
        adsetId: row.adset_id,
        adsetName,
        totalImpressions: parseIntValue(row.total_impressions),
        totalReach: parseIntValue(row.total_reach),
        totalClicks: parseIntValue(row.total_clicks),
        totalLinkClicks: parseIntValue(row.total_link_clicks),
        totalLandingPageViews: parseIntValue(row.total_landing_page_views),
        totalSpend: spend,
        totalConversions,
        totalMessagingConversations: conversations,
        totalMessagingFirstReply: parseIntValue(row.total_messaging_first_reply),
        avgCtr: parseFloatValue(row.avg_ctr),
        avgCpc: parseFloatValue(row.avg_cpc),
        avgCpm: parseFloatValue(row.avg_cpm),
        avgFrequency: parseFloatValue(row.avg_frequency),
        cpl: totalConversions > 0 ? spend / totalConversions : 0,
        status: config?.status ?? null,
        effectiveStatus: config?.effective_status ?? null,
        configuredStatus: config?.metadata?.configuredStatus ?? null,
        dailyBudget: config?.daily_budget != null ? Number(config.daily_budget) : null,
        lifetimeBudget: config?.lifetime_budget != null ? Number(config.lifetime_budget) : null,
        metadata: config?.metadata ?? null,
    };
}

export function mapAdMetricRow(
    row: any,
    adsetMeta: Record<string, unknown> | undefined,
    campaignObjective: string | null | undefined,
): AdMetric {
    const spend = parseFloatValue(row.total_spend);
    const impressions = parseIntValue(row.total_impressions);
    const clicks = parseIntValue(row.total_clicks);
    const conversations = parseIntValue(row.total_messaging_conversations);
    const totalLeads = parseIntValue(row.total_leads);
    const totalPurchases = parseIntValue(row.total_purchases);
    const thruplay = parseIntValue(row.total_thruplay);
    const views3sec = parseIntValue(row.total_3sec_views);
    const objectiveMeta = readObjectiveMeta(adsetMeta);

    const primary = resolvePrimaryResult({
        objective: campaignObjective ?? null,
        objectiveMeta,
        metrics: {
            messagingConversations: conversations,
            leads: totalLeads,
            linkClicks: parseIntValue(row.total_link_clicks),
            landingPageViews: parseIntValue(row.total_landing_page_views),
            purchases: totalPurchases,
            conversions: parseIntValue(row.total_conversions),
            clicks,
        },
    });

    const conversions = primary.value;
    const avgCtr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const avgCpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const creativeSnapshotId = row.creative_snapshot_id || null;

    return {
        adId: row.ad_id,
        adName: row.ad_name,
        adsetId: row.adset_id,
        creativeId: row.creative_id || null,
        creativeSnapshotId,
        creative: creativeSnapshotId
            ? {
                snapshotId: creativeSnapshotId,
                creativeId: row.creative_id || null,
                capturedAt: row.snapshot_captured_at || null,
                headline: row.headline || null,
                primaryText: row.primary_text || null,
                description: row.description || null,
                ctaType: row.cta_type || null,
                destinationUrl: row.destination_url || null,
                imageUrl: row.image_url || null,
                thumbnailUrl: row.thumbnail_url || null,
                videoId: row.video_id || null,
                format: row.format || null,
                isDynamic: Boolean(row.is_dynamic),
                headlines: row.headlines || null,
                primaryTexts: row.primary_texts || null,
                descriptions: row.descriptions || null,
                ctaTypes: row.cta_types || null,
                destinationUrls: row.destination_urls || null,
                objectStorySpec: row.object_story_spec || null,
                assetFeedSpec: row.asset_feed_spec || null,
                raw: row.raw || null,
                visualAttributes: row.visual_attributes || null,
            }
            : null,
        totalImpressions: impressions,
        totalReach: parseIntValue(row.total_reach),
        totalClicks: clicks,
        totalLinkClicks: parseIntValue(row.total_link_clicks),
        totalLandingPageViews: parseIntValue(row.total_landing_page_views),
        totalSpend: spend,
        totalConversions: conversions,
        totalLeads,
        totalPurchases,
        totalMessagingConversations: conversations,
        avgCtr: Number(avgCtr.toFixed(2)),
        avgCpm: Number(avgCpm.toFixed(2)),
        cpl: conversions > 0 ? spend / conversions : 0,
        videoThruplay: thruplay,
        video3secViews: views3sec,
        videoP25: parseIntValue(row.total_p25),
        videoP50: parseIntValue(row.total_p50),
        videoP75: parseIntValue(row.total_p75),
        videoP100: parseIntValue(row.total_p100),
        hookRate: Number((impressions > 0 ? (views3sec / impressions) * 100 : 0).toFixed(2)),
        holdRate: Number((views3sec > 0 ? (thruplay / views3sec) * 100 : 0).toFixed(2)),
    };
}
