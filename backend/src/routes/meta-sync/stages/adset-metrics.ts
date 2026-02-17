import { v4 as uuidv4 } from 'uuid';
import { getBatchSize } from '../utils';
import {
  buildActionTypeMap,
  landingPageViewTypes,
  leadTypes,
  linkClickTypes,
  messagingConversationTypes,
  messagingReplyTypes,
  parseNumber,
  purchaseTypes,
  sumActions,
} from '../insights';
import { toJsonb } from '../utils';
import type { MetaSyncContext } from '../types';

export const syncAdsetMetricsStage = async (ctx: MetaSyncContext) => {
  const { dateChunks, metaService, campaignMap, progress, log } = ctx;

  await progress.setStage('adset', dateChunks.length, 'Sincronizando métricas de conjuntos de anúncios...');
  let totalAdsetInsights = 0;
  const adsetBatchSize = getBatchSize(20);

  for (const chunk of dateChunks) {
    const adsetInsights = await metaService.fetchAdSetInsights(chunk);
    totalAdsetInsights += adsetInsights.length;

    if (adsetInsights.length === 0) {
      await progress.completeUnit(chunk.since, chunk.until);
      continue;
    }

    for (let offset = 0; offset < adsetInsights.length; offset += adsetBatchSize) {
      const batch = adsetInsights.slice(offset, offset + adsetBatchSize);
      const adsetValues: any[] = [];
      const adsetPlaceholders: string[] = [];
      let adsetParamIndex = 1;

      for (const row of batch as any[]) {
        const campaignId = campaignMap.get(row.campaign_id);
        if (!campaignId) continue;
        if (!row.adset_id) {
          log.warn({ row }, 'Skipping adset with missing adset_id');
          continue;
        }

        const impressions = Math.round(parseNumber(row.impressions));
        const reach = Math.round(parseNumber(row.reach));
        const clicks = Math.round(parseNumber(row.clicks));
        const spend = parseNumber(row.spend);
        const linkClicks = sumActions(row.actions, linkClickTypes);
        const landingPageViews = sumActions(row.actions, landingPageViewTypes);
        const conversations = sumActions(row.actions, messagingConversationTypes);
        const replies = sumActions(row.actions, messagingReplyTypes);
        const leads = sumActions(row.actions, leadTypes);
        const purchases = sumActions(row.actions, purchaseTypes);
        const actionsByType = buildActionTypeMap(row.actions);
        const actionValuesByType = buildActionTypeMap(row.action_values);
        const conversions = purchases > 0 ? purchases : conversations > 0 ? conversations : leads;
        const ctr = parseNumber(row.ctr);
        const cpc = parseNumber(row.cpc);
        const cpm = parseNumber(row.cpm);
        const frequency = parseNumber(row.frequency);
        const contacts = leads > 0 ? leads : conversations > 0 ? conversations : conversions;
        const cpl = contacts > 0 ? spend / contacts : 0;

        const rowPh: string[] = [];
        for (let i = 0; i < 24; i++) {
          const placeholder = `$${adsetParamIndex++}`;
          rowPh.push(i === 15 || i === 16 ? `${placeholder}::jsonb` : placeholder);
        }
        adsetPlaceholders.push(`(${rowPh.join(', ')})`);

        adsetValues.push(
          uuidv4(),
          campaignId,
          row.adset_id,
          row.adset_name || null,
          new Date(row.date_start),
          impressions,
          reach,
          clicks,
          linkClicks,
          landingPageViews,
          spend,
          conversions,
          leads,
          conversations,
          replies,
          toJsonb(actionsByType),
          toJsonb(actionValuesByType),
          ctr,
          cpc,
          cpl,
          cpm,
          frequency,
          row.quality_ranking || null,
          'meta'
        );
      }

      if (adsetPlaceholders.length > 0) {
        await ctx.prisma.$executeRawUnsafe(
          `INSERT INTO adset_metrics
           (id, campaign_id, adset_id, adset_name, date, impressions, reach, clicks, link_clicks, landing_page_views, spend, conversions, leads, messaging_conversations, messaging_first_reply, actions_by_type, action_values_by_type, ctr, cpc, cpl, cpm, frequency, quality_ranking, platform)
           VALUES ${adsetPlaceholders.join(', ')}
           ON CONFLICT (adset_id, date, platform)
           DO UPDATE SET
             impressions = EXCLUDED.impressions,
             reach = EXCLUDED.reach,
             clicks = EXCLUDED.clicks,
             link_clicks = EXCLUDED.link_clicks,
             landing_page_views = EXCLUDED.landing_page_views,
             spend = EXCLUDED.spend,
             conversions = EXCLUDED.conversions,
             leads = EXCLUDED.leads,
             messaging_conversations = EXCLUDED.messaging_conversations,
             messaging_first_reply = EXCLUDED.messaging_first_reply,
             actions_by_type = EXCLUDED.actions_by_type,
             action_values_by_type = EXCLUDED.action_values_by_type,
             ctr = EXCLUDED.ctr,
             cpc = EXCLUDED.cpc,
             cpl = EXCLUDED.cpl,
             cpm = EXCLUDED.cpm,
             frequency = EXCLUDED.frequency,
             quality_ranking = EXCLUDED.quality_ranking,
             adset_name = EXCLUDED.adset_name`,
          ...adsetValues
        );
      }
    }

    await progress.completeUnit(chunk.since, chunk.until);
  }

  if (totalAdsetInsights > 0) {
    log.info({ adsetInsights: totalAdsetInsights }, 'Ad set metrics synced');
  }
};
