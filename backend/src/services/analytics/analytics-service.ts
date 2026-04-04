import { PrismaClient } from '@prisma/client';
import { resolvePrimaryResult } from '../metrics/primary-result';

export interface BreakdownSegment {
    label: string;
    impressions: number;
    clicks: number;
    spend: number;
    reach: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpm: number;
    conversionRate: number;
    shareOfSpend: number;
}

export interface BusinessMetrics {
    campaignId: string;
    totalSpend: number;
    totalConversations: number;
    totalContracts: number;
    totalRevenue: number;
    avgTicket: number;
    cac: number;
    costPerLead: number;
    conversionRate: number;
    ltv: number;
    ltvCacRatio: number;
    ltvCacHealth: 'excellent' | 'good' | 'fair' | 'poor';
    roi: number;
    config: {
        lifetimeMonths: number;
        monthlyRevenue: number;
    };
}

export interface AdSetMetric {
  adsetId: string;
  adsetName: string;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalLinkClicks: number;
  totalLandingPageViews: number;
  totalSpend: number;
  totalConversions: number;
  totalMessagingConversations: number;
  totalMessagingFirstReply: number;
  avgCtr: number;
  avgCpc: number;
  avgCpm: number;
  avgFrequency: number;
  cpl: number;
  status?: string | null;
  effectiveStatus?: string | null;
  configuredStatus?: string | null;
  dailyBudget?: number | null;
  lifetimeBudget?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface AdMetric {
    adId: string;
    adName: string;
    adsetId: string;
    creativeId: string | null;
    creativeSnapshotId: string | null;
    creative: any | null; // Typed loosely for now due to complex json structure potential
    totalImpressions: number;
    totalReach: number;
    totalClicks: number;
    totalLinkClicks: number;
    totalLandingPageViews: number;
    totalSpend: number;
    totalConversions: number;
    totalLeads?: number;
    totalPurchases?: number;
    totalMessagingConversations: number;
    avgCtr: number;
    avgCpm: number;
    cpl: number;
    videoThruplay: number;
    video3secViews: number;
    videoP25: number;
    videoP50: number;
    videoP75: number;
    videoP100: number;
    hookRate: number;
    holdRate: number;
}

export interface TemporalAnalysisConfig {
    dayOfWeek: number;
    dayName: string;
    totalImpressions: number;
    totalClicks: number;
    totalSpend: number;
    totalConversions: number;
    totalConversations: number;
    avgCtr: number;
    avgCpm: number;
    cpl: number;
    daysCount: number;
}

export interface CreativeSnapshot {
    snapshotId: string;
    creativeId: string;
    platform: string;
    contentHash: string;
    capturedAt: string;
    lastSeenAt: string;
    headline: string | null;
    primaryText: string | null;
    description: string | null;
    ctaType: string | null;
    destinationUrl: string | null;
    imageUrl: string | null;
    thumbnailUrl: string | null;
    videoId: string | null;
    format: string | null;
    isDynamic: boolean;
    headlines: string[] | null;
    primaryTexts: string[] | null;
    descriptions: string[] | null;
    ctaTypes: string[] | null;
    destinationUrls: string[] | null;
    objectStorySpec: any | null;
    assetFeedSpec: any | null;
    visualAttributes: any | null;
}

export interface AdSetNameRow {
    adset_id: string;
    adset_name: string | null;
}

export interface CopyInsight {
    snapshotId: string;
    themeKey: string | null;
    themeName: string | null;
    status: string;
    model: string | null;
    promptId: string | null;
    promptVersion: string | null;
    analysis: any | null;
    errorMessage: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

export class AnalyticsService {
    constructor(private prisma: PrismaClient) { }

    async getBreakdowns(
        campaignId: string,
        type: string,
        start: string,
        end: string
    ): Promise<{
        campaignId: string;
        breakdownType: string;
        total: number;
        segments: BreakdownSegment[];
    }> {
        // We use $queryRawUnsafe because 'type' (table column/value) might be dynamic in the WHERE clause or SELECT
        // But here 'type' is a value in the 'breakdown_type' column.
        // The query selects from 'metrics_breakdowns' which seems to be a table NOT in schema.prisma?
        // Wait, let's check schema.prisma. 'metrics_breakdowns' is NOT in the schema provided in previous context.
        // CONSTANT CHECK: schema.prisma (Step 1123) does NOT have 'metrics_breakdowns'.
        // It seems 'metrics_breakdowns' exists in the DB (Postgres) but not in Prisma Schema.
        // We must use $queryRaw to access it.

        const result = await this.prisma.$queryRaw<any[]>`
        SELECT breakdown_data, date, total_spend, total_impressions, total_conversions
         FROM metrics_breakdowns
         WHERE campaign_id = ${campaignId} AND breakdown_type = ${type} AND date >= ${new Date(start)} AND date <= ${new Date(end)}
         ORDER BY date DESC
    `;

        const segmentMap = new Map<
            string,
            { label: string; impressions: number; clicks: number; spend: number; reach: number; conversions: number }
        >();

        for (const row of result) {
            const segments = typeof row.breakdown_data === 'string' ? JSON.parse(row.breakdown_data) : row.breakdown_data;
            for (const seg of segments) {
                const key = seg.label || 'unknown';
                const existing = segmentMap.get(key) || {
                    label: seg.label || key,
                    impressions: 0,
                    clicks: 0,
                    spend: 0,
                    reach: 0,
                    conversions: 0,
                };

                existing.impressions += Number(seg.impressions) || 0;
                existing.clicks += Number(seg.clicks) || 0;
                existing.spend += Number(seg.spend) || 0;
                existing.reach += Number(seg.reach) || 0;
                const conversions = Number(
                    (seg.conversions ?? seg.messaging_conversations) ?? 0
                ) || 0;
                existing.conversions += conversions;

                segmentMap.set(key, existing);
            }
        }

        const segments = Array.from(segmentMap.values()).map((seg) => ({
            ...seg,
            ctr: seg.impressions > 0 ? (seg.clicks / seg.impressions) * 100 : 0,
            cpc: seg.clicks > 0 ? seg.spend / seg.clicks : 0,
            cpm: seg.impressions > 0 ? (seg.spend / seg.impressions) * 1000 : 0,
            conversionRate: seg.clicks > 0 ? (seg.conversions / seg.clicks) * 100 : 0,
            shareOfSpend: 0,
        }));

        const totalSpend = segments.reduce((s, seg) => s + seg.spend, 0);
        for (const seg of segments) {
            seg.shareOfSpend = totalSpend > 0 ? (seg.spend / totalSpend) * 100 : 0;
        }

        return {
            campaignId,
            breakdownType: type,
            total: segments.length,
            segments,
        };
    }

    async getBusinessMetrics(
        campaignId: string,
        start: string,
        end: string
    ): Promise<BusinessMetrics> {
        // 1. Campaign Metrics (Spend, Conversions)
        const metricsResult = await this.prisma.$queryRaw<any[]>`
        SELECT SUM(spend) as total_spend, SUM(conversions) as total_conversions,
                SUM(messaging_conversations) as total_conversations
         FROM campaign_metrics
         WHERE campaign_id = ${campaignId} AND date >= ${new Date(start)} AND date <= ${new Date(end)}
    `;

        const totalSpend = parseFloat(metricsResult[0]?.total_spend) || 0;
        const totalConversations = parseInt(metricsResult[0]?.total_conversations) || 0;

        // 2. Lead Tracking (Contracts, Revenue)
        // Table 'campaign_lead_tracking' is likely NOT in prisma schema either based on previous check, 
        // or I missed it. Assuming it's in DB but not schema, using queryRaw.
        const leadResult = await this.prisma.$queryRaw<any[]>`
        SELECT SUM(contracts_closed) as total_contracts,
                SUM(revenue_generated) as total_revenue,
                AVG(average_ticket) as avg_ticket
         FROM campaign_lead_tracking
         WHERE campaign_id = ${campaignId} AND date >= ${new Date(start)} AND date <= ${new Date(end)}
    `;

        const totalContracts = parseInt(leadResult[0]?.total_contracts) || 0;
        const totalRevenue = parseFloat(leadResult[0]?.total_revenue) || 0;
        const avgTicket = parseFloat(leadResult[0]?.avg_ticket) || 0;

        // 3. Campaign & Client Info regarding Lifetime Value
        // We can use Prisma Client for this as Campaign/Client are in schema
        // But original query made a join. Let's stick to Prisma for this part if possible
        // "SELECT c.avg_client_lifetime_months... FROM campaigns JOIN clients ..."


        // Note: Client model in schema.prisma (Step 1123) DOES NOT have 'avg_client_lifetime_months' or 'avg_monthly_revenue_per_client'
        // This means the Client table in Postgres has columns that are NOT in schema.prisma. 
        // We CANNOT use prisma.campaign.findUnique to get these fields if they aren't in the model.
        // We MUST use $queryRaw to access these unmapped columns.

        const campaignResult = await this.prisma.$queryRaw<any[]>`
          SELECT c.avg_client_lifetime_months, c.avg_monthly_revenue_per_client
          FROM campaigns camp
          JOIN clients c ON camp."clientId" = c.id
          WHERE camp.id = ${campaignId}
    `;

        const lifetimeMonths = parseFloat(campaignResult[0]?.avg_client_lifetime_months) || 12;
        const monthlyRevenue = parseFloat(campaignResult[0]?.avg_monthly_revenue_per_client) || avgTicket;

        const cac = totalContracts > 0 ? totalSpend / totalContracts : 0;
        const ltv = monthlyRevenue * lifetimeMonths;
        const ltvCacRatio = cac > 0 ? ltv / cac : 0;
        const costPerLead = totalConversations > 0 ? totalSpend / totalConversations : 0;
        const conversionRate = totalConversations > 0 ? (totalContracts / totalConversations) * 100 : 0;
        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

        let ltvCacHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
        if (ltvCacRatio >= 5) ltvCacHealth = 'excellent';
        else if (ltvCacRatio >= 3) ltvCacHealth = 'good';
        else if (ltvCacRatio >= 2) ltvCacHealth = 'fair';

        return {
            campaignId,
            totalSpend,
            totalConversations,
            totalContracts,
            totalRevenue,
            avgTicket,
            cac,
            costPerLead,
            conversionRate,
            ltv,
            ltvCacRatio: Number(ltvCacRatio.toFixed(2)),
            ltvCacHealth,
            roi: Number(roi.toFixed(2)),
            config: {
                lifetimeMonths,
                monthlyRevenue,
            },
        };
    }

      async getAdSetMetrics(
          campaignId: string,
          start: string,
          end: string
      ): Promise<{ campaignId: string; total: number; adsets: AdSetMetric[] }> {
          const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { objective: true },
          });

          const result = await this.prisma.$queryRaw<any[]>`
          SELECT
            adset_id,
            adset_name,
            SUM(impressions) as total_impressions,
            SUM(reach) as total_reach,
            SUM(clicks) as total_clicks,
            SUM(link_clicks) as total_link_clicks,
            SUM(landing_page_views) as total_landing_page_views,
            SUM(spend) as total_spend,
            SUM(conversions) as total_conversions,
            SUM(leads) as total_leads,
            SUM(messaging_conversations) as total_messaging_conversations,
            SUM(messaging_first_reply) as total_messaging_first_reply,
            AVG(ctr) as avg_ctr,
            AVG(cpc) as avg_cpc,
            AVG(cpm) as avg_cpm,
            AVG(frequency) as avg_frequency
          FROM adset_metrics
          WHERE campaign_id = ${campaignId} AND date >= ${start}::date AND date <= ${end}::date
          GROUP BY adset_id, adset_name
          ORDER BY total_spend DESC
      `;

          const configRows = await this.prisma.$queryRaw<any[]>`
            SELECT
              adset_id,
              adset_name,
              status,
              effective_status,
              daily_budget,
              lifetime_budget,
              metadata
            FROM adsets
            WHERE campaign_id = ${campaignId}
          `;

          const configByAdset = new Map<string, any>();
          configRows.forEach((row: any) => {
            configByAdset.set(String(row.adset_id), row);
          });
  
          const adsets = result.map((row: any) => {
              const spend = parseFloat(row.total_spend) || 0;
              const conversations = parseInt(row.total_messaging_conversations) || 0;
              const config = configByAdset.get(String(row.adset_id));
              const adsetName = (row.adset_name || config?.adset_name || row.adset_id) as string;
              const optimizationGoal =
                typeof config?.metadata?.optimizationGoal === 'string' ? config.metadata.optimizationGoal : null;
              const destinationType =
                typeof config?.metadata?.destinationType === 'string' ? config.metadata.destinationType : null;
              const billingEvent =
                typeof config?.metadata?.billingEvent === 'string' ? config.metadata.billingEvent : null;

              const primary = resolvePrimaryResult({
                objective: campaign?.objective ?? null,
                objectiveMeta: { optimizationGoal, destinationType, billingEvent },
                metrics: {
                  messagingConversations: conversations,
                  leads: parseInt(row.total_leads) || 0,
                  linkClicks: parseInt(row.total_link_clicks) || 0,
                  landingPageViews: parseInt(row.total_landing_page_views) || 0,
                  conversions: parseInt(row.total_conversions) || 0,
                  clicks: parseInt(row.total_clicks) || 0,
                },
              });
              const totalConversions = primary.value;
              const cpl = totalConversions > 0 ? spend / totalConversions : 0;
  
              return {
                  adsetId: row.adset_id,
                  adsetName,
                  totalImpressions: parseInt(row.total_impressions) || 0,
                  totalReach: parseInt(row.total_reach) || 0,
                  totalClicks: parseInt(row.total_clicks) || 0,
                  totalLinkClicks: parseInt(row.total_link_clicks) || 0,
                  totalLandingPageViews: parseInt(row.total_landing_page_views) || 0,
                  totalSpend: spend,
                  totalConversions,
                  totalMessagingConversations: conversations,
                  totalMessagingFirstReply: parseInt(row.total_messaging_first_reply) || 0,
                  avgCtr: parseFloat(row.avg_ctr) || 0,
                  avgCpc: parseFloat(row.avg_cpc) || 0,
                  avgCpm: parseFloat(row.avg_cpm) || 0,
                  avgFrequency: parseFloat(row.avg_frequency) || 0,
                  cpl,
                  status: config?.status ?? null,
                  effectiveStatus: config?.effective_status ?? null,
                  configuredStatus: config?.metadata?.configuredStatus ?? null,
                  dailyBudget: config?.daily_budget != null ? Number(config.daily_budget) : null,
                  lifetimeBudget: config?.lifetime_budget != null ? Number(config.lifetime_budget) : null,
                  metadata: config?.metadata ?? null,
              };
          });
  
          return { campaignId, total: adsets.length, adsets };
      }

    async getAdMetrics(
        campaignId: string,
        start: string,
        end: string
    ): Promise<{ campaignId: string; total: number; ads: AdMetric[] }> {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { objective: true },
        });

        const adsetMetaRows = await this.prisma.$queryRaw<any[]>`
        SELECT adset_id, metadata
         FROM adsets
         WHERE campaign_id = ${campaignId}
    `;

        const adsetMetaById = new Map<string, Record<string, unknown>>();
        adsetMetaRows.forEach((row) => {
            if (!row?.adset_id) return;
            if (row?.metadata && typeof row.metadata === 'object') {
                adsetMetaById.set(String(row.adset_id), row.metadata);
            }
        });

        const result = await this.prisma.$queryRaw<any[]>`
        SELECT
          m.ad_id,
          m.ad_name,
          m.adset_id,
          m.creative_id,
          m.creative_snapshot_id,
          s.headline,
          s.primary_text,
          s.description,
          s.cta_type,
          s.destination_url,
          s.image_url,
          s.thumbnail_url,
          s.video_id,
          s.format,
          s.is_dynamic,
          s.headlines,
          s.primary_texts,
          s.descriptions,
          s.cta_types,
          s.destination_urls,
          s.object_story_spec,
          s.asset_feed_spec,
          s.raw,
          s.visual_attributes,
          s.captured_at as snapshot_captured_at,
          m.total_impressions,
          m.total_reach,
          m.total_clicks,
          m.total_link_clicks,
          m.total_landing_page_views,
          m.total_spend,
          m.total_conversions,
          m.total_leads,
          m.total_purchases,
          m.total_messaging_conversations,
          m.avg_ctr,
          m.avg_cpm,
          m.total_thruplay,
          m.total_3sec_views,
          m.total_p25,
          m.total_p50,
          m.total_p75,
          m.total_p100
        FROM (
          SELECT
            ad_id,
            ad_name,
            adset_id,
            creative_id,
            creative_snapshot_id,
            SUM(impressions) as total_impressions,
            SUM(reach) as total_reach,
            SUM(clicks) as total_clicks,
            SUM(link_clicks) as total_link_clicks,
            SUM(landing_page_views) as total_landing_page_views,
            SUM(spend) as total_spend,
            SUM(conversions) as total_conversions,
            SUM(COALESCE((metadata->>'leads')::int, 0)) as total_leads,
            SUM(COALESCE((metadata->>'purchases')::int, 0)) as total_purchases,
            SUM(messaging_conversations) as total_messaging_conversations,
            AVG(ctr) as avg_ctr,
            AVG(cpm) as avg_cpm,
            SUM(video_thruplay) as total_thruplay,
            SUM(video_3sec_views) as total_3sec_views,
            SUM(video_p25) as total_p25,
            SUM(video_p50) as total_p50,
            SUM(video_p75) as total_p75,
            SUM(video_p100) as total_p100
          FROM ad_creative_metrics
          WHERE campaign_id = ${campaignId} AND date >= ${new Date(start)} AND date <= ${new Date(end)}
          GROUP BY ad_id, ad_name, adset_id, creative_id, creative_snapshot_id
        ) m
        LEFT JOIN ad_creative_snapshots s ON s.id = m.creative_snapshot_id
        ORDER BY m.total_spend DESC
    `;

        const ads = result.map((row: any) => {
            const spend = parseFloat(row.total_spend) || 0;
            const impressions = parseInt(row.total_impressions) || 0;
            const clicks = parseInt(row.total_clicks) || 0;
            const conversations = parseInt(row.total_messaging_conversations) || 0;
            const totalLeads = parseInt(row.total_leads) || 0;
            const totalPurchases = parseInt(row.total_purchases) || 0;
            const thruplay = parseInt(row.total_thruplay) || 0;
            const views3sec = parseInt(row.total_3sec_views) || 0;
            const hookRate = impressions > 0 ? (views3sec / impressions) * 100 : 0;
            const holdRate = views3sec > 0 ? (thruplay / views3sec) * 100 : 0;
            const adsetMeta = adsetMetaById.get(String(row.adset_id));
            const optimizationGoal =
                typeof adsetMeta?.optimizationGoal === 'string' ? adsetMeta.optimizationGoal : null;
            const destinationType =
                typeof adsetMeta?.destinationType === 'string' ? adsetMeta.destinationType : null;
            const billingEvent =
                typeof adsetMeta?.billingEvent === 'string' ? adsetMeta.billingEvent : null;

            const primary = resolvePrimaryResult({
                objective: campaign?.objective ?? null,
                objectiveMeta: { optimizationGoal, destinationType, billingEvent },
                metrics: {
                    messagingConversations: conversations,
                    leads: totalLeads,
                    linkClicks: parseInt(row.total_link_clicks) || 0,
                    landingPageViews: parseInt(row.total_landing_page_views) || 0,
                    purchases: totalPurchases,
                    conversions: parseInt(row.total_conversions) || 0,
                    clicks,
                },
            });

            const conversions = primary.value;
            const cpl = conversions > 0 ? spend / conversions : 0;
            const avgCtr = impressions > 0 ? (clicks / impressions) * 100 : 0;
            const avgCpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

            const creativeSnapshotId = row.creative_snapshot_id || null;
            const creative = creativeSnapshotId
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
                : null;

            return {
                adId: row.ad_id,
                adName: row.ad_name,
                adsetId: row.adset_id,
                creativeId: row.creative_id || null,
                creativeSnapshotId,
                creative,
                totalImpressions: impressions,
                totalReach: parseInt(row.total_reach) || 0,
                totalClicks: clicks,
                totalLinkClicks: parseInt(row.total_link_clicks) || 0,
                totalLandingPageViews: parseInt(row.total_landing_page_views) || 0,
                totalSpend: spend,
                totalConversions: conversions,
                totalLeads,
                totalPurchases,
                totalMessagingConversations: conversations,
                avgCtr: Number(avgCtr.toFixed(2)),
                avgCpm: Number(avgCpm.toFixed(2)),
                cpl,
                videoThruplay: thruplay,
                video3secViews: views3sec,
                videoP25: parseInt(row.total_p25) || 0,
                videoP50: parseInt(row.total_p50) || 0,
                videoP75: parseInt(row.total_p75) || 0,
                videoP100: parseInt(row.total_p100) || 0,
                hookRate: Number(hookRate.toFixed(2)),
                holdRate: Number(holdRate.toFixed(2)),
            };
        });

        return { campaignId, total: ads.length, ads };
    }

    async getTemporalAnalysis(
        campaignId: string,
        start: string,
        end: string
    ): Promise<{
        campaignId: string;
        byDayOfWeek: TemporalAnalysisConfig[];
        bestDay: string | null;
        worstDay: string | null;
        cheapestDay: string | null;
        mostExpensiveDay: string | null;
    }> {
        const dowResult = await this.prisma.$queryRaw<any[]>`
        SELECT
          EXTRACT(DOW FROM date) as day_of_week,
          SUM(impressions) as total_impressions,
          SUM(clicks) as total_clicks,
          SUM(spend) as total_spend,
          SUM(conversions) as total_conversions,
          SUM(messaging_conversations) as total_conversations,
          AVG(ctr) as avg_ctr,
          AVG(cpm) as avg_cpm,
          COUNT(*) as days_count
        FROM campaign_metrics
        WHERE campaign_id = ${campaignId} AND date >= ${new Date(start)} AND date <= ${new Date(end)}
        GROUP BY EXTRACT(DOW FROM date)
        ORDER BY EXTRACT(DOW FROM date)
    `;

        const dayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

        const byDayOfWeek = dowResult.map((row: any) => {
            const dow = parseInt(row.day_of_week);
            const spend = parseFloat(row.total_spend) || 0;
            const conversations = parseInt(row.total_conversations) || 0;
            const cpl = conversations > 0 ? spend / conversations : 0;

            return {
                dayOfWeek: dow,
                dayName: dayNames[dow],
                totalImpressions: parseInt(row.total_impressions) || 0,
                totalClicks: parseInt(row.total_clicks) || 0,
                totalSpend: spend,
                totalConversions: parseInt(row.total_conversions) || 0,
                totalConversations: conversations,
                avgCtr: parseFloat(row.avg_ctr) || 0,
                avgCpm: parseFloat(row.avg_cpm) || 0,
                cpl,
                daysCount: parseInt(row.days_count) || 0,
            };
        });

        const sortedByConversions = [...byDayOfWeek].sort((a, b) => b.totalConversations - a.totalConversations);
        const sortedByCpl = [...byDayOfWeek].filter((d) => d.cpl > 0).sort((a, b) => a.cpl - b.cpl);

        return {
            campaignId,
            byDayOfWeek,
            bestDay: sortedByConversions[0]?.dayName || null,
            worstDay: sortedByConversions[sortedByConversions.length - 1]?.dayName || null,
            cheapestDay: sortedByCpl[0]?.dayName || null,
            mostExpensiveDay: sortedByCpl[sortedByCpl.length - 1]?.dayName || null,
        };
    }

    async getCreativeSnapshot(snapshotId: string): Promise<CreativeSnapshot | null> {
        const result = await this.prisma.$queryRaw<any[]>`
        SELECT
          id,
          creative_id,
          platform,
          content_hash,
          captured_at,
          last_seen_at,
          headline,
          primary_text,
          description,
          cta_type,
          destination_url,
          image_url,
          thumbnail_url,
          video_id,
          format,
          is_dynamic,
          headlines,
          primary_texts,
          descriptions,
          cta_types,
          destination_urls,
          object_story_spec,
          asset_feed_spec,
          visual_attributes
        FROM ad_creative_snapshots
        WHERE id = ${snapshotId}
        LIMIT 1
    `;

        if (result.length === 0) {
            return null;
        }

        const row = result[0];
        return {
            snapshotId: row.id,
            creativeId: row.creative_id,
            platform: row.platform,
            contentHash: row.content_hash,
            capturedAt: row.captured_at,
            lastSeenAt: row.last_seen_at,
            headline: row.headline,
            primaryText: row.primary_text,
            description: row.description,
            ctaType: row.cta_type,
            destinationUrl: row.destination_url,
            imageUrl: row.image_url,
            thumbnailUrl: row.thumbnail_url,
            videoId: row.video_id,
            format: row.format,
            isDynamic: Boolean(row.is_dynamic),
            headlines: row.headlines,
            primaryTexts: row.primary_texts,
            descriptions: row.descriptions,
            ctaTypes: row.cta_types,
            destinationUrls: row.destination_urls,
            objectStorySpec: row.object_story_spec,
            assetFeedSpec: row.asset_feed_spec,
            visualAttributes: row.visual_attributes ?? null,
        };
    }

    async listCreativeSnapshots(
        creativeId: string,
        limit: number
    ): Promise<{ creativeId: string; total: number; snapshots: Partial<CreativeSnapshot>[] }> {
        const result = await this.prisma.$queryRaw<any[]>`
        SELECT
          id,
          creative_id,
          platform,
          content_hash,
          captured_at,
          last_seen_at,
          headline,
          primary_text,
          description,
          cta_type,
          destination_url,
          image_url,
          thumbnail_url,
          video_id,
          format,
          is_dynamic
        FROM ad_creative_snapshots
        WHERE creative_id = ${creativeId}
        ORDER BY captured_at DESC
        LIMIT ${limit}
    `;

        const snapshots = result.map((row: any) => ({
            snapshotId: row.id,
            creativeId: row.creative_id,
            platform: row.platform,
            contentHash: row.content_hash,
            capturedAt: row.captured_at,
            lastSeenAt: row.last_seen_at,
            headline: row.headline,
            primaryText: row.primary_text,
            description: row.description,
            ctaType: row.cta_type,
            destinationUrl: row.destination_url,
            imageUrl: row.image_url,
            thumbnailUrl: row.thumbnail_url,
            videoId: row.video_id,
            format: row.format,
            isDynamic: Boolean(row.is_dynamic),
        }));

        return { creativeId, total: snapshots.length, snapshots };
    }

    async getAdSetNames(
        clientId: string,
        start: string,
        end: string,
        campaignId?: string | null
    ): Promise<AdSetNameRow[]> {
        const result = await this.prisma.$queryRaw<AdSetNameRow[]>`
        SELECT
          a.adset_id,
          MAX(a.adset_name) as adset_name
        FROM adset_metrics a
        JOIN campaigns c ON c.id = a.campaign_id
        WHERE c."clientId" = ${clientId}
          AND a.date >= ${new Date(start)}
          AND a.date <= ${new Date(end)}
          AND (${campaignId || null}::text IS NULL OR a.campaign_id = ${campaignId || null})
        GROUP BY a.adset_id
    `;
        return result;
    }

    async getCreativeLibraryStats(
        clientId: string,
        start: string,
        end: string,
        endMinus6: string,
        endMinus13: string,
        campaignId?: string | null
    ): Promise<any[]> {
        const result = await this.prisma.$queryRaw<any[]>`
        WITH creative_agg AS (
          SELECT
            m.creative_snapshot_id,
            MAX(m.creative_id) as creative_id,
            array_agg(DISTINCT c.name) as campaigns,
            array_agg(DISTINCT c.optimization_theme_key) FILTER (WHERE c.optimization_theme_key IS NOT NULL) as optimization_theme_keys,
            array_agg(DISTINCT c.optimization_subtheme_key) FILTER (WHERE c.optimization_subtheme_key IS NOT NULL) as optimization_subtheme_keys,
            array_agg(DISTINCT m.ad_name) FILTER (WHERE m.ad_name IS NOT NULL) as ad_names,
            array_agg(DISTINCT m.adset_id) FILTER (WHERE m.adset_id IS NOT NULL) as adset_ids,
            COUNT(DISTINCT m.ad_id)::int as ads_count,
            COALESCE(SUM(m.spend), 0) as total_spend,
            COALESCE(SUM(m.messaging_conversations), 0)::int as total_conversations,
            COALESCE(SUM(m.impressions), 0)::int as total_impressions,
            COALESCE(SUM(m.clicks), 0)::int as total_clicks,
            COALESCE(AVG(m.ctr), 0) as avg_ctr,
            COALESCE(AVG(m.cpm), 0) as avg_cpm,
            COALESCE(SUM(m.video_3sec_views), 0)::int as video_3s_views_total,
            COALESCE(SUM(m.video_thruplay), 0)::int as video_thruplay_total,
            COALESCE(AVG(m.hook_rate), 0) as hook_rate_avg,
            COALESCE(AVG(m.hold_rate), 0) as hold_rate_avg,
            COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus6)} THEN m.spend ELSE 0 END), 0) as spend_last7,
            COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus6)} THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_last7,
            COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus13)} AND m.date < ${new Date(endMinus6)} THEN m.spend ELSE 0 END), 0) as spend_prev7,
            COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus13)} AND m.date < ${new Date(endMinus6)} THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_prev7
          FROM ad_creative_metrics m
          JOIN campaigns c ON c.id = m.campaign_id
          WHERE c."clientId" = ${clientId}
            AND m.date >= ${new Date(start)}
            AND m.date <= ${new Date(end)}
            AND (${campaignId || null}::text IS NULL OR m.campaign_id = ${campaignId || null})
            AND m.creative_snapshot_id IS NOT NULL
          GROUP BY m.creative_snapshot_id
        )
        SELECT
          a.creative_snapshot_id,
          a.creative_id,
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
          s.visual_attributes as visual_attributes,
          s.captured_at as captured_at,
          s.last_seen_at as last_seen_at,
          a.campaigns,
          a.optimization_theme_keys,
          a.optimization_subtheme_keys,
          a.ad_names,
          a.adset_ids,
          a.ads_count,
          a.total_spend,
          a.total_conversations,
          a.total_impressions,
          a.total_clicks,
          a.avg_ctr,
          a.avg_cpm,
          a.video_3s_views_total,
          a.video_thruplay_total,
          a.hook_rate_avg,
          a.hold_rate_avg,
          a.spend_last7,
          a.conv_last7,
          a.spend_prev7,
          a.conv_prev7
        FROM creative_agg a
        LEFT JOIN ad_creative_snapshots s ON s.id = a.creative_snapshot_id
        ORDER BY a.total_spend DESC
    `;
        return result;
    }

    async getCopyInsight(snapshotId: string): Promise<CopyInsight | null> {
        const result = await this.prisma.$queryRaw<any[]>`
        SELECT
          snapshot_id,
          theme_key,
          theme_name,
          status,
          model,
          prompt_id,
          prompt_version,
          analysis,
          error_message,
          created_at,
          updated_at
        FROM creative_copy_insights
        WHERE snapshot_id = ${snapshotId}
        LIMIT 1
    `;

        if (result.length === 0) {
            return null;
        }

        const row = result[0];
        return {
            snapshotId: row.snapshot_id,
            themeKey: row.theme_key ?? null,
            themeName: row.theme_name ?? null,
            status: row.status,
            model: row.model ?? null,
            promptId: row.prompt_id ?? null,
            promptVersion: row.prompt_version ?? null,
            analysis: row.analysis ?? null,
            errorMessage: row.error_message ?? null,
            createdAt: row.created_at ?? null,
            updatedAt: row.updated_at ?? null,
        };
    }

    async getCampaignThemeBySnapshotId(snapshotId: string): Promise<{
        campaignName: string | null;
        themeKey: string | null;
        subthemeKey: string | null;
    } | null> {
        const result = await this.prisma.$queryRaw<any[]>`
        SELECT
          c.name as campaign_name,
          c.optimization_theme_key as optimization_theme_key,
          c.optimization_subtheme_key as optimization_subtheme_key
        FROM ad_creative_metrics m
        JOIN campaigns c ON c.id = m.campaign_id
        WHERE m.creative_snapshot_id = ${snapshotId}
        ORDER BY m.date DESC
        LIMIT 1
    `;

        if (result.length === 0) return null;
        return {
            campaignName: result[0].campaign_name ?? null,
            themeKey: result[0].optimization_theme_key ?? null,
            subthemeKey: result[0].optimization_subtheme_key ?? null,
        };
    }

    async getCampaignNameBySnapshotId(snapshotId: string): Promise<string | null> {
        const result = await this.getCampaignThemeBySnapshotId(snapshotId);
        return result?.campaignName ?? null;
    }

    async upsertCopyInsight(data: {
        snapshotId: string;
        themeKey: string | null;
        themeName: string | null;
        status: string;
        model: string | null;
        promptId: string | null;
        promptVersion: string | null;
        analysis: any;
        errorMessage: string | null;
    }): Promise<void> {
        await this.prisma.$executeRaw`
        INSERT INTO creative_copy_insights (
          snapshot_id,
          theme_key,
          theme_name,
          status,
          model,
          prompt_id,
          prompt_version,
          analysis,
          error_message,
          created_at,
          updated_at
        ) VALUES (
          ${data.snapshotId},
          ${data.themeKey},
          ${data.themeName},
          ${data.status},
          ${data.model},
          ${data.promptId},
          ${data.promptVersion},
          ${data.analysis}::jsonb,
          ${data.errorMessage},
          NOW(),
          NOW()
        )
        ON CONFLICT (snapshot_id) DO UPDATE SET
          theme_key = EXCLUDED.theme_key,
          theme_name = EXCLUDED.theme_name,
          status = EXCLUDED.status,
          model = EXCLUDED.model,
          prompt_id = EXCLUDED.prompt_id,
          prompt_version = EXCLUDED.prompt_version,
          analysis = EXCLUDED.analysis,
          error_message = EXCLUDED.error_message,
          updated_at = NOW()
    `;
    }

    async getClientOptimizationTargets(clientId: string): Promise<Record<string, unknown> | null> {
        const result = await this.prisma.$queryRaw<Array<{ optimization_targets: any }>>`
            SELECT optimization_targets FROM clients WHERE id = ${clientId}
        `;
        const raw = result[0]?.optimization_targets;
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            return raw as Record<string, unknown>;
        }
        return null;
    }

    async getClientRuleConfigs(clientId: string): Promise<Array<{ ruleId: string; enabled: boolean; parameters: any }>> {
        const rows = await this.prisma.clientRuleConfig.findMany({
            where: {
                clientId,
                campaignId: null,
                ruleProfileId: null,
            },
            select: { ruleId: true, enabled: true, parameters: true },
        });
        return rows.map((row) => ({
            ruleId: row.ruleId,
            enabled: row.enabled,
            parameters: row.parameters,
        }));
    }

    async getOptimizationPlaybookRules(): Promise<Array<{
        id: string;
        title: string;
        description: string;
        condition: string;
        level: string;
        severity: string;
        category: string;
        action: string;
        parametersSchema: any | null;
        parametersTemplate: any | null;
    }>> {
        try {
            const rows = await this.prisma.optimizationPlaybookRule.findMany({
                orderBy: { createdAt: 'asc' },
            });
            return rows.map((row) => ({
                id: row.id,
                title: row.title,
                description: row.description,
                condition: row.condition,
                level: row.level,
                severity: row.severity,
                category: row.category,
                action: row.action,
                parametersSchema: row.parametersSchema ?? null,
                parametersTemplate: row.parametersTemplate ?? null,
            }));
        } catch (_error) {
            return [];
        }
    }

    async getCampaignOptimizationStats(
        clientId: string,
        start: string,
        end: string,
        endMinus6: string,
        endMinus13: string,
        campaignId: string | null
    ): Promise<any[]> {
        return await this.prisma.$queryRaw<any[]>`
    SELECT
      c.id as campaign_id,
      c.name as campaign_name,
      c.status as campaign_status,
      c.platform as platform,
      c.objective as objective,
      c.objective_class_key as objective_class_key,
      c.channel_class_key as channel_class_key,
      c.rule_profile_id as rule_profile_id,
      c.budget as budget,
      c.optimization_theme_key as optimization_theme_key,
      c.optimization_subtheme_key as optimization_subtheme_key,
      COALESCE(SUM(cm.spend), 0) as spend_total,
      COALESCE(SUM(cm.impressions), 0)::int as impressions_total,
      COALESCE(SUM(cm.reach), 0)::int as reach_total,
      COALESCE(SUM(cm.clicks), 0)::int as clicks_total,
      COALESCE(SUM(cm.conversions), 0)::int as conversions_total,
      COALESCE(SUM(cm.leads), 0)::int as leads_total,
      COALESCE(SUM(cm.messaging_conversations), 0)::int as conversations_total,
      COALESCE(SUM(cm.messaging_first_reply), 0)::int as first_reply_total,
      COALESCE(SUM(cm.link_clicks), 0)::int as link_clicks_total,
      COALESCE(SUM(cm.landing_page_views), 0)::int as landing_page_views_total,
      COALESCE(AVG(cm.frequency), 0) as avg_frequency_total,
      COALESCE(AVG(cm.cpm), 0) as avg_cpm_total,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.spend ELSE 0 END), 0) as spend_last7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.impressions ELSE 0 END), 0)::int as impressions_last7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.reach ELSE 0 END), 0)::int as reach_last7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.conversions ELSE 0 END), 0)::int as conversions_last7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.leads ELSE 0 END), 0)::int as leads_last7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.messaging_conversations ELSE 0 END), 0)::int as conversations_last7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.messaging_first_reply ELSE 0 END), 0)::int as first_reply_last7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.link_clicks ELSE 0 END), 0)::int as link_clicks_last7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.landing_page_views ELSE 0 END), 0)::int as landing_page_views_last7,
      COALESCE(AVG(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.frequency ELSE NULL END), 0) as avg_frequency_last7,
      COALESCE(AVG(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.cpm ELSE NULL END), 0) as avg_cpm_last7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.spend ELSE 0 END), 0) as spend_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.impressions ELSE 0 END), 0)::int as impressions_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.reach ELSE 0 END), 0)::int as reach_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.conversions ELSE 0 END), 0)::int as conversions_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.leads ELSE 0 END), 0)::int as leads_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.messaging_conversations ELSE 0 END), 0)::int as conversations_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.messaging_first_reply ELSE 0 END), 0)::int as first_reply_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.link_clicks ELSE 0 END), 0)::int as link_clicks_prev7,
      COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.landing_page_views ELSE 0 END), 0)::int as landing_page_views_prev7,
      COALESCE(AVG(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.frequency ELSE NULL END), 0) as avg_frequency_prev7,
      COALESCE(AVG(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.cpm ELSE NULL END), 0) as avg_cpm_prev7,
      CASE
        WHEN COALESCE(c.objective_class_key, '') = 'messages' THEN 'conversations'
        WHEN COALESCE(c.objective_class_key, '') = 'lead' THEN 'leads'
        WHEN COALESCE(c.objective_class_key, '') = 'traffic' THEN 'traffic_results'
        WHEN COALESCE(c.objective_class_key, '') = 'awareness' THEN 'reach'
        ELSE 'conversions'
      END as primary_result_key,
      CASE
        WHEN COALESCE(c.objective_class_key, '') = 'messages'
          THEN COALESCE(SUM(cm.messaging_conversations), 0)::int
        WHEN COALESCE(c.objective_class_key, '') = 'lead'
          THEN COALESCE(SUM(cm.leads), 0)::int
        WHEN COALESCE(c.objective_class_key, '') = 'traffic'
          THEN COALESCE(NULLIF(SUM(cm.landing_page_views), 0), NULLIF(SUM(cm.link_clicks), 0), SUM(cm.clicks), 0)::int
        WHEN COALESCE(c.objective_class_key, '') = 'awareness'
          THEN COALESCE(NULLIF(SUM(cm.reach), 0), SUM(cm.impressions), 0)::int
        ELSE COALESCE(NULLIF(SUM(cm.conversions), 0), NULLIF(SUM(cm.leads), 0), SUM(cm.messaging_conversations), 0)::int
      END as primary_result_total,
      CASE
        WHEN COALESCE(c.objective_class_key, '') = 'messages'
          THEN COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.messaging_conversations ELSE 0 END), 0)::int
        WHEN COALESCE(c.objective_class_key, '') = 'lead'
          THEN COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.leads ELSE 0 END), 0)::int
        WHEN COALESCE(c.objective_class_key, '') = 'traffic'
          THEN COALESCE(
            NULLIF(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.landing_page_views ELSE 0 END), 0),
            NULLIF(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.link_clicks ELSE 0 END), 0),
            SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.clicks ELSE 0 END),
            0
          )::int
        WHEN COALESCE(c.objective_class_key, '') = 'awareness'
          THEN COALESCE(
            NULLIF(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.reach ELSE 0 END), 0),
            SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.impressions ELSE 0 END),
            0
          )::int
        ELSE COALESCE(
          NULLIF(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.conversions ELSE 0 END), 0),
          NULLIF(SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.leads ELSE 0 END), 0),
          SUM(CASE WHEN cm.date >= ${new Date(endMinus6)} THEN cm.messaging_conversations ELSE 0 END),
          0
        )::int
      END as primary_result_last7,
      CASE
        WHEN COALESCE(c.objective_class_key, '') = 'messages'
          THEN COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.messaging_conversations ELSE 0 END), 0)::int
        WHEN COALESCE(c.objective_class_key, '') = 'lead'
          THEN COALESCE(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.leads ELSE 0 END), 0)::int
        WHEN COALESCE(c.objective_class_key, '') = 'traffic'
          THEN COALESCE(
            NULLIF(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.landing_page_views ELSE 0 END), 0),
            NULLIF(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.link_clicks ELSE 0 END), 0),
            SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.clicks ELSE 0 END),
            0
          )::int
        WHEN COALESCE(c.objective_class_key, '') = 'awareness'
          THEN COALESCE(
            NULLIF(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.reach ELSE 0 END), 0),
            SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.impressions ELSE 0 END),
            0
          )::int
        ELSE COALESCE(
          NULLIF(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.conversions ELSE 0 END), 0),
          NULLIF(SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.leads ELSE 0 END), 0),
          SUM(CASE WHEN cm.date >= ${new Date(endMinus13)} AND cm.date < ${new Date(endMinus6)} THEN cm.messaging_conversations ELSE 0 END),
          0
        )::int
      END as primary_result_prev7
    FROM campaigns c
    LEFT JOIN campaign_metrics cm ON cm.campaign_id = c.id AND cm.date >= ${new Date(start)} AND cm.date <= ${new Date(end)}
    WHERE c."clientId" = ${clientId}
      AND (${campaignId || null}::text IS NULL OR c.id = ${campaignId || null})
    GROUP BY c.id, c.name, c.status, c.platform, c.objective, c.objective_class_key, c.channel_class_key, c.rule_profile_id, c.budget, c.optimization_theme_key, c.optimization_subtheme_key
    ORDER BY spend_total DESC`;
    }

    async getAdSetOptimizationStats(
        clientId: string,
        start: string,
        end: string,
        endMinus6: string,
        endMinus13: string,
        campaignId: string | null
    ): Promise<any[]> {
        return await this.prisma.$queryRaw<any[]>`
      SELECT
        am.adset_id,
        am.adset_name,
        am.campaign_id,
        c.objective_class_key as objective_class_key,
        c.channel_class_key as channel_class_key,
        COALESCE(SUM(am.spend), 0)::float as spend_total,
        COALESCE(SUM(am.messaging_conversations), 0)::int as conversations_total,
        COALESCE(SUM(am.leads), 0)::int as leads_total,
        COALESCE(SUM(am.conversions), 0)::int as conversions_total,
        COALESCE(SUM(am.link_clicks), 0)::int as link_clicks_total,
        COALESCE(SUM(am.landing_page_views), 0)::int as landing_page_views_total,
        COALESCE(SUM(am.clicks), 0)::int as clicks_total,
        COALESCE(SUM(am.impressions), 0)::int as impressions_total,
        COALESCE(SUM(am.reach), 0)::int as reach_total,
        COALESCE(AVG(am.frequency), 0)::float as avg_frequency,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.spend ELSE 0 END), 0)::float as spend_last7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.messaging_conversations ELSE 0 END), 0)::int as conversations_last7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.leads ELSE 0 END), 0)::int as leads_last7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.conversions ELSE 0 END), 0)::int as conversions_last7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.link_clicks ELSE 0 END), 0)::int as link_clicks_last7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.landing_page_views ELSE 0 END), 0)::int as landing_page_views_last7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.clicks ELSE 0 END), 0)::int as clicks_last7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.reach ELSE 0 END), 0)::int as reach_last7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.spend ELSE 0 END), 0)::float as spend_prev7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.messaging_conversations ELSE 0 END), 0)::int as conversations_prev7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.leads ELSE 0 END), 0)::int as leads_prev7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.conversions ELSE 0 END), 0)::int as conversions_prev7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.link_clicks ELSE 0 END), 0)::int as link_clicks_prev7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.landing_page_views ELSE 0 END), 0)::int as landing_page_views_prev7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.clicks ELSE 0 END), 0)::int as clicks_prev7,
        COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.reach ELSE 0 END), 0)::int as reach_prev7,
        COALESCE(AVG(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.frequency ELSE NULL END), 0)::float as avg_frequency_last7,
        (SELECT COUNT(DISTINCT acm.ad_id) FROM ad_creative_metrics acm WHERE acm.adset_id = am.adset_id AND acm.date >= ${new Date(endMinus6)})::int as ad_count,
        CASE
          WHEN COALESCE(c.objective_class_key, '') = 'messages'
            THEN COALESCE(SUM(am.messaging_conversations), 0)::int
          WHEN COALESCE(c.objective_class_key, '') = 'lead'
            THEN COALESCE(SUM(am.leads), 0)::int
          WHEN COALESCE(c.objective_class_key, '') = 'traffic'
            THEN COALESCE(NULLIF(SUM(am.landing_page_views), 0), NULLIF(SUM(am.link_clicks), 0), SUM(am.clicks), 0)::int
          WHEN COALESCE(c.objective_class_key, '') = 'awareness'
            THEN COALESCE(NULLIF(SUM(am.reach), 0), SUM(am.impressions), 0)::int
          ELSE COALESCE(NULLIF(SUM(am.conversions), 0), NULLIF(SUM(am.leads), 0), SUM(am.messaging_conversations), 0)::int
        END as primary_result_total,
        CASE
          WHEN COALESCE(c.objective_class_key, '') = 'messages'
            THEN COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.messaging_conversations ELSE 0 END), 0)::int
          WHEN COALESCE(c.objective_class_key, '') = 'lead'
            THEN COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.leads ELSE 0 END), 0)::int
          WHEN COALESCE(c.objective_class_key, '') = 'traffic'
            THEN COALESCE(
              NULLIF(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.landing_page_views ELSE 0 END), 0),
              NULLIF(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.link_clicks ELSE 0 END), 0),
              SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.clicks ELSE 0 END),
              0
            )::int
          WHEN COALESCE(c.objective_class_key, '') = 'awareness'
            THEN COALESCE(
              NULLIF(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.reach ELSE 0 END), 0),
              SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.impressions ELSE 0 END),
              0
            )::int
          ELSE COALESCE(
            NULLIF(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.conversions ELSE 0 END), 0),
            NULLIF(SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.leads ELSE 0 END), 0),
            SUM(CASE WHEN am.date >= ${new Date(endMinus6)} THEN am.messaging_conversations ELSE 0 END),
            0
          )::int
        END as primary_result_last7,
        CASE
          WHEN COALESCE(c.objective_class_key, '') = 'messages'
            THEN COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.messaging_conversations ELSE 0 END), 0)::int
          WHEN COALESCE(c.objective_class_key, '') = 'lead'
            THEN COALESCE(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.leads ELSE 0 END), 0)::int
          WHEN COALESCE(c.objective_class_key, '') = 'traffic'
            THEN COALESCE(
              NULLIF(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.landing_page_views ELSE 0 END), 0),
              NULLIF(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.link_clicks ELSE 0 END), 0),
              SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.clicks ELSE 0 END),
              0
            )::int
          WHEN COALESCE(c.objective_class_key, '') = 'awareness'
            THEN COALESCE(
              NULLIF(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.reach ELSE 0 END), 0),
              SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.impressions ELSE 0 END),
              0
            )::int
          ELSE COALESCE(
            NULLIF(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.conversions ELSE 0 END), 0),
            NULLIF(SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.leads ELSE 0 END), 0),
            SUM(CASE WHEN am.date >= ${new Date(endMinus13)} AND am.date < ${new Date(endMinus6)} THEN am.messaging_conversations ELSE 0 END),
            0
          )::int
        END as primary_result_prev7
      FROM adset_metrics am
      JOIN campaigns c ON c.id = am.campaign_id
      WHERE c."clientId" = ${clientId}
        AND am.date >= ${new Date(start)}
        AND am.date <= ${new Date(end)}
        AND (${campaignId || null}::text IS NULL OR am.campaign_id = ${campaignId || null})
      GROUP BY am.adset_id, am.adset_name, am.campaign_id, c.objective_class_key, c.channel_class_key
      ORDER BY spend_total DESC`;
    }

    async getAdSetBudgets(clientId: string, campaignId: string | null): Promise<any[]> {
        return await this.prisma.$queryRaw<any[]>`
      SELECT
        a.campaign_id,
        COALESCE(SUM(a.daily_budget), 0) as daily_budget,
        COALESCE(SUM(a.lifetime_budget), 0) as lifetime_budget
      FROM adsets a
      JOIN campaigns c ON c.id = a.campaign_id
      WHERE c."clientId" = ${clientId}
        AND (${campaignId || null}::text IS NULL OR a.campaign_id = ${campaignId || null})
      GROUP BY a.campaign_id`;
    }

    async getLeadTrackingStats(
        clientId: string,
        start: string,
        end: string,
        endMinus6: string,
        endMinus13: string,
        campaignId: string | null
    ): Promise<any[]> {
        return await this.prisma.$queryRaw<any[]>`
    SELECT
      lt.campaign_id,
      COUNT(*) FILTER (WHERE lt.date >= ${new Date(endMinus6)})::int as tracking_records_last7,
      COALESCE(SUM(CASE WHEN lt.date >= ${new Date(endMinus6)} THEN lt.qualified_leads ELSE 0 END), 0)::int as qualified_last7,
      COALESCE(SUM(CASE WHEN lt.date >= ${new Date(endMinus13)} AND lt.date < ${new Date(endMinus6)} THEN lt.qualified_leads ELSE 0 END), 0)::int as qualified_prev7
    FROM campaign_lead_tracking lt
    JOIN campaigns c ON c.id = lt.campaign_id
    WHERE c."clientId" = ${clientId}
      AND lt.date >= ${new Date(start)}
      AND lt.date <= ${new Date(end)}
      AND (${campaignId || null}::text IS NULL OR lt.campaign_id = ${campaignId || null})
    GROUP BY lt.campaign_id`;
    }

    async getDisqualificationReasons(
        clientId: string,
        start: string,
        end: string,
        endMinus6: string,
        campaignId: string | null
    ): Promise<any[]> {
        return await this.prisma.$queryRaw<any[]>`
    SELECT
      lt.campaign_id,
      e.key as reason_key,
      SUM((e.value)::int)::int as total_count
    FROM campaign_lead_tracking lt
    JOIN campaigns c ON c.id = lt.campaign_id
    CROSS JOIN LATERAL jsonb_each_text(COALESCE(lt.disqualification_reasons, '{}'::jsonb)) e(key, value)
    WHERE c."clientId" = ${clientId}
      AND lt.date >= ${new Date(start)}
      AND lt.date <= ${new Date(end)}
      AND lt.date >= ${new Date(endMinus6)}
      AND (${campaignId || null}::text IS NULL OR lt.campaign_id = ${campaignId || null})
    GROUP BY lt.campaign_id, e.key`;
    }

    async getCreativeOptimizationStats(
        clientId: string,
        start: string,
        end: string,
        endMinus6: string,
        endMinus13: string,
        campaignId: string | null
    ): Promise<any[]> {
        return await this.prisma.$queryRaw<any[]>`
    WITH creative_agg AS (
      SELECT
        m.creative_snapshot_id,
        MAX(m.creative_id) as creative_id,
        MAX(c.objective_class_key) as objective_class_key,
        MAX(c.channel_class_key) as channel_class_key,
        array_agg(DISTINCT c.name) as campaigns,
        array_agg(DISTINCT c.optimization_theme_key) FILTER (WHERE c.optimization_theme_key IS NOT NULL) as optimization_theme_keys,
        array_agg(DISTINCT c.optimization_subtheme_key) FILTER (WHERE c.optimization_subtheme_key IS NOT NULL) as optimization_subtheme_keys,
        array_agg(DISTINCT c.objective) FILTER (WHERE c.objective IS NOT NULL) as objectives,
        array_agg(DISTINCT m.ad_name) FILTER (WHERE m.ad_name IS NOT NULL) as ad_names,
        COUNT(DISTINCT m.ad_id)::int as ads_count,
        COALESCE(SUM(m.spend), 0) as total_spend,
        COALESCE(SUM(m.messaging_conversations), 0)::int as total_conversations,
        COALESCE(SUM(COALESCE((m.metadata->>'leads')::int, 0)), 0)::int as total_leads,
        COALESCE(SUM(m.conversions), 0)::int as total_conversions,
        COALESCE(SUM(m.link_clicks), 0)::int as total_link_clicks,
        COALESCE(SUM(m.landing_page_views), 0)::int as total_landing_page_views,
        COALESCE(SUM(m.clicks), 0)::int as total_clicks,
        COALESCE(SUM(m.reach), 0)::int as total_reach,
        COALESCE(AVG(NULLIF(m.hook_rate, 0)), 0) as hook_rate_avg,
        COALESCE(AVG(NULLIF(m.hold_rate, 0)), 0) as hold_rate_avg,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus6)} THEN m.spend ELSE 0 END), 0) as spend_last7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus6)} THEN m.messaging_conversations ELSE 0 END), 0)::int as conversations_last7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus6)} THEN COALESCE((m.metadata->>'leads')::int, 0) ELSE 0 END), 0)::int as leads_last7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus6)} THEN m.conversions ELSE 0 END), 0)::int as conversions_last7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus6)} THEN m.link_clicks ELSE 0 END), 0)::int as link_clicks_last7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus6)} THEN m.landing_page_views ELSE 0 END), 0)::int as landing_page_views_last7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus6)} THEN m.clicks ELSE 0 END), 0)::int as clicks_last7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus6)} THEN m.reach ELSE 0 END), 0)::int as reach_last7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus13)} AND m.date < ${new Date(endMinus6)} THEN m.spend ELSE 0 END), 0) as spend_prev7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus13)} AND m.date < ${new Date(endMinus6)} THEN m.messaging_conversations ELSE 0 END), 0)::int as conversations_prev7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus13)} AND m.date < ${new Date(endMinus6)} THEN COALESCE((m.metadata->>'leads')::int, 0) ELSE 0 END), 0)::int as leads_prev7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus13)} AND m.date < ${new Date(endMinus6)} THEN m.conversions ELSE 0 END), 0)::int as conversions_prev7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus13)} AND m.date < ${new Date(endMinus6)} THEN m.link_clicks ELSE 0 END), 0)::int as link_clicks_prev7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus13)} AND m.date < ${new Date(endMinus6)} THEN m.landing_page_views ELSE 0 END), 0)::int as landing_page_views_prev7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus13)} AND m.date < ${new Date(endMinus6)} THEN m.clicks ELSE 0 END), 0)::int as clicks_prev7,
        COALESCE(SUM(CASE WHEN m.date >= ${new Date(endMinus13)} AND m.date < ${new Date(endMinus6)} THEN m.reach ELSE 0 END), 0)::int as reach_prev7
      FROM ad_creative_metrics m
      JOIN campaigns c ON c.id = m.campaign_id
      WHERE c."clientId" = ${clientId}
        AND m.date >= ${new Date(start)}
        AND m.date <= ${new Date(end)}
        AND (${campaignId || null}::text IS NULL OR m.campaign_id = ${campaignId || null})
        AND m.creative_snapshot_id IS NOT NULL
      GROUP BY m.creative_snapshot_id
    )
    SELECT
      a.creative_snapshot_id,
      a.creative_id,
      a.objective_class_key,
      a.channel_class_key,
      a.campaigns,
      a.objectives,
      a.ad_names,
      a.ads_count,
      a.total_spend,
      a.total_conversations,
      a.total_leads,
      a.total_conversions,
      a.total_link_clicks,
      a.total_landing_page_views,
      a.total_clicks,
      a.total_reach,
      CASE
        WHEN COALESCE(a.objective_class_key, '') = 'messages'
          THEN a.total_conversations
        WHEN COALESCE(a.objective_class_key, '') = 'lead'
          THEN a.total_leads
        WHEN COALESCE(a.objective_class_key, '') = 'traffic'
          THEN COALESCE(NULLIF(a.total_landing_page_views, 0), NULLIF(a.total_link_clicks, 0), a.total_clicks, 0)::int
        WHEN COALESCE(a.objective_class_key, '') = 'awareness'
          THEN COALESCE(NULLIF(a.total_reach, 0), 0)::int
        ELSE COALESCE(NULLIF(a.total_conversions, 0), NULLIF(a.total_leads, 0), a.total_conversations, 0)::int
      END as primary_result_total,
      a.hook_rate_avg,
      a.hold_rate_avg,
      a.spend_last7,
      CASE
        WHEN COALESCE(a.objective_class_key, '') = 'messages'
          THEN a.conversations_last7
        WHEN COALESCE(a.objective_class_key, '') = 'lead'
          THEN a.leads_last7
        WHEN COALESCE(a.objective_class_key, '') = 'traffic'
          THEN COALESCE(NULLIF(a.landing_page_views_last7, 0), NULLIF(a.link_clicks_last7, 0), a.clicks_last7, 0)::int
        WHEN COALESCE(a.objective_class_key, '') = 'awareness'
          THEN COALESCE(NULLIF(a.reach_last7, 0), 0)::int
        ELSE COALESCE(NULLIF(a.conversions_last7, 0), NULLIF(a.leads_last7, 0), a.conversations_last7, 0)::int
      END as conv_last7,
      a.spend_prev7,
      CASE
        WHEN COALESCE(a.objective_class_key, '') = 'messages'
          THEN a.conversations_prev7
        WHEN COALESCE(a.objective_class_key, '') = 'lead'
          THEN a.leads_prev7
        WHEN COALESCE(a.objective_class_key, '') = 'traffic'
          THEN COALESCE(NULLIF(a.landing_page_views_prev7, 0), NULLIF(a.link_clicks_prev7, 0), a.clicks_prev7, 0)::int
        WHEN COALESCE(a.objective_class_key, '') = 'awareness'
          THEN COALESCE(NULLIF(a.reach_prev7, 0), 0)::int
        ELSE COALESCE(NULLIF(a.conversions_prev7, 0), NULLIF(a.leads_prev7, 0), a.conversations_prev7, 0)::int
      END as conv_prev7,
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
    }
}

