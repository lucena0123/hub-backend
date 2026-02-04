import { FastifyPluginAsync } from 'fastify';
import { validateMetaSync } from '../validators/meta-sync';
import { MetaAdsService, type MetaAd, type MetaAdCreative } from '../services/meta-ads-service';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

type IsoDateRange = { since: string; until: string };

const parseIsoDateUtc = (value: string) => new Date(`${value}T00:00:00Z`);
const toIsoDateUtc = (date: Date) => date.toISOString().split('T')[0];
const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const getMetaSyncChunkDays = () => {
  const raw = process.env.META_SYNC_CHUNK_DAYS;
  if (!raw) return 30;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 30;
  return parsed;
};

const splitDateRange = (since: string, until: string, chunkDays: number): IsoDateRange[] => {
  const start = parseIsoDateUtc(since);
  const end = parseIsoDateUtc(until);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || chunkDays <= 0) {
    return [{ since, until }];
  }

  const ranges: IsoDateRange[] = [];
  let cursor = start;

  while (cursor <= end) {
    let chunkEnd = addUtcDays(cursor, chunkDays - 1);
    if (chunkEnd > end) chunkEnd = end;

    ranges.push({
      since: toIsoDateUtc(cursor),
      until: toIsoDateUtc(chunkEnd),
    });

    cursor = addUtcDays(chunkEnd, 1);
  }

  return ranges;
};

const MAX_PG_PARAMS = 65000;
const MAX_BATCH_ROWS = 1000;
const getBatchSize = (columnsPerRow: number) =>
  Math.max(1, Math.min(MAX_BATCH_ROWS, Math.floor(MAX_PG_PARAMS / columnsPerRow)));

type RunningMetaSyncJob = {
  syncId: string;
  accountId: string;
  startedAt: number;
  promise: Promise<void>;
};

const runningMetaSyncJobsByAccount = new Map<string, RunningMetaSyncJob>();

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
};

const hashPayload = (payload: unknown) =>
  createHash('sha256').update(stableStringify(payload)).digest('hex');

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const extractStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        return normalizeText(rec.text ?? rec.message ?? rec.name ?? rec.value);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
  const unique = Array.from(new Set(items));
  return unique.length > 0 ? unique : null;
};

const extractDestinationUrls = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        return normalizeText(rec.website_url ?? rec.link ?? rec.url ?? rec.value);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
  const unique = Array.from(new Set(items));
  return unique.length > 0 ? unique : null;
};

const toJsonb = (value: unknown) => {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
};

const extractCreativeSnapshot = (creative: MetaAdCreative) => {
  const objectStorySpec = (creative as any).object_story_spec ?? null;
  const assetFeedSpec = (creative as any).asset_feed_spec ?? null;
  const isDynamic = Boolean(assetFeedSpec && typeof assetFeedSpec === 'object');

  const assetHeadlines =
    extractStringArray((assetFeedSpec as any)?.titles) ??
    extractStringArray((assetFeedSpec as any)?.headlines);
  const assetPrimaryTexts =
    extractStringArray((assetFeedSpec as any)?.bodies) ??
    extractStringArray((assetFeedSpec as any)?.primary_texts);
  const assetDescriptions = extractStringArray((assetFeedSpec as any)?.descriptions);
  const assetCtaTypes = extractStringArray((assetFeedSpec as any)?.call_to_action_types);
  const assetDestinationUrls = extractDestinationUrls((assetFeedSpec as any)?.link_urls);

  const linkData = (objectStorySpec as any)?.link_data;
  const videoData = (objectStorySpec as any)?.video_data;

  const storyHeadline = normalizeText(linkData?.name ?? videoData?.title ?? videoData?.name);
  const storyPrimaryText = normalizeText(linkData?.message ?? videoData?.message);
  const storyDescription = normalizeText(linkData?.description);
  const storyDestinationUrl = normalizeText(linkData?.link ?? videoData?.call_to_action?.value?.link);
  const storyCtaType = normalizeText(linkData?.call_to_action?.type ?? videoData?.call_to_action?.type);

  const headline =
    normalizeText(creative.title) ??
    assetHeadlines?.[0] ??
    storyHeadline;
  const primaryText =
    normalizeText(creative.body) ??
    assetPrimaryTexts?.[0] ??
    storyPrimaryText;
  const description =
    normalizeText((creative as any).description) ??
    assetDescriptions?.[0] ??
    storyDescription;
  const ctaType =
    normalizeText((creative as any).call_to_action_type) ??
    assetCtaTypes?.[0] ??
    storyCtaType;
  const destinationUrl =
    normalizeText((creative as any).link_url) ??
    assetDestinationUrls?.[0] ??
    storyDestinationUrl;

  const imageUrl = normalizeText((creative as any).image_url);
  const thumbnailUrl = normalizeText((creative as any).thumbnail_url);
  const videoId = normalizeText((creative as any).video_id ?? videoData?.video_id);

  let format: string | null = null;
  const objectType = normalizeText((creative as any).object_type);
  if (isDynamic) format = 'dynamic';
  else if (objectType) format = objectType;
  else if (videoId || videoData) format = 'video';
  else if (linkData?.child_attachments?.length) format = 'carousel';
  else if (imageUrl) format = 'image';

  const contentHash = hashPayload({
    headline,
    primaryText,
    description,
    ctaType,
    destinationUrl,
    imageUrl,
    thumbnailUrl,
    videoId,
    format,
    isDynamic,
    headlines: assetHeadlines,
    primaryTexts: assetPrimaryTexts,
    descriptions: assetDescriptions,
    ctaTypes: assetCtaTypes,
    destinationUrls: assetDestinationUrls,
    objectStorySpec,
    assetFeedSpec,
  });

  return {
    creativeId: creative.id,
    contentHash,
    headline,
    primaryText,
    description,
    ctaType,
    destinationUrl,
    imageUrl,
    thumbnailUrl,
    videoId,
    format,
    isDynamic,
    headlines: assetHeadlines,
    primaryTexts: assetPrimaryTexts,
    descriptions: assetDescriptions,
    ctaTypes: assetCtaTypes,
    destinationUrls: assetDestinationUrls,
    objectStorySpec,
    assetFeedSpec,
    raw: creative as any,
  };
};

const metaSyncRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
  const { syncHistory: syncHistoryService, cache: cacheService } = fastify.services;

  const syncMetaAdsHandler = async (request: any, reply: any) => {
    const startTime = Date.now();
    let syncId: string | null = null;
    let syncMetadata: Record<string, unknown> | null = null;

    try {
      const validation = validateMetaSync(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const body = validation.data!;

      const accessToken = process.env.META_ACCESS_TOKEN;

      const fromBody = typeof body.accountId === 'string' && body.accountId.trim()
        ? body.accountId.trim().replace(/^act_/i, '')
        : null;

      let fromClient: string | null = null;
      if (body.clientId) {
        const clientResult = await pool.query(
          'SELECT "metaAdAccountId" FROM clients WHERE id = $1',
          [body.clientId]
        );
        const stored = clientResult.rows?.[0]?.metaAdAccountId;
        if (typeof stored === 'string' && stored.trim()) {
          fromClient = stored.trim().replace(/^act_/i, '');
        }
      }

      if (fromBody && fromClient && fromBody !== fromClient) {
        reply.status(400);
        return {
          error: 'Meta Ad Account mismatch',
          message:
            'O Meta Ad Account ID informado não corresponde ao Meta Ad Account ID cadastrado para este cliente. Corrija o cadastro do cliente ou remova o accountId do body.',
        };
      }

      const adAccountId = fromBody || fromClient || process.env.META_AD_ACCOUNT_ID || null;

      if (!accessToken || !adAccountId) {
        reply.status(400);
        return {
          error: 'Missing Meta Ads credentials',
          message:
            'Defina META_ACCESS_TOKEN e META_AD_ACCOUNT_ID no .env (backend) ou configure o Meta Ad Account ID no cadastro do cliente.',
        };
      }

      const resolveDateRange = (since?: string, until?: string) => {
        if (since && until) {
          return { since, until };
        }
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return {
          since: start.toISOString().split('T')[0],
          until: end.toISOString().split('T')[0],
        };
      };

      const { since, until } = resolveDateRange(body.since, body.until);
      const chunkDays = getMetaSyncChunkDays();
      const dateChunks = splitDateRange(since, until, chunkDays);

      const shouldRunAsync =
        body.async || body.syncLevel === 'full' || (body.since && body.until && dateChunks.length > 1);

      if (shouldRunAsync) {
        const existing = runningMetaSyncJobsByAccount.get(adAccountId);
        if (existing) {
          reply.status(202);
          return {
            success: true,
            async: true,
            alreadyRunning: true,
            syncId: existing.syncId,
            message: 'Já existe uma sincronização em andamento para esta conta.',
            totalInsights: 0,
            mapped: 0,
          };
        }
      }

      const breakdownUnits = body.syncLevel === 'full' ? dateChunks.length * 3 : 0;
      const adUnits = body.syncLevel === 'ad' || body.syncLevel === 'full' ? dateChunks.length + 1 : 0; // +1 = creative metadata linking
      const totalUnits =
        dateChunks.length + // campaign metrics always
        (body.syncLevel === 'adset' || body.syncLevel === 'full' ? dateChunks.length : 0) +
        adUnits +
        breakdownUnits;

      syncId = await syncHistoryService.createSyncRecord({
        platform: 'meta',
        accountId: adAccountId,
        dateRangeStart: since,
        dateRangeEnd: until,
        dryRun: body.dryRun,
        triggeredBy: 'manual',
        metadata: {
          state: 'running',
          syncLevel: body.syncLevel,
          chunkDays,
          chunksTotal: dateChunks.length,
          progress: {
            overallTotal: totalUnits,
            overallCompleted: 0,
            stage: 'campaign',
            stageTotal: dateChunks.length,
            stageCompleted: 0,
            currentSince: null,
            currentUntil: null,
            message: 'Preparando sincronização...',
            updatedAt: new Date().toISOString(),
          },
        },
      });

      syncMetadata = {
        state: 'running',
        syncLevel: body.syncLevel,
        chunkDays,
        chunksTotal: dateChunks.length,
        progress: {
          overallTotal: totalUnits,
          overallCompleted: 0,
          stage: 'campaign',
          stageTotal: dateChunks.length,
          stageCompleted: 0,
          currentSince: null,
          currentUntil: null,
          message: 'Preparando sincronização...',
          updatedAt: new Date().toISOString(),
        },
      };

      const updateProgress = async (next: Partial<Record<string, unknown>>) => {
        if (!syncId || !syncMetadata) return;
        const currentProgress = (syncMetadata.progress as Record<string, unknown>) || {};
        syncMetadata = {
          ...syncMetadata,
          progress: {
            ...currentProgress,
            ...next,
            updatedAt: new Date().toISOString(),
          },
        };
        await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
      };

      fastify.log.info({ since, until, accountId: adAccountId, dryRun: body.dryRun, syncId }, 'Starting Meta Ads sync');
      fastify.log.info({ chunks: dateChunks.length, chunkDays }, 'Meta sync will run in chunks');

      const metaService = new MetaAdsService({
        accessToken,
        adAccountId,
        apiVersion: process.env.META_API_VERSION,
      });

      const runSyncWork = async () => {
        let overallCompleted = 0;
        let stageCompleted = 0;

        const setStage = async (stage: string, stageTotal: number, message: string) => {
          stageCompleted = 0;
          await updateProgress({
            stage,
            stageTotal,
            stageCompleted,
            message,
          });
        };

        const completeUnit = async (currentSince: string | null, currentUntil: string | null, message?: string) => {
          overallCompleted += 1;
          stageCompleted += 1;
          await updateProgress({
            overallCompleted,
            stageCompleted,
            currentSince,
            currentUntil,
            ...(message ? { message } : {}),
          });
        };

      // Auto-import campaigns if clientId is provided
      if (body.clientId) {
        try {
          const campaigns = await metaService.fetchCampaigns();

          if (campaigns && campaigns.length > 0) {
            const values: any[] = [];
            const placeholders: string[] = [];
            let pIndex = 1;

            for (const camp of campaigns) {
              const rowPh: string[] = [];
              for (let i = 0; i < 7; i++) rowPh.push(`$${pIndex++}`);
              placeholders.push(`(${rowPh.join(', ')})`);

              values.push(
                uuidv4(), // id
                camp.id, // externalId
                'meta', // platform
                camp.name, // name
                camp.status || 'archived', // status
                body.clientId, // clientId
                0 // budget (placeholder)
              );
            }

            if (placeholders.length > 0) {
              await pool.query(
                `INSERT INTO campaigns (id, "externalId", platform, name, status, "clientId", budget)
                 VALUES ${placeholders.join(', ')}
                 ON CONFLICT ("externalId") DO UPDATE SET
                   name = EXCLUDED.name,
                   status = EXCLUDED.status,
                   "updatedAt" = NOW()`,
                values
              );
              fastify.log.info({ count: campaigns.length }, 'Auto-imported campaigns from Meta');
            }
          }
        } catch (campError) {
          fastify.log.error({ error: campError }, 'Failed to auto-import campaigns (non-fatal)');
        }
      }

      // NOTE: Everything below can take minutes. If shouldRunAsync=true, we run this work
      // in the background and respond immediately. Otherwise, we await it and return the result.

      const campaignsResult = await pool.query(
        'SELECT id, "externalId" FROM campaigns WHERE platform = $1',
        ['meta']
      );
      const campaignMap = new Map<string, string>(
        campaignsResult.rows.map((row) => [row.externalId, row.id])
      );

      const parseNumber = (value?: string) => (value ? Number(value) : 0);
      const sumActions = (rows: Array<{ action_type: string; value: string }> | undefined, types: string[]) => {
        if (!rows) return 0;
        return rows
          .filter((row) => types.includes(row.action_type))
          .reduce((sum, row) => sum + parseNumber(row.value), 0);
      };

      const purchaseTypes = [
        'purchase',
        'offsite_conversion.purchase',
        'omni_purchase',
        'onsite_conversion.purchase',
        'web_purchase',
        'mobile_purchase',
      ];
      const leadTypes = ['lead', 'leadgen', 'omni_lead'];
      const messagingConversationTypes = [
        'onsite_conversion.messaging_conversation_started_7d',
        'messaging_conversation_started_7d',
      ];
      const messagingReplyTypes = [
        'onsite_conversion.messaging_first_reply',
        'messaging_first_reply',
      ];
      const linkClickTypes = ['link_click'];
      const landingPageViewTypes = ['landing_page_view'];

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

      const unmapped = new Set<string>();
      let totalInsights = 0;
      let mappedTotal = 0;
      let updated = 0;

      const upsertCampaignMetrics = async (metrics: MappedCampaignMetric[]) => {
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

          const result = await pool.query(
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

      await setStage('campaign', dateChunks.length, 'Sincronizando métricas de campanhas...');

      for (const chunk of dateChunks) {
        const insights = await metaService.fetchCampaignInsights(chunk);
        totalInsights += insights.length;

        fastify.log.info(
          { since: chunk.since, until: chunk.until, insightsCount: insights.length },
          'Fetched insights from Meta API'
        );

        if (insights.length > 0) {
          const mappedMetrics: MappedCampaignMetric[] = [];

          for (const row of insights) {
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

            const conversions = purchases > 0 ? purchases : (messagingConversations > 0 ? messagingConversations : leads);

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

          if (!body.dryRun && mappedMetrics.length > 0) {
            updated += await upsertCampaignMetrics(mappedMetrics);
          }
        }

        await completeUnit(chunk.since, chunk.until);
      }

      if (totalInsights === 0) {
        const duration = Date.now() - startTime;

        if (syncId) {
          await syncHistoryService.completeSyncSuccess(syncId, {
            totalInsights: 0,
            mappedCampaigns: 0,
            updatedMetrics: 0,
            unmappedCampaigns: [],
            durationMs: duration,
          });
        }

        if (syncId && syncMetadata) {
          const progress = (syncMetadata.progress as Record<string, unknown>) || {};
          syncMetadata = {
            ...syncMetadata,
            state: 'success',
            progress: {
              ...progress,
              overallCompleted: totalUnits,
              stageCompleted: progress.stageTotal ?? progress.stageCompleted ?? 0,
              currentSince: null,
              currentUntil: null,
              message: 'Concluído (nenhum insight no período).',
              updatedAt: new Date().toISOString(),
            },
          };
          await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
        }

        fastify.log.info({ syncId, duration }, 'Meta sync completed - no insights found');
        return {
          success: true,
          message: 'No insights returned for the selected period',
          totalInsights: 0,
          mapped: 0,
          unmapped: 0,
          since,
          until,
          duration,
        };
      }

      if (body.dryRun) {
        const duration = Date.now() - startTime;

        if (syncId) {
          await syncHistoryService.completeSyncSuccess(syncId, {
            totalInsights,
            mappedCampaigns: mappedTotal,
            updatedMetrics: 0,
            unmappedCampaigns: Array.from(unmapped),
            durationMs: duration,
          });
        }

        if (syncId && syncMetadata) {
          const progress = (syncMetadata.progress as Record<string, unknown>) || {};
          syncMetadata = {
            ...syncMetadata,
            state: unmapped.size > 0 ? 'partial' : 'success',
            progress: {
              ...progress,
              overallCompleted: totalUnits,
              stageCompleted: progress.stageTotal ?? progress.stageCompleted ?? 0,
              currentSince: null,
              currentUntil: null,
              message: 'Concluído (dry-run).',
              updatedAt: new Date().toISOString(),
            },
          };
          await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
        }

        fastify.log.info({
          syncId,
          totalInsights,
          mapped: mappedTotal,
          unmapped: unmapped.size,
          duration
        }, 'Meta sync dry-run completed');
        return {
          success: true,
          dryRun: true,
          syncId,
          totalInsights,
          mapped: mappedTotal,
          unmapped: Array.from(unmapped),
          since,
          until,
          duration,
        };
      }

      // Sync ad set metrics if requested
      if (body.syncLevel === 'adset' || body.syncLevel === 'full') {
        try {
          await setStage('adset', dateChunks.length, 'Sincronizando métricas de conjuntos de anúncios...');
          let totalAdsetInsights = 0;
          const adsetBatchSize = getBatchSize(20);

          for (const chunk of dateChunks) {
            const adsetInsights = await metaService.fetchAdSetInsights(chunk);
            totalAdsetInsights += adsetInsights.length;

            if (adsetInsights.length === 0) {
              await completeUnit(chunk.since, chunk.until);
              continue;
            }

            for (let offset = 0; offset < adsetInsights.length; offset += adsetBatchSize) {
              const batch = adsetInsights.slice(offset, offset + adsetBatchSize);
              const adsetValues: any[] = [];
              const adsetPlaceholders: string[] = [];
              let adsetParamIndex = 1;

              for (const row of batch) {
                const campaignId = campaignMap.get(row.campaign_id);
                if (!campaignId) continue;
                if (!row.adset_id) {
                  fastify.log.warn({ row }, 'Skipping adset with missing adset_id');
                  continue;
                }

                const impressions = Math.round(parseNumber(row.impressions));
                const reach = Math.round(parseNumber(row.reach));
                const clicks = Math.round(parseNumber(row.clicks));
                const spend = parseNumber(row.spend);
                const conversations = sumActions(row.actions, messagingConversationTypes);
                const replies = sumActions(row.actions, messagingReplyTypes);
                const leads = sumActions(row.actions, leadTypes);
                const purchases = sumActions(row.actions, purchaseTypes);
                const conversions = purchases > 0 ? purchases : (conversations > 0 ? conversations : leads);
                const ctr = parseNumber(row.ctr);
                const cpc = parseNumber(row.cpc);
                const cpm = parseNumber(row.cpm);
                const frequency = parseNumber(row.frequency);
                const cpl = leads > 0 ? spend / leads : 0;

                const rowPh: string[] = [];
                for (let i = 0; i < 20; i++) {
                  rowPh.push(`$${adsetParamIndex++}`);
                }
                adsetPlaceholders.push(`(${rowPh.join(', ')})`);

                adsetValues.push(
                  uuidv4(),
                  campaignId,
                  row.adset_id,
                  row.adset_name || null,
                  row.date_start,
                  impressions,
                  reach,
                  clicks,
                  spend,
                  conversions,
                  leads,
                  conversations,
                  replies,
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
                await pool.query(
                  `INSERT INTO adset_metrics
                   (id, campaign_id, adset_id, adset_name, date, impressions, reach, clicks, spend, conversions, leads, messaging_conversations, messaging_first_reply, ctr, cpc, cpl, cpm, frequency, quality_ranking, platform)
                   VALUES ${adsetPlaceholders.join(', ')}
                   ON CONFLICT (adset_id, date, platform)
                   DO UPDATE SET
                     impressions = EXCLUDED.impressions,
                     reach = EXCLUDED.reach,
                     clicks = EXCLUDED.clicks,
                     spend = EXCLUDED.spend,
                     conversions = EXCLUDED.conversions,
                     leads = EXCLUDED.leads,
                     messaging_conversations = EXCLUDED.messaging_conversations,
                     messaging_first_reply = EXCLUDED.messaging_first_reply,
                     ctr = EXCLUDED.ctr,
                     cpc = EXCLUDED.cpc,
                     cpl = EXCLUDED.cpl,
                     cpm = EXCLUDED.cpm,
                     frequency = EXCLUDED.frequency,
                     quality_ranking = EXCLUDED.quality_ranking,
                     adset_name = EXCLUDED.adset_name`,
                  adsetValues
                );
              }
            }

            await completeUnit(chunk.since, chunk.until);
          }

          fastify.log.info({ adsetInsights: totalAdsetInsights }, 'Ad set metrics synced');
        } catch (adsetError) {
          fastify.log.error({ error: adsetError }, 'Failed to sync ad set metrics (non-fatal)');
        }
      }

      // Sync ad/creative metrics if requested
      if (body.syncLevel === 'ad' || body.syncLevel === 'full') {
        try {
          await setStage('ad', dateChunks.length + 1, 'Sincronizando métricas de anúncios/criativos...');
          let totalAdInsights = 0;
          const syncedAdIds = new Set<string>();

          const sumVideoActions = (actions: Array<{ action_type: string; value: string }> | undefined) => {
            if (!actions) return 0;
            return actions.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
          };
          const adBatchSize = getBatchSize(25);

          for (const chunk of dateChunks) {
            const adInsights = await metaService.fetchAdInsights(chunk);
            totalAdInsights += adInsights.length;

            if (adInsights.length === 0) {
              await completeUnit(chunk.since, chunk.until);
              continue;
            }

            for (let offset = 0; offset < adInsights.length; offset += adBatchSize) {
              const batch = adInsights.slice(offset, offset + adBatchSize);
              const adValues: any[] = [];
              const adPlaceholders: string[] = [];
              let adParamIndex = 1;

              for (const row of batch) {
                const campaignId = campaignMap.get(row.campaign_id);
                if (!campaignId) continue;
                if (!row.ad_id) {
                  fastify.log.warn({ row }, 'Skipping ad with missing ad_id');
                  continue;
                }
                syncedAdIds.add(row.ad_id);

                const impressions = Math.round(parseNumber(row.impressions));
                const reach = Math.round(parseNumber(row.reach));
                const clicks = Math.round(parseNumber(row.clicks));
                const spend = parseNumber(row.spend);
                const conversations = sumActions(row.actions, messagingConversationTypes);
                const leads = sumActions(row.actions, leadTypes);
                const purchases = sumActions(row.actions, purchaseTypes);
                const conversions = purchases > 0 ? purchases : (conversations > 0 ? conversations : leads);
                const thruplay = Math.round(sumVideoActions(row.video_thruplay_watched_actions));
                const p25 = Math.round(sumVideoActions(row.video_p25_watched_actions));
                const p50 = Math.round(sumVideoActions(row.video_p50_watched_actions));
                const p75 = Math.round(sumVideoActions(row.video_p75_watched_actions));
                const p100 = Math.round(sumVideoActions(row.video_p100_watched_actions));
                const video3sec = sumActions(row.actions, ['video_view']);
                const hookRate = impressions > 0 ? (video3sec / impressions) * 100 : 0;
                const holdRate = video3sec > 0 ? (thruplay / video3sec) * 100 : 0;
                const cpl = leads > 0 ? spend / leads : 0;

                const rowPh: string[] = [];
                for (let i = 0; i < 25; i++) {
                  rowPh.push(`$${adParamIndex++}`);
                }
                adPlaceholders.push(`(${rowPh.join(', ')})`);

                adValues.push(
                  uuidv4(),
                  campaignId,
                  row.adset_id || null,
                  row.ad_id,
                  row.ad_name || null,
                  row.date_start,
                  impressions,
                  reach,
                  clicks,
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
                await pool.query(
                  `INSERT INTO ad_creative_metrics
                    (id, campaign_id, adset_id, ad_id, ad_name, date, impressions, reach, clicks, spend, conversions, messaging_conversations, ctr, cpc, cpl, cpm, video_thruplay, video_p25, video_p50, video_p75, video_p100, video_3sec_views, hook_rate, hold_rate, platform)
                    VALUES ${adPlaceholders.join(', ')}
                    ON CONFLICT (ad_id, date, platform)
                    DO UPDATE SET
                      impressions = EXCLUDED.impressions,
                      reach = EXCLUDED.reach,
                      clicks = EXCLUDED.clicks,
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
                  adValues
                );
              }
            }

            await completeUnit(chunk.since, chunk.until);
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
                    for (let i = 0; i < columnsPerRow; i++) rowPh.push(`$${paramIndex++}`);
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

                  const result = await pool.query(
                    `INSERT INTO ad_creative_snapshots
                      (id, creative_id, platform, content_hash, headline, primary_text, description, cta_type, destination_url, image_url, thumbnail_url, video_id, format, is_dynamic, headlines, primary_texts, descriptions, cta_types, destination_urls, object_story_spec, asset_feed_spec, raw)
                     VALUES ${placeholders.join(', ')}
                     ON CONFLICT (creative_id, content_hash, platform)
                     DO UPDATE SET last_seen_at = NOW()
                     RETURNING id, creative_id, content_hash`,
                    values
                  );

                  for (const row of result.rows) {
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

                    values.push(since, until);
                    const sinceParam = paramIndex++;
                    const untilParam = paramIndex++;

                    await pool.query(
                      `UPDATE ad_creative_metrics m
                       SET creative_id = v.creative_id,
                           creative_snapshot_id = v.snapshot_id
                       FROM (VALUES ${placeholders.join(', ')}) AS v(ad_id, creative_id, snapshot_id)
                       WHERE m.ad_id = v.ad_id
                         AND m.date >= $${sinceParam}
                         AND m.date <= $${untilParam}
                         AND m.platform = 'meta'`,
                      values
                    );
                  }
                }
              }
            } catch (creativeError) {
              fastify.log.error({
                error: creativeError instanceof Error ? creativeError.message : creativeError,
                stack: creativeError instanceof Error ? creativeError.stack : undefined
              }, 'Failed to sync creative metadata snapshots (non-fatal)');
            }
          }

          await completeUnit(null, null, 'Criativos: snapshots e vínculo');

          if (totalAdInsights > 0) {
            fastify.log.info({ adInsights: totalAdInsights }, 'Ad creative metrics synced');
          } else {
            fastify.log.warn({ since, until }, 'No ad insights found from Meta API');
          }
        } catch (adError) {
          fastify.log.error({
            error: adError instanceof Error ? adError.message : adError,
            stack: adError instanceof Error ? adError.stack : undefined
          }, 'Failed to sync ad creative metrics (non-fatal)');
        }
      }

      // Sync breakdowns if requested
      if (body.syncLevel === 'full') {
        const syncDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        try {
          const breakdownTypes = [
            { type: 'age_gender', breakdowns: ['age', 'gender'] },
            { type: 'platform_position', breakdowns: ['publisher_platform', 'platform_position'] },
            { type: 'device', breakdowns: ['device_platform'] },
          ];

          await setStage(
            'breakdowns',
            dateChunks.length * breakdownTypes.length,
            'Sincronizando breakdowns (público, posicionamento, dispositivo)...'
          );

          for (const chunk of dateChunks) {
            for (const bd of breakdownTypes) {
              try {
                await syncDelay(200);
                const bdInsights = await metaService.fetchBreakdownInsights({
                  since: chunk.since,
                  until: chunk.until,
                  breakdowns: bd.breakdowns,
                });

                const grouped = new Map<string, any[]>();
                for (const row of bdInsights) {
                  const cId = campaignMap.get(row.campaign_id);
                  if (!cId) continue;

                  const key = `${cId}:${row.date_start}`;
                  if (!grouped.has(key)) grouped.set(key, []);

                  const segment: any = {
                    impressions: Math.round(parseNumber(row.impressions)),
                    clicks: Math.round(parseNumber(row.clicks)),
                    spend: parseNumber(row.spend),
                    reach: Math.round(parseNumber(row.reach)),
                  };

                  if (row.age) segment.age = row.age;
                  if (row.gender) segment.gender = row.gender;
                  if (row.publisher_platform) segment.publisher_platform = row.publisher_platform;
                  if (row.platform_position) segment.platform_position = row.platform_position;
                  if (row.device_platform) segment.device_platform = row.device_platform;

                  if (bd.type === 'age_gender') {
                    segment.label = `${row.age || '?'} ${row.gender || '?'}`;
                  } else if (bd.type === 'platform_position') {
                    segment.label = `${row.publisher_platform || '?'} - ${row.platform_position || '?'}`;
                  } else {
                    segment.label = row.device_platform || '?';
                  }

                  const conversations = sumActions(row.actions, messagingConversationTypes);
                  segment.messaging_conversations = conversations;

                  grouped.get(key)!.push(segment);
                }

                for (const [key, segments] of grouped.entries()) {
                  const [cId, date] = key.split(':');
                  const totalSpend = segments.reduce((s: number, seg: any) => s + seg.spend, 0);
                  const totalImpressions = segments.reduce((s: number, seg: any) => s + seg.impressions, 0);
                  const totalConversions = segments.reduce((s: number, seg: any) => s + (seg.messaging_conversations || 0), 0);

                  await pool.query(
                    `INSERT INTO metrics_breakdowns (id, campaign_id, date, breakdown_type, breakdown_data, total_spend, total_impressions, total_conversions, platform)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'meta')
                     ON CONFLICT (campaign_id, date, breakdown_type, platform)
                     DO UPDATE SET breakdown_data = $5, total_spend = $6, total_impressions = $7, total_conversions = $8`,
                    [uuidv4(), cId, date, bd.type, JSON.stringify(segments), totalSpend, totalImpressions, totalConversions]
                  );
                }

                fastify.log.info(
                  { type: bd.type, since: chunk.since, until: chunk.until, rows: bdInsights.length },
                  'Breakdown synced'
                );
              } catch (error) {
                fastify.log.error({ error, breakdownType: bd.type }, 'Breakdown sync failed (non-fatal)');
              } finally {
                await completeUnit(chunk.since, chunk.until, `Breakdown: ${bd.type}`);
              }
            }
          }
        } catch (bdError) {
          fastify.log.error({ error: bdError }, 'Failed to sync breakdowns (non-fatal)');
        }
      }

      if (cacheService) {
        await cacheService.invalidatePattern('dashboard:*');
        await cacheService.invalidatePattern('campaigns:*');
      }

      const duration = Date.now() - startTime;

      if (syncId) {
        await syncHistoryService.completeSyncSuccess(syncId, {
          totalInsights,
          mappedCampaigns: mappedTotal,
          updatedMetrics: updated,
          unmappedCampaigns: Array.from(unmapped),
          durationMs: duration,
        });
      }

      fastify.log.info({
        syncId,
        totalInsights,
        mapped: mappedTotal,
        updated,
        unmapped: unmapped.size,
        duration
      }, 'Meta sync completed successfully');

      if (syncId && syncMetadata) {
        syncMetadata = {
          ...syncMetadata,
          state: unmapped.size > 0 ? 'partial' : 'success',
        };
        await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
      }

      return {
        success: true,
        syncId,
        totalInsights,
        mapped: mappedTotal,
        updated,
        unmapped: Array.from(unmapped),
        since,
        until,
        duration,
      };
      };

      if (shouldRunAsync) {
        const accountKey = adAccountId;
        const startedAt = Date.now();

        const jobPromise: Promise<void> = (async () => {
          try {
            await runSyncWork();
          } catch (error) {
            const duration = Date.now() - startTime;

            if (syncId && error instanceof Error) {
              await syncHistoryService.completeSyncFailure(syncId, error, duration);
            }

            if (syncId && syncMetadata) {
              syncMetadata = {
                ...syncMetadata,
                state: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
              };
              await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
            }

            fastify.log.error(
              {
                syncId,
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                duration,
              },
              'Meta sync failed (async)'
            );
          } finally {
            const running = runningMetaSyncJobsByAccount.get(accountKey);
            if (running && running.startedAt === startedAt) {
              runningMetaSyncJobsByAccount.delete(accountKey);
            }
          }
        })();

        runningMetaSyncJobsByAccount.set(accountKey, {
          syncId,
          accountId: accountKey,
          startedAt,
          promise: jobPromise,
        });

        reply.status(202);
        return {
          success: true,
          async: true,
          syncId,
          message: 'Sincronização iniciada. Acompanhe o progresso no histórico de sync.',
          totalInsights: 0,
          mapped: 0,
        };
      }

      return await runSyncWork();
    } catch (error) {
      const duration = Date.now() - startTime;

      if (syncId && error instanceof Error) {
        await syncHistoryService.completeSyncFailure(syncId, error, duration);
      }

      if (syncId && syncMetadata) {
        syncMetadata = {
          ...syncMetadata,
          state: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await syncHistoryService.updateSyncMetadata(syncId, syncMetadata);
      }

      fastify.log.error({
        syncId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration
      }, 'Meta sync failed');

      reply.status(500);
      return {
        error: 'Failed to sync Meta Ads metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  };

  fastify.post('/api/metrics/sync/meta', syncMetaAdsHandler);
  fastify.post('/api/metrics/sync', syncMetaAdsHandler);

  // Get sync history
  fastify.get('/api/metrics/sync/history', async (request, reply) => {
    try {
      const { platform, accountId, limit, offset } = request.query as {
        platform?: string;
        accountId?: string;
        limit?: string;
        offset?: string;
      };

      const history = await syncHistoryService.getSyncHistory({
        platform: platform || 'meta',
        accountId,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      });

      const lastSuccess = await syncHistoryService.getLastSuccessfulSync(
        platform || 'meta',
        accountId
      );

      const historyWithState = history.map((record: any) => ({
        ...record,
        state: record.completedAt ? record.status : 'running',
      }));

      return {
        history: historyWithState,
        lastSuccessfulSync: lastSuccess,
        total: historyWithState.length,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch sync history',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get single sync details
  fastify.get('/api/metrics/sync/history/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const result = await pool.query(
        `SELECT
           id, platform, account_id as "accountId",
           date_range_start as "dateRangeStart",
           date_range_end as "dateRangeEnd",
           status, total_insights as "totalInsights",
           mapped_campaigns as "mappedCampaigns",
           updated_metrics as "updatedMetrics",
           unmapped_campaigns as "unmappedCampaigns",
           duration_ms as "durationMs",
           started_at as "startedAt",
           completed_at as "completedAt",
           error_message as "errorMessage",
           error_stack as "errorStack",
           dry_run as "dryRun",
           triggered_by as "triggeredBy",
           metadata
          FROM sync_history
          WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        reply.status(404);
        return { error: 'Sync record not found' };
      }

      const row = result.rows[0];
      const state = row.completedAt ? row.status : 'running';
      return { ...row, state };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch sync details',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default metaSyncRoutes;
