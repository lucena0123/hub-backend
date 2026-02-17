import type { MetaAd } from '../../../services/meta-ads-service';
import { v4 as uuidv4 } from 'uuid';
import { getBatchSize, extractCreativeSnapshot, toJsonb, splitDateRange, parseIsoDateUtc } from '../utils';
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

export type AdMetricsStageResult = {
  totalInsights: number;
  campaignsWithAds: Set<string>;
  failedChunks: { since: string; until: string; error: string }[];
};

export const syncAdMetricsStage = async (ctx: MetaSyncContext): Promise<AdMetricsStageResult> => {
  const { dateChunks, metaService, campaignMap, progress, since, until, log } = ctx;
  const campaignsWithAds = new Set<string>();
  const failedChunks: { since: string; until: string; error: string }[] = [];
  let totalAdInsights = 0;

  await progress.setStage('ad', dateChunks.length + 1, 'Sincronizando métricas de anúncios/criativos...');
  const syncedAdIds = new Set<string>();
  const adBatchSize = getBatchSize(25);
  const maxSplitDepth = 4;

  const isReduceError = (message: string) =>
    /reduce the amount of data|Please reduce the amount of data/i.test(message);

  const diffDaysInclusive = (start: string, end: string) => {
    const sinceDate = parseIsoDateUtc(start);
    const untilDate = parseIsoDateUtc(end);
    if (Number.isNaN(sinceDate.getTime()) || Number.isNaN(untilDate.getTime())) return 1;
    const diffMs = untilDate.getTime() - sinceDate.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  };

  const parseMetaTimestamp = (value: unknown) => {
    if (!value || typeof value !== 'string') return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const fetchAdInsightsWithFallback = async (
    chunk: { since: string; until: string },
    depth: number
  ): Promise<{ rows: any[]; failed: { since: string; until: string; error: string }[] }> => {
    try {
      const rows = await metaService.fetchAdInsights(chunk);
      return { rows, failed: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const days = diffDaysInclusive(chunk.since, chunk.until);
      const canSplit = isReduceError(message) && days > 1 && depth < maxSplitDepth;

      if (canSplit) {
        const nextChunkDays = days > 7 ? 7 : Math.max(1, Math.floor(days / 2));
        const subChunks = splitDateRange(chunk.since, chunk.until, nextChunkDays);
        const aggregated: { rows: any[]; failed: { since: string; until: string; error: string }[] } = { rows: [], failed: [] };
        for (const subChunk of subChunks) {
          const result = await fetchAdInsightsWithFallback(subChunk, depth + 1);
          if (result.rows.length > 0) aggregated.rows.push(...result.rows);
          if (result.failed.length > 0) aggregated.failed.push(...result.failed);
        }
        return aggregated;
      }

      return { rows: [], failed: [{ since: chunk.since, until: chunk.until, error: message }] };
    }
  };

  for (const chunk of dateChunks) {
    let adInsights: any[] = [];
    try {
      const fallbackResult = await fetchAdInsightsWithFallback(chunk, 0);
      adInsights = fallbackResult.rows;
      if (fallbackResult.failed.length > 0) {
        failedChunks.push(...fallbackResult.failed);
      }
      totalAdInsights += adInsights.length;

      if (adInsights.length === 0) {
        await progress.completeUnit(chunk.since, chunk.until);
        continue;
      }

      const dedupedInsights: any[] = [];
      const seenKeys = new Set<string>();
      for (const row of adInsights) {
        if (!row?.ad_id || !row?.date_start) continue;
        const key = `${row.ad_id}:${row.date_start}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        dedupedInsights.push(row);
      }
      if (dedupedInsights.length !== adInsights.length) {
        log.warn(
          {
            since: chunk.since,
            until: chunk.until,
            original: adInsights.length,
            deduped: dedupedInsights.length,
          },
          'Deduplicated ad insights by (ad_id, date_start)'
        );
      }

      for (let offset = 0; offset < dedupedInsights.length; offset += adBatchSize) {
        const batch = dedupedInsights.slice(offset, offset + adBatchSize);
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
          const conversionSource = purchases > 0 ? 'purchase' : conversations > 0 ? 'message' : leads > 0 ? 'lead' : null;
          if (impressions > 0 || clicks > 0 || spend > 0 || conversions > 0) {
            campaignsWithAds.add(campaignId);
          }
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
          for (let i = 0; i < 28; i++) {
            const placeholder = `$${adParamIndex++}`;
            // metadata column (index 26) must be jsonb
            rowPh.push(i === 26 ? `${placeholder}::jsonb` : placeholder);
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
            toJsonb({ leads, purchases, conversionSource }),
            'meta'
          );
        }

        if (adPlaceholders.length > 0) {
          await ctx.prisma.$executeRawUnsafe(
            `INSERT INTO ad_creative_metrics
              (id, campaign_id, adset_id, ad_id, ad_name, date, impressions, reach, clicks, link_clicks, landing_page_views, spend, conversions, messaging_conversations, ctr, cpc, cpl, cpm, video_thruplay, video_p25, video_p50, video_p75, video_p100, video_3sec_views, hook_rate, hold_rate, metadata, platform)
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
                metadata = EXCLUDED.metadata,
               ad_name = EXCLUDED.ad_name`,
            ...adValues
          );
        }
      }

      await progress.completeUnit(chunk.since, chunk.until);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failedChunks.push({ since: chunk.since, until: chunk.until, error: message });
      log.error({ error: message, since: chunk.since, until: chunk.until }, 'Failed to fetch ad insights for chunk');
      await progress.completeUnit(chunk.since, chunk.until, 'Erro ao sincronizar anúncios (chunk)');
    }
  }

  // Persist creative metadata snapshots and link them to ad metrics (non-fatal)
  if (syncedAdIds.size > 0) {
    try {
      const adDetails = await metaService.fetchAdsByIds(Array.from(syncedAdIds));

      const adCreatedTimes = new Map<string, Date>();
      for (const ad of adDetails as MetaAd[]) {
        if (!ad?.id) continue;
        const created = parseMetaTimestamp(ad.created_time);
        if (created) adCreatedTimes.set(ad.id, created);
      }

        const pageIds = new Set<string>();
        const instagramIds = new Set<string>();
        const imageHashes = new Set<string>();
        for (const ad of adDetails as MetaAd[]) {
          const spec = (ad as any)?.creative?.object_story_spec;
          const pageId = spec?.page_id;
          const igId = spec?.instagram_actor_id ?? spec?.instagram_user_id;
          if (pageId) pageIds.add(String(pageId));
          if (igId) instagramIds.add(String(igId));

          const creative = (ad as any)?.creative;
          const assetFeed = creative?.asset_feed_spec;
          const assetImages = Array.isArray(assetFeed?.images) ? assetFeed.images : [];
          for (const img of assetImages) {
            if (img?.hash) imageHashes.add(String(img.hash));
          }
          const linkImageHash = spec?.link_data?.image_hash;
          const photoImageHash = spec?.photo_data?.image_hash;
          const videoImageHash = spec?.video_data?.image_hash;
          if (linkImageHash) imageHashes.add(String(linkImageHash));
          if (photoImageHash) imageHashes.add(String(photoImageHash));
          if (videoImageHash) imageHashes.add(String(videoImageHash));
          if (Array.isArray(spec?.child_attachments)) {
            for (const attachment of spec.child_attachments) {
              if (attachment?.image_hash) imageHashes.add(String(attachment.image_hash));
            }
          }
        }

        const identityMap = await metaService.fetchIdentityDetails([
          ...Array.from(pageIds),
          ...Array.from(instagramIds),
        ]);
        const imageMap = await metaService.fetchAdImagesByHashes(Array.from(imageHashes));

        const creativeKeyToSnapshot = new Map<string, ReturnType<typeof extractCreativeSnapshot>>();
        const adToCreativeKey = new Map<string, string>();

        for (const ad of adDetails as MetaAd[]) {
          if (!ad?.id || !ad.creative?.id) continue;
          const snapshot = extractCreativeSnapshot(ad.creative);
          const creative = (ad as any)?.creative;
          const spec = creative?.object_story_spec ?? null;
          const assetFeed = creative?.asset_feed_spec;
          const assetImages = Array.isArray(assetFeed?.images) ? assetFeed.images : [];
          const primaryImageHash =
            assetImages.find((img: any) => img?.hash)?.hash ??
            spec?.link_data?.image_hash ??
            spec?.photo_data?.image_hash ??
            spec?.video_data?.image_hash ??
            (Array.isArray(spec?.child_attachments)
              ? spec.child_attachments.find((attachment: any) => attachment?.image_hash)?.image_hash
              : null);

          if (!snapshot.imageUrl && primaryImageHash) {
            const resolved = imageMap.get(String(primaryImageHash));
            if (resolved?.url) {
              snapshot.imageUrl = resolved.url;
            }
          }
          const pageId = spec?.page_id ? String(spec.page_id) : null;
          const igId = spec?.instagram_actor_id
            ? String(spec.instagram_actor_id)
            : spec?.instagram_user_id
              ? String(spec.instagram_user_id)
              : null;
          const pageInfo = pageId ? identityMap.get(pageId) : undefined;
          const igInfo = igId ? identityMap.get(igId) : undefined;

          const callToActionValue =
            spec?.link_data?.call_to_action?.value ??
            spec?.video_data?.call_to_action?.value ??
            spec?.template_data?.call_to_action?.value ??
            null;
          const destinationUrl =
            snapshot.destinationUrl ??
            callToActionValue?.link ??
            callToActionValue?.link_url ??
            callToActionValue?.url ??
            null;

          const rawMessage =
            callToActionValue?.message ??
            callToActionValue?.text ??
            callToActionValue?.whatsapp_message ??
            callToActionValue?.welcome_message ??
            null;

          let whatsappNumber: string | null = null;
          let prefillMessage: string | null = rawMessage ? String(rawMessage) : null;

          if (destinationUrl && typeof destinationUrl === 'string') {
            try {
              const url = new URL(destinationUrl);
              const phone = url.searchParams.get('phone') || url.searchParams.get('phone_number');
              const text = url.searchParams.get('text');
              if (!prefillMessage && text) prefillMessage = decodeURIComponent(text);
              if (phone) whatsappNumber = phone.replace(/[^\d]/g, '');
              if (!whatsappNumber && url.hostname.includes('wa.me')) {
                const waPath = url.pathname.replace('/', '').trim();
                if (waPath) whatsappNumber = waPath.replace(/[^\d]/g, '');
              }
            } catch {
              // ignore invalid url
            }
          }

          if (callToActionValue?.phone_number && !whatsappNumber) {
            whatsappNumber = String(callToActionValue.phone_number).replace(/[^\d]/g, '');
          }

          const imageUrls: string[] = [];
          const pushImageUrl = (url?: string | null) => {
            if (!url || typeof url !== 'string') return;
            if (!imageUrls.includes(url)) imageUrls.push(url);
          };
          const pushImageHash = (hash?: string | null) => {
            if (!hash) return;
            const resolved = imageMap.get(String(hash));
            if (resolved?.url) pushImageUrl(resolved.url);
          };

          pushImageUrl(snapshot.imageUrl);
          pushImageUrl(snapshot.thumbnailUrl);
          for (const img of assetImages) {
            pushImageHash(img?.hash ? String(img.hash) : null);
            pushImageUrl(img?.url ?? img?.image_url ?? img?.imageUrl ?? null);
          }
          pushImageHash(spec?.link_data?.image_hash ?? null);
          pushImageHash(spec?.photo_data?.image_hash ?? null);
          pushImageHash(spec?.video_data?.image_hash ?? null);
          pushImageUrl(spec?.link_data?.picture ?? null);
          pushImageUrl(spec?.photo_data?.image_url ?? null);
          if (Array.isArray(spec?.child_attachments)) {
            for (const attachment of spec.child_attachments) {
              pushImageHash(attachment?.image_hash ?? null);
              pushImageUrl(attachment?.image_url ?? attachment?.picture ?? null);
            }
          }

          if (!snapshot.imageUrl && imageUrls.length > 0) {
            snapshot.imageUrl = imageUrls[0];
          }

          const derived = {
            identity: {
              pageId,
              pageName: pageInfo?.name ?? null,
              instagramActorId: igId,
              instagramUsername: igInfo?.username ?? igInfo?.name ?? null,
            },
            whatsapp: {
              number: whatsappNumber,
              prefillMessage,
            },
            images: {
              urls: imageUrls.length > 0 ? imageUrls : null,
            },
          };

          snapshot.raw = { ...(snapshot.raw as any), __derived: derived };
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
               DO UPDATE SET
                 last_seen_at = NOW(),
                 headline = EXCLUDED.headline,
                 primary_text = EXCLUDED.primary_text,
                 description = EXCLUDED.description,
                 cta_type = EXCLUDED.cta_type,
                 destination_url = EXCLUDED.destination_url,
                 image_url = EXCLUDED.image_url,
                 thumbnail_url = EXCLUDED.thumbnail_url,
                 video_id = EXCLUDED.video_id,
                 format = EXCLUDED.format,
                 is_dynamic = EXCLUDED.is_dynamic,
                 headlines = EXCLUDED.headlines,
                 primary_texts = EXCLUDED.primary_texts,
                 descriptions = EXCLUDED.descriptions,
                 cta_types = EXCLUDED.cta_types,
                 destination_urls = EXCLUDED.destination_urls,
                 object_story_spec = EXCLUDED.object_story_spec,
                 asset_feed_spec = EXCLUDED.asset_feed_spec,
                 raw = EXCLUDED.raw
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

        if (adCreatedTimes.size > 0) {
          const createdMappings = Array.from(adCreatedTimes.entries()).map(([adId, createdTime]) => ({
            adId,
            createdTime,
          }));
          const mappingBatchSize = getBatchSize(2);
          for (let offset = 0; offset < createdMappings.length; offset += mappingBatchSize) {
            const batch = createdMappings.slice(offset, offset + mappingBatchSize);
            const placeholders: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            for (const map of batch) {
              const rowPh: string[] = [];
              for (let i = 0; i < 2; i++) rowPh.push(`$${paramIndex++}`);
              placeholders.push(`(${rowPh.join(', ')})`);
              values.push(map.adId, map.createdTime);
            }

            values.push(new Date(since), new Date(until));
            const sinceParam = paramIndex++;
            const untilParam = paramIndex++;

            await ctx.prisma.$executeRawUnsafe(
              `UPDATE ad_creative_metrics m
               SET ad_created_time = v.created_time
               FROM (VALUES ${placeholders.join(', ')}) AS v(ad_id, created_time)
               WHERE m.ad_id = v.ad_id
                 AND m.date >= $${sinceParam}
                 AND m.date <= $${untilParam}
                 AND m.platform = 'meta'`,
              ...values
            );
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

  return {
    totalInsights: totalAdInsights,
    campaignsWithAds,
    failedChunks,
  };
};
