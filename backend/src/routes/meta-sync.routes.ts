import { FastifyPluginAsync } from 'fastify';
import { validateMetaSync } from '../validators/meta-sync';
import { MetaAdsService } from '../services/meta-ads-service';
import { v4 as uuidv4 } from 'uuid';

const metaSyncRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
  const { syncHistory: syncHistoryService, cache: cacheService } = fastify.services;

  const syncMetaAdsHandler = async (request: any, reply: any) => {
    const startTime = Date.now();
    let syncId: string | null = null;

    try {
      const validation = validateMetaSync(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const body = validation.data!;

      const accessToken = process.env.META_ACCESS_TOKEN;
      const adAccountId = body.accountId || process.env.META_AD_ACCOUNT_ID;

      if (!accessToken || !adAccountId) {
        reply.status(400);
        return {
          error: 'Missing Meta Ads credentials',
          message: 'Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID environment variables',
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

      syncId = await syncHistoryService.createSyncRecord({
        platform: 'meta',
        accountId: adAccountId,
        dateRangeStart: since,
        dateRangeEnd: until,
        dryRun: body.dryRun,
        triggeredBy: 'manual',
      });

      fastify.log.info({ since, until, accountId: adAccountId, dryRun: body.dryRun, syncId }, 'Starting Meta Ads sync');

      const metaService = new MetaAdsService({
        accessToken,
        adAccountId,
        apiVersion: process.env.META_API_VERSION,
      });

      const insights = await metaService.fetchCampaignInsights({ since, until });

      fastify.log.info({ insightsCount: insights.length }, 'Fetched insights from Meta API');

      if (insights.length === 0) {
        const duration = Date.now() - startTime;
        fastify.log.info({ duration }, 'Meta sync completed - no insights found');
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

      const mappedMetrics: Array<{
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
      }> = [];
      const unmapped = new Set<string>();

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

      if (body.dryRun) {
        const duration = Date.now() - startTime;

        if (syncId) {
          await syncHistoryService.completeSyncSuccess(syncId, {
            totalInsights: insights.length,
            mappedCampaigns: mappedMetrics.length,
            updatedMetrics: 0,
            unmappedCampaigns: Array.from(unmapped),
            durationMs: duration,
          });
        }

        fastify.log.info({
          syncId,
          totalInsights: insights.length,
          mapped: mappedMetrics.length,
          unmapped: unmapped.size,
          duration
        }, 'Meta sync dry-run completed');
        return {
          success: true,
          dryRun: true,
          syncId,
          totalInsights: insights.length,
          mapped: mappedMetrics.length,
          unmapped: Array.from(unmapped),
          since,
          until,
          duration,
        };
      }

      // Batch insert campaign metrics
      let updated = 0;
      if (mappedMetrics.length > 0) {
        const values: any[] = [];
        const placeholders: string[] = [];
        let paramIndex = 1;

        for (const entry of mappedMetrics) {
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
        updated = result.rowCount || mappedMetrics.length;
      }

      // Sync ad set metrics if requested
      if (body.syncLevel === 'adset' || body.syncLevel === 'full') {
        try {
          const adsetInsights = await metaService.fetchAdSetInsights({ since, until });

          if (adsetInsights.length > 0) {
            const adsetValues: any[] = [];
            const adsetPlaceholders: string[] = [];
            let adsetParamIndex = 1;

            for (const row of adsetInsights) {
              const campaignId = campaignMap.get(row.campaign_id);
              if (!campaignId) continue;

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

            fastify.log.info({ adsetInsights: adsetInsights.length }, 'Ad set metrics synced');
          }
        } catch (adsetError) {
          fastify.log.error({ error: adsetError }, 'Failed to sync ad set metrics (non-fatal)');
        }
      }

      // Sync ad/creative metrics if requested
      if (body.syncLevel === 'ad' || body.syncLevel === 'full') {
        try {
          const adInsights = await metaService.fetchAdInsights({ since, until });

          if (adInsights.length > 0) {
            const adValues: any[] = [];
            const adPlaceholders: string[] = [];
            let adParamIndex = 1;

            const sumVideoActions = (actions: Array<{action_type: string; value: string}> | undefined) => {
              if (!actions) return 0;
              return actions.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
            };

            for (const row of adInsights) {
              const campaignId = campaignMap.get(row.campaign_id);
              if (!campaignId) continue;

              const impressions = Math.round(parseNumber(row.impressions));
              const reach = Math.round(parseNumber(row.reach));
              const clicks = Math.round(parseNumber(row.clicks));
              const spend = parseNumber(row.spend);
              const conversations = sumActions(row.actions, messagingConversationTypes);
              const leads = sumActions(row.actions, leadTypes);
              const purchases = sumActions(row.actions, purchaseTypes);
              const conversions = purchases > 0 ? purchases : (conversations > 0 ? conversations : leads);
              const thruplay = Math.round(sumVideoActions(row.video_thruplay_actions));
              const p25 = Math.round(sumVideoActions(row.video_p25_watched_actions));
              const p50 = Math.round(sumVideoActions(row.video_p50_watched_actions));
              const p75 = Math.round(sumVideoActions(row.video_p75_watched_actions));
              const p100 = Math.round(sumVideoActions(row.video_p100_watched_actions));
              const video3sec = sumActions(row.actions, ['video_view']);
              const hookRate = impressions > 0 ? (video3sec / impressions) * 100 : 0;
              const holdRate = video3sec > 0 ? (thruplay / video3sec) * 100 : 0;
              const cpl = leads > 0 ? spend / leads : 0;

              const rowPh: string[] = [];
              for (let i = 0; i < 24; i++) {
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
                Number(holdRate.toFixed(2))
              );
            }

            if (adPlaceholders.length > 0) {
              await pool.query(
                `INSERT INTO ad_creative_metrics
                 (id, campaign_id, adset_id, ad_id, ad_name, date, impressions, reach, clicks, spend, conversions, messaging_conversations, ctr, cpc, cpl, cpm, video_thruplay, video_p25, video_p50, video_p75, video_p100, video_3sec_views, hook_rate, hold_rate)
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

            fastify.log.info({ adInsights: adInsights.length }, 'Ad creative metrics synced');
          }
        } catch (adError) {
          fastify.log.error({ error: adError }, 'Failed to sync ad creative metrics (non-fatal)');
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

          for (const bd of breakdownTypes) {
            await syncDelay(200);
            const bdInsights = await metaService.fetchBreakdownInsights({
              since, until, breakdowns: bd.breakdowns,
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

            fastify.log.info({ type: bd.type, rows: bdInsights.length }, 'Breakdown synced');
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
          totalInsights: insights.length,
          mappedCampaigns: mappedMetrics.length,
          updatedMetrics: updated,
          unmappedCampaigns: Array.from(unmapped),
          durationMs: duration,
        });
      }

      fastify.log.info({
        syncId,
        totalInsights: insights.length,
        mapped: mappedMetrics.length,
        updated,
        unmapped: unmapped.size,
        duration
      }, 'Meta sync completed successfully');

      return {
        success: true,
        syncId,
        totalInsights: insights.length,
        mapped: mappedMetrics.length,
        updated,
        unmapped: Array.from(unmapped),
        since,
        until,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (syncId && error instanceof Error) {
        await syncHistoryService.completeSyncFailure(syncId, error, duration);
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

      return {
        history,
        lastSuccessfulSync: lastSuccess,
        total: history.length,
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
           triggered_by as "triggeredBy"
         FROM sync_history
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        reply.status(404);
        return { error: 'Sync record not found' };
      }

      return result.rows[0];
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
