import { v4 as uuidv4 } from 'uuid';
import { messagingConversationTypes, parseNumber, sumActions } from '../insights';
import type { MetaSyncContext } from '../types';

export const syncBreakdownsStage = async (ctx: MetaSyncContext) => {
  const { dateChunks, metaService, campaignMap, progress, log } = ctx;

  const syncDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const breakdownStats = {
    totals: { rowsFetched: 0, segments: 0, groupsInserted: 0 },
    byType: {
      age_gender: { rowsFetched: 0, segments: 0, groupsInserted: 0 },
      platform_position: { rowsFetched: 0, segments: 0, groupsInserted: 0 },
      device: { rowsFetched: 0, segments: 0, groupsInserted: 0 },
      region: { rowsFetched: 0, segments: 0, groupsInserted: 0 },
      country: { rowsFetched: 0, segments: 0, groupsInserted: 0 },
    } as Record<string, { rowsFetched: number; segments: number; groupsInserted: number }>,
    errors: [] as Array<{ type: string; since: string; until: string; message: string }>,
  };

  try {
    const breakdownTypes = [
      { type: 'age_gender', breakdowns: ['age', 'gender'] },
      { type: 'platform_position', breakdowns: ['publisher_platform', 'platform_position'] },
      { type: 'device', breakdowns: ['device_platform'] },
      { type: 'region', breakdowns: ['region'] },
      { type: 'country', breakdowns: ['country'] },
    ];

    await progress.setStage(
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

          const typeStats = breakdownStats.byType[bd.type] ?? {
            rowsFetched: 0,
            segments: 0,
            groupsInserted: 0,
          };
          typeStats.rowsFetched += bdInsights.length;
          breakdownStats.totals.rowsFetched += bdInsights.length;
          breakdownStats.byType[bd.type] = typeStats;

          const grouped = new Map<string, any[]>();
          for (const row of bdInsights as any[]) {
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
            if (row.region) segment.region = row.region;
            if (row.country) segment.country = row.country;

            if (bd.type === 'age_gender') {
              segment.label = `${row.age || '?'} ${row.gender || '?'}`;
            } else if (bd.type === 'platform_position') {
              segment.label = `${row.publisher_platform || '?'} - ${row.platform_position || '?'}`;
            } else if (bd.type === 'region') {
              segment.label = row.region || row.region_id || '?';
            } else if (bd.type === 'country') {
              segment.label = row.country || row.country_code || '?';
            } else {
              segment.label = row.device_platform || '?';
            }

            const conversations = sumActions(row.actions, messagingConversationTypes);
            segment.messaging_conversations = conversations;
            segment.conversions = conversations;

            grouped.get(key)!.push(segment);
          }

          let segmentsTotal = 0;
          for (const segments of grouped.values()) {
            segmentsTotal += segments.length;
          }
          typeStats.segments += segmentsTotal;
          breakdownStats.totals.segments += segmentsTotal;
          typeStats.groupsInserted += grouped.size;
          breakdownStats.totals.groupsInserted += grouped.size;

          for (const [key, segments] of grouped.entries()) {
            const [cId, date] = key.split(':');
            const totalSpend = segments.reduce((s: number, seg: any) => s + seg.spend, 0);
            const totalImpressions = segments.reduce((s: number, seg: any) => s + seg.impressions, 0);
            const totalConversions = segments.reduce((s: number, seg: any) => s + (seg.messaging_conversations || 0), 0);

            await ctx.prisma.$executeRawUnsafe(
              `INSERT INTO metrics_breakdowns (id, campaign_id, date, breakdown_type, breakdown_data, total_spend, total_impressions, total_conversions, platform)
               VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, 'meta')
               ON CONFLICT (campaign_id, date, breakdown_type, platform)
               DO UPDATE SET breakdown_data = $5::jsonb, total_spend = $6, total_impressions = $7, total_conversions = $8`,
              uuidv4(), cId, new Date(date), bd.type, JSON.stringify(segments), totalSpend, totalImpressions, totalConversions
            );
          }

          log.info({ type: bd.type, since: chunk.since, until: chunk.until, rows: bdInsights.length }, 'Breakdown synced');
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          breakdownStats.errors.push({
            type: bd.type,
            since: chunk.since,
            until: chunk.until,
            message,
          });
          log.error({ error, breakdownType: bd.type }, 'Breakdown sync failed (non-fatal)');
        } finally {
          await progress.completeUnit(chunk.since, chunk.until, `Breakdown: ${bd.type}`);
        }
      }
    }
  } catch (error) {
    log.error({ error }, 'Failed to sync breakdowns (non-fatal)');
  } finally {
    await progress.setMetadata({
      breakdowns: {
        ...breakdownStats,
        updatedAt: new Date().toISOString(),
      },
    });
  }
};
