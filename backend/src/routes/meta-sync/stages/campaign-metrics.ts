import { v4 as uuidv4 } from 'uuid';
import { getBatchSize } from '../utils';
import {
  landingPageViewTypes,
  leadTypes,
  linkClickTypes,
  messagingConversationTypes,
  messagingReplyTypes,
  parseNumber,
  purchaseTypes,
  sumActions,
} from '../insights';
import type { MetaSyncContext } from '../types';

type MappedCampaignMetric = {
  campaignId: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  leads: number;
  messagingConversations: number;
  messagingFirstReply: number;
  linkClicks: number;
  landingPageViews: number;
  reach: number;
  frequency: number;
  cpm: number;
  qualityRanking: string | null;
  engagementRateRanking: string | null;
  conversionRateRanking: string | null;
};

export type CampaignMetricsStageResult = {
  totalInsights: number;
  mappedTotal: number;
  updated: number;
  unmapped: Set<string>;
};

const upsertCampaignMetrics = async (ctx: Pick<MetaSyncContext, 'pool'>, metrics: MappedCampaignMetric[]) => {
  if (metrics.length === 0) return 0;

  const batchSize = getBatchSize(25);
  let totalUpdated = 0;

  for (let offset = 0; offset < metrics.length; offset += batchSize) {
    const batch = metrics.slice(offset, offset + batchSize);
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const entry of batch) {
      const ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0;
      const cpc = entry.clicks > 0 ? entry.spend / entry.clicks : 0;
      const cpl = entry.leads > 0 ? entry.spend / entry.leads : 0;
      const cpa = entry.conversions > 0 ? entry.spend / entry.conversions : 0;
      const roas = entry.spend > 0 ? entry.revenue / entry.spend : 0;

      const rowPlaceholders: string[] = [];
      for (let i = 0; i < 25; i++) {
        rowPlaceholders.push(`$${paramIndex++}`);
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);

      values.push(
        uuidv4(),
        entry.campaignId,
        entry.date,
        entry.impressions,
        entry.clicks,
        entry.spend,
        entry.conversions,
        entry.revenue,
        entry.leads,
        ctr,
        cpc,
        cpl,
        cpa,
        roas,
        'meta',
        entry.messagingConversations,
        entry.messagingFirstReply,
        entry.linkClicks,
        entry.landingPageViews,
        entry.reach,
        entry.frequency,
        entry.cpm,
        entry.qualityRanking,
        entry.engagementRateRanking,
        entry.conversionRateRanking
      );
    }

    const result = await ctx.pool.query(
      `INSERT INTO campaign_metrics
       (id, campaign_id, date, impressions, clicks, spend, conversions, revenue, leads, ctr, cpc, cpl, cpa, roas, platform, messaging_conversations, messaging_first_reply, link_clicks, landing_page_views, reach, frequency, cpm, quality_ranking, engagement_rate_ranking, conversion_rate_ranking)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (campaign_id, date, platform)
       DO UPDATE SET
         impressions = EXCLUDED.impressions,
         clicks = EXCLUDED.clicks,
         spend = EXCLUDED.spend,
         conversions = EXCLUDED.conversions,
         revenue = EXCLUDED.revenue,
         leads = EXCLUDED.leads,
         ctr = EXCLUDED.ctr,
         cpc = EXCLUDED.cpc,
         cpl = EXCLUDED.cpl,
         cpa = EXCLUDED.cpa,
         roas = EXCLUDED.roas,
         messaging_conversations = EXCLUDED.messaging_conversations,
         messaging_first_reply = EXCLUDED.messaging_first_reply,
         link_clicks = EXCLUDED.link_clicks,
         landing_page_views = EXCLUDED.landing_page_views,
         reach = EXCLUDED.reach,
         frequency = EXCLUDED.frequency,
         cpm = EXCLUDED.cpm,
         quality_ranking = EXCLUDED.quality_ranking,
         engagement_rate_ranking = EXCLUDED.engagement_rate_ranking,
         conversion_rate_ranking = EXCLUDED.conversion_rate_ranking`,
      values
    );

    totalUpdated += result.rowCount || batch.length;
  }

  return totalUpdated;
};

export const syncCampaignMetricsStage = async (ctx: MetaSyncContext): Promise<CampaignMetricsStageResult> => {
  const { dateChunks, metaService, campaignMap, progress, log } = ctx;

  const unmapped = new Set<string>();
  let totalInsights = 0;
  let mappedTotal = 0;
  let updated = 0;

  await progress.setStage('campaign', dateChunks.length, 'Sincronizando métricas de campanhas...');

  for (const chunk of dateChunks) {
    const insights = await metaService.fetchCampaignInsights(chunk);
    totalInsights += insights.length;

    log.info({ since: chunk.since, until: chunk.until, insightsCount: insights.length }, 'Fetched insights from Meta API');

    if (insights.length > 0) {
      const mappedMetrics: MappedCampaignMetric[] = [];

      for (const row of insights as any[]) {
        const campaignId = campaignMap.get(row.campaign_id);
        if (!campaignId) {
          unmapped.add(row.campaign_id);
          continue;
        }

        const impressions = Math.round(parseNumber(row.impressions));
        const clicks = Math.round(parseNumber(row.clicks));
        const spend = parseNumber(row.spend);
        const purchases = sumActions(row.actions, purchaseTypes);
        const leads = sumActions(row.actions, leadTypes);
        const messagingConversations = sumActions(row.actions, messagingConversationTypes);
        const messagingFirstReply = sumActions(row.actions, messagingReplyTypes);
        const linkClicks = sumActions(row.actions, linkClickTypes);
        const landingPageViews = sumActions(row.actions, landingPageViewTypes);
        const revenue = sumActions(row.action_values, purchaseTypes);
        const reach = Math.round(parseNumber(row.reach));
        const frequency = parseNumber(row.frequency);
        const cpm = parseNumber(row.cpm);
        const qualityRanking = row.quality_ranking || null;
        const engagementRateRanking = row.engagement_rate_ranking || null;
        const conversionRateRanking = row.conversion_rate_ranking || null;

        const conversions = purchases > 0 ? purchases : messagingConversations > 0 ? messagingConversations : leads;

        mappedMetrics.push({
          campaignId,
          date: row.date_start,
          impressions,
          clicks,
          spend,
          conversions,
          revenue,
          leads,
          messagingConversations,
          messagingFirstReply,
          linkClicks,
          landingPageViews,
          reach,
          frequency,
          cpm,
          qualityRanking,
          engagementRateRanking,
          conversionRateRanking,
        });
      }

      mappedTotal += mappedMetrics.length;

      if (!ctx.body.dryRun && mappedMetrics.length > 0) {
        updated += await upsertCampaignMetrics(ctx, mappedMetrics);
      }
    }

    await progress.completeUnit(chunk.since, chunk.until);
  }

  return { totalInsights, mappedTotal, updated, unmapped };
};

