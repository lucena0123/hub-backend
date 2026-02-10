import type { MetaAd } from '../../../services/meta-ads-service';
import { v4 as uuidv4 } from 'uuid';
import { getBatchSize, extractCreativeSnapshot, toJsonb } from '../utils';
import {
  leadTypes,
  landingPageViewTypes,
  linkClickTypes,
  messagingConversationTypes,
  parseNumber,
  purchaseTypes,
  sumActions,
  sumVideoActions,
} from '../insights';
import type { MetaSyncContext } from '../types';

export const syncAdMetricsStage = async (ctx: MetaSyncContext) => {
  const { dateChunks, metaService, campaignMap, progress, since, until, log } = ctx;

  try {
    await progress.setStage('ad', dateChunks.length + 1, 'Sincronizando métricas de anúncios/criativos...');
    let totalAdInsights = 0;
    const syncedAdIds = new Set<string>();
    const adBatchSize = getBatchSize(25);

    for (const chunk of dateChunks) {
      const adInsights = await metaService.fetchAdInsights(chunk);
      totalAdInsights += adInsights.length;

      if (adInsights.length === 0) {
        await progress.completeUnit(chunk.since, chunk.until);
        continue;
      }

      for (let offset = 0; offset < adInsights.length; offset += adBatchSize) {
        const batch = adInsights.slice(offset, offset + adBatchSize);
        const adValues: any[] = [];
        const adPlaceholders: string[] = [];
        let adParamIndex = 1;

        for (const row of batch as any[]) {
          const campaignId = campaignMap.get(row.campaign_id);
          if (!campaignId) continue;
          if (!row.ad_id) {
            log.warn({ row }, 'Skipping ad with missing ad_id');
            continue;
          }
          syncedAdIds.add(row.ad_id);

          const impressions = Math.round(parseNumber(row.impressions));
          const reach = Math.round(parseNumber(row.reach));
          const clicks = Math.round(parseNumber(row.clicks));
          const linkClicks = sumActions(row.actions, linkClickTypes);
          const landingPageViews = sumActions(row.actions, landingPageViewTypes);
          const spend = parseNumber(row.spend);
          const conversations = sumActions(row.actions, messagingConversationTypes);
          const leads = sumActions(row.actions, leadTypes);
          const purchases = sumActions(row.actions, purchaseTypes);
          const conversions = purchases > 0 ? purchases : conversations > 0 ? conversations : leads;
          const thruplay = Math.round(sumVideoActions(row.video_thruplay_watched_actions));
          const p25 = Math.round(sumVideoActions(row.video_p25_watched_actions));
          const p50 = Math.round(sumVideoActions(row.video_p50_watched_actions));
          const p75 = Math.round(sumVideoActions(row.video_p75_watched_actions));
          const p100 = Math.round(sumVideoActions(row.video_p100_watched_actions));
          const video3sec = sumActions(row.actions, ['video_view']);
          const hookRate = impressions > 0 ? (video3sec / impressions) * 100 : 0;
          const holdRate = video3sec > 0 ? (thruplay / video3sec) * 100 : 0;
          const contacts = leads > 0 ? leads : conversations > 0 ? conversations : conversions;
          const cpl = contacts > 0 ? spend / contacts : 0;

          const rowPh: string[] = [];
          for (let i = 0; i < 27; i++) {
            rowPh.push(`$${adParamIndex++}`);
          }
          adPlaceholders.push(`(${rowPh.join(', ')})`);

          adValues.push(
            uuidv4(),
            campaignId,
            row.adset_id || null,
            row.ad_id,
            row.ad_name || null,
            new Date(row.date_start),
            impressions,
            reach,
            clicks,
            linkClicks,
            landingPageViews,
            spend,
            conversions,
            conversations,
            parseNumber(row.ctr),
            parseNumber(row.cpc),
            cpl,
            parseNumber(row.cpm),
            thruplay,
            p25,
            p50,
            p75,
            p100,
            video3sec,
            Number(hookRate.toFixed(2)),
            Number(holdRate.toFixed(2)),
            'meta'
          );
        }

        if (adPlaceholders.length > 0) {
          await ctx.prisma.$executeRawUnsafe(
            `INSERT INTO ad_creative_metrics
              (id, campaign_id, adset_id, ad_id, ad_name, date, impressions, reach, clicks, link_clicks, landing_page_views, spend, conversions, messaging_conversations, ctr, cpc, cpl, cpm, video_thruplay, video_p25, video_p50, video_p75, video_p100, video_3sec_views, hook_rate, hold_rate, platform)
              VALUES ${adPlaceholders.join(', ')}
              ON CONFLICT (ad_id, date, platform)
              DO UPDATE SET
                impressions = EXCLUDED.impressions,
                reach = EXCLUDED.reach,
                clicks = EXCLUDED.clicks,
                link_clicks = EXCLUDED.link_clicks,
                landing_page_views = EXCLUDED.landing_page_views,
                spend = EXCLUDED.spend,
                conversions = EXCLUDED.conversions,
                messaging_conversations = EXCLUDED.messaging_conversations,
                ctr = EXCLUDED.ctr,
                cpc = EXCLUDED.cpc,
                cpl = EXCLUDED.cpl,
                cpm = EXCLUDED.cpm,
                video_thruplay = EXCLUDED.video_thruplay,
                video_p25 = EXCLUDED.video_p25,
                video_p50 = EXCLUDED.video_p50,
                video_p75 = EXCLUDED.video_p75,
                video_p100 = EXCLUDED.video_p100,
                video_3sec_views = EXCLUDED.video_3sec_views,
                hook_rate = EXCLUDED.hook_rate,
                hold_rate = EXCLUDED.hold_rate,
               ad_name = EXCLUDED.ad_name`,
            ...adValues
          );
        }
      }

      await progress.completeUnit(chunk.since, chunk.until);
    }

    // Persist creative metadata snapshots and link them to ad metrics (non-fatal)
    if (syncedAdIds.size > 0) {
      try {
        const adDetails = await metaService.fetchAdsByIds(Array.from(syncedAdIds));

        const creativeKeyToSnapshot = new Map<string, ReturnType<typeof extractCreativeSnapshot>>();
        const adToCreativeKey = new Map<string, string>();

        for (const ad of adDetails as MetaAd[]) {
          if (!ad?.id || !ad.creative?.id) continue;
          const snapshot = extractCreativeSnapshot(ad.creative);
          const key = `${snapshot.creativeId}:${snapshot.contentHash}`;
          if (!creativeKeyToSnapshot.has(key)) {
            creativeKeyToSnapshot.set(key, snapshot);
          }
          adToCreativeKey.set(ad.id, key);
        }

        const snapshots = Array.from(creativeKeyToSnapshot.values());
        if (snapshots.length > 0) {
          const columnsPerRow = 22;
          const batchSize = getBatchSize(columnsPerRow);
          const snapshotKeyToId = new Map<string, string>();

          for (let offset = 0; offset < snapshots.length; offset += batchSize) {
            const batch = snapshots.slice(offset, offset + batchSize);
            const placeholders: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            for (const snap of batch) {
              const rowPh: string[] = [];
              for (let i = 0; i < columnsPerRow; i++) {
                const placeholderIndex = paramIndex++;
                const needsJsonb = i >= 14;
                rowPh.push(needsJsonb ? `$${placeholderIndex}::jsonb` : `$${placeholderIndex}`);
              }
              placeholders.push(`(${rowPh.join(', ')})`);

              values.push(
                uuidv4(), // id
                snap.creativeId,
                'meta',
                snap.contentHash,
                snap.headline,
                snap.primaryText,
                snap.description,
                snap.ctaType,
                snap.destinationUrl,
                snap.imageUrl,
                snap.thumbnailUrl,
                snap.videoId,
                snap.format,
                snap.isDynamic,
                toJsonb(snap.headlines),
                toJsonb(snap.primaryTexts),
                toJsonb(snap.descriptions),
                toJsonb(snap.ctaTypes),
                toJsonb(snap.destinationUrls),
                snap.objectStorySpec,
                snap.assetFeedSpec,
                snap.raw
              );
            }

            // Use $queryRawUnsafe to get RETURNING values
            const result = await ctx.prisma.$queryRawUnsafe(
              `INSERT INTO ad_creative_snapshots
                (id, creative_id, platform, content_hash, headline, primary_text, description, cta_type, destination_url, image_url, thumbnail_url, video_id, format, is_dynamic, headlines, primary_texts, descriptions, cta_types, destination_urls, object_story_spec, asset_feed_spec, raw)
               VALUES ${placeholders.join(', ')}
               ON CONFLICT (creative_id, content_hash, platform)
               DO UPDATE SET last_seen_at = NOW()
               RETURNING id, creative_id, content_hash`,
              ...values
            );

            for (const row of result as any[]) {
              const key = `${row.creative_id}:${row.content_hash}`;
              snapshotKeyToId.set(key, row.id);
            }
          }

          const adMappings = Array.from(adToCreativeKey.entries())
            .map(([adId, key]) => {
              const snapshotId = snapshotKeyToId.get(key);
              const [creativeId] = key.split(':');
              if (!snapshotId || !creativeId) return null;
              return { adId, creativeId, snapshotId };
            })
            .filter((row): row is { adId: string; creativeId: string; snapshotId: string } => Boolean(row));

          if (adMappings.length > 0) {
            const mappingBatchSize = getBatchSize(3);
            for (let offset = 0; offset < adMappings.length; offset += mappingBatchSize) {
              const batch = adMappings.slice(offset, offset + mappingBatchSize);
              const placeholders: string[] = [];
              const values: any[] = [];
              let paramIndex = 1;

              for (const map of batch) {
                const rowPh: string[] = [];
                for (let i = 0; i < 3; i++) rowPh.push(`$${paramIndex++}`);
                placeholders.push(`(${rowPh.join(', ')})`);
                values.push(map.adId, map.creativeId, map.snapshotId);
              }

              values.push(new Date(since), new Date(until));
              const sinceParam = paramIndex++;
              const untilParam = paramIndex++;

              await ctx.prisma.$executeRawUnsafe(
                `UPDATE ad_creative_metrics m
                 SET creative_id = v.creative_id,
                     creative_snapshot_id = v.snapshot_id
                 FROM (VALUES ${placeholders.join(', ')}) AS v(ad_id, creative_id, snapshot_id)
                 WHERE m.ad_id = v.ad_id
                   AND m.date >= $${sinceParam}
                   AND m.date <= $${untilParam}
                   AND m.platform = 'meta'`,
                ...values
              );
            }
          }
        }
      } catch (creativeError) {
        log.error(
          {
            error: creativeError instanceof Error ? creativeError.message : creativeError,
            stack: creativeError instanceof Error ? creativeError.stack : undefined,
          },
          'Failed to sync creative metadata snapshots (non-fatal)'
        );
      }
    }

    await progress.completeUnit(null, null, 'Criativos: snapshots e vínculo');

    if (totalAdInsights > 0) {
      log.info({ adInsights: totalAdInsights }, 'Ad creative metrics synced');
    } else {
      log.warn({ since, until }, 'No ad insights found from Meta API');
    }
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to sync ad creative metrics (non-fatal)'
    );
  }
};
