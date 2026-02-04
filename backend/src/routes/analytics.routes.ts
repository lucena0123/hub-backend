import { FastifyPluginAsync } from 'fastify';
import {
  OPTIMIZATION_CENTER_PLAYBOOK_V1,
  getOptimizationTargetsForTheme,
  inferOptimizationTheme,
} from '../services/optimization-playbook';
import { generateCopyInsights } from '../services/creative-copy-insights';

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  const toIsoDateUtc = (date: Date) => date.toISOString().split('T')[0];

  const shiftIsoDateUtc = (isoDate: string, days: number) => {
    const date = new Date(`${isoDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return toIsoDateUtc(date);
  };

  const toStringArray = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const inner = trimmed.slice(1, -1);
        if (!inner) return [];
        return inner
          .split(',')
          .map((item) => item.trim().replace(/^"(.*)"$/, '$1'))
          .filter(Boolean);
      }
      return [value];
    }
    return [];
  };

  const median = (values: number[]): number | null => {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (sorted.length === 0) return null;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Playbook config (Optimization Center)
  fastify.get('/api/playbooks/optimization-center', async () => {
    return OPTIMIZATION_CENTER_PLAYBOOK_V1;
  });

  // Copy insights (AI) for a creative snapshot
  fastify.get<{
    Params: { snapshotId: string };
  }>('/api/creative-snapshots/:snapshotId/copy-insights', async (request, reply) => {
    try {
      const { snapshotId } = request.params;

      const result = await pool.query(
        `SELECT
          snapshot_id,
          theme_key,
          theme_name,
          status,
          model,
          prompt_version,
          analysis,
          error_message,
          created_at,
          updated_at
        FROM creative_copy_insights
        WHERE snapshot_id = $1
        LIMIT 1`,
        [snapshotId]
      );

      if (result.rows.length === 0) {
        reply.status(404);
        return { error: 'Copy insights not found' };
      }

      const row = result.rows[0] as any;
      return {
        snapshotId: row.snapshot_id,
        themeKey: row.theme_key ?? null,
        themeName: row.theme_name ?? null,
        status: row.status,
        model: row.model ?? null,
        promptVersion: row.prompt_version ?? null,
        analysis: row.analysis ?? null,
        errorMessage: row.error_message ?? null,
        createdAt: row.created_at ?? null,
        updatedAt: row.updated_at ?? null,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch copy insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.post<{
    Params: { snapshotId: string };
    Body?: { themeKey?: string; themeName?: string; force?: boolean };
  }>('/api/creative-snapshots/:snapshotId/copy-insights', async (request, reply) => {
    try {
      const { snapshotId } = request.params;
      const body = (request.body ?? {}) as any;
      const force = Boolean(body.force);

      const existing = await pool.query(
        `SELECT snapshot_id, status, updated_at, analysis
         FROM creative_copy_insights
         WHERE snapshot_id = $1
         LIMIT 1`,
        [snapshotId]
      );

      if (!force && existing.rows.length > 0 && existing.rows[0].status === 'success') {
        return { success: true, snapshotId, reused: true };
      }

      const snapshotResult = await pool.query(
        `SELECT
          id,
          headline,
          primary_text,
          description,
          cta_type,
          destination_url,
          is_dynamic,
          headlines,
          primary_texts,
          descriptions,
          cta_types,
          destination_urls,
          format
        FROM ad_creative_snapshots
        WHERE id = $1
        LIMIT 1`,
        [snapshotId]
      );

      if (snapshotResult.rows.length === 0) {
        reply.status(404);
        return { error: 'Creative snapshot not found' };
      }

      const snapshotRow = snapshotResult.rows[0] as any;

      const themeKeyFromBody = typeof body.themeKey === 'string' && body.themeKey.trim() ? body.themeKey.trim() : null;
      const themeNameFromBody = typeof body.themeName === 'string' && body.themeName.trim() ? body.themeName.trim() : null;

      let campaignName: string | null = null;
      if (!themeKeyFromBody) {
        const campaignRow = await pool.query(
          `SELECT c.name as campaign_name
           FROM ad_creative_metrics m
           JOIN campaigns c ON c.id = m.campaign_id
           WHERE m.creative_snapshot_id = $1
           ORDER BY m.date DESC
           LIMIT 1`,
          [snapshotId]
        );
        if (campaignRow.rows.length > 0) {
          campaignName = campaignRow.rows[0].campaign_name ?? null;
        }
      }

      const inferred = inferOptimizationTheme(themeNameFromBody ?? campaignName ?? '');
      const theme = {
        themeKey: themeKeyFromBody ?? inferred.themeKey,
        themeName: themeNameFromBody ?? inferred.themeName,
        matchedBy: themeKeyFromBody ? 'tag' : inferred.matchedBy,
        matchedValue: themeKeyFromBody ? themeKeyFromBody : inferred.matchedValue,
      } as any;

      const insights = await generateCopyInsights({
        snapshot: {
          snapshotId: snapshotRow.id,
          headline: snapshotRow.headline ?? null,
          primaryText: snapshotRow.primary_text ?? null,
          description: snapshotRow.description ?? null,
          ctaType: snapshotRow.cta_type ?? null,
          destinationUrl: snapshotRow.destination_url ?? null,
          isDynamic: Boolean(snapshotRow.is_dynamic),
          headlines: snapshotRow.headlines ?? null,
          primaryTexts: snapshotRow.primary_texts ?? null,
          descriptions: snapshotRow.descriptions ?? null,
          ctaTypes: snapshotRow.cta_types ?? null,
          destinationUrls: snapshotRow.destination_urls ?? null,
          format: snapshotRow.format ?? null,
        },
        theme,
        force,
      });

      await pool.query(
        `INSERT INTO creative_copy_insights (
          snapshot_id,
          theme_key,
          theme_name,
          status,
          model,
          prompt_version,
          analysis,
          error_message,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW(), NOW())
        ON CONFLICT (snapshot_id) DO UPDATE SET
          theme_key = EXCLUDED.theme_key,
          theme_name = EXCLUDED.theme_name,
          status = EXCLUDED.status,
          model = EXCLUDED.model,
          prompt_version = EXCLUDED.prompt_version,
          analysis = EXCLUDED.analysis,
          error_message = EXCLUDED.error_message,
          updated_at = NOW()`,
        [
          snapshotId,
          theme.themeKey ?? null,
          theme.themeName ?? null,
          insights.status,
          insights.model ?? null,
          insights.promptVersion,
          JSON.stringify(insights.analysis),
          insights.errorMessage ?? null,
        ]
      );

      return { success: insights.status === 'success', snapshotId, status: insights.status };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to generate copy insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get ad set metrics for a campaign
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/adset-metrics', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;

      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT
          adset_id,
          adset_name,
          SUM(impressions) as total_impressions,
          SUM(reach) as total_reach,
          SUM(clicks) as total_clicks,
          SUM(spend) as total_spend,
          SUM(conversions) as total_conversions,
          SUM(messaging_conversations) as total_messaging_conversations,
          SUM(messaging_first_reply) as total_messaging_first_reply,
          AVG(ctr) as avg_ctr,
          AVG(cpc) as avg_cpc,
          AVG(cpm) as avg_cpm,
          AVG(frequency) as avg_frequency
        FROM adset_metrics
        WHERE campaign_id = $1 AND date >= $2 AND date <= $3
        GROUP BY adset_id, adset_name
        ORDER BY total_spend DESC`,
        [campaignId, start, end]
      );

      const adsets = result.rows.map((row: any) => {
        const spend = parseFloat(row.total_spend) || 0;
        const conversations = parseInt(row.total_messaging_conversations) || 0;
        const cpl = conversations > 0 ? spend / conversations : 0;

        return {
          adsetId: row.adset_id,
          adsetName: row.adset_name,
          totalImpressions: parseInt(row.total_impressions) || 0,
          totalReach: parseInt(row.total_reach) || 0,
          totalClicks: parseInt(row.total_clicks) || 0,
          totalSpend: spend,
          totalConversions: parseInt(row.total_conversions) || 0,
          totalMessagingConversations: conversations,
          totalMessagingFirstReply: parseInt(row.total_messaging_first_reply) || 0,
          avgCtr: parseFloat(row.avg_ctr) || 0,
          avgCpc: parseFloat(row.avg_cpc) || 0,
          avgCpm: parseFloat(row.avg_cpm) || 0,
          avgFrequency: parseFloat(row.avg_frequency) || 0,
          cpl,
        };
      });

      return { campaignId, total: adsets.length, adsets };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch ad set metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get ad/creative metrics for a campaign
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/ad-metrics', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;

      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT
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
          s.cta_types,
          s.destination_urls,
          s.captured_at as snapshot_captured_at,
          m.total_impressions,
          m.total_reach,
          m.total_clicks,
          m.total_spend,
          m.total_conversions,
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
            SUM(spend) as total_spend,
            SUM(conversions) as total_conversions,
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
          WHERE campaign_id = $1 AND date >= $2 AND date <= $3
          GROUP BY ad_id, ad_name, adset_id, creative_id, creative_snapshot_id
        ) m
        LEFT JOIN ad_creative_snapshots s ON s.id = m.creative_snapshot_id
        ORDER BY m.total_spend DESC`,
        [campaignId, start, end]
      );

      const ads = result.rows.map((row: any) => {
        const spend = parseFloat(row.total_spend) || 0;
        const impressions = parseInt(row.total_impressions) || 0;
        const conversations = parseInt(row.total_messaging_conversations) || 0;
        const thruplay = parseInt(row.total_thruplay) || 0;
        const views3sec = parseInt(row.total_3sec_views) || 0;
        const hookRate = impressions > 0 ? (views3sec / impressions) * 100 : 0;
        const holdRate = views3sec > 0 ? (thruplay / views3sec) * 100 : 0;
        const cpl = conversations > 0 ? spend / conversations : 0;

        const creativeSnapshotId = row.creative_snapshot_id || null;
        const creative = creativeSnapshotId ? {
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
          ctaTypes: row.cta_types || null,
          destinationUrls: row.destination_urls || null,
        } : null;

        return {
          adId: row.ad_id,
          adName: row.ad_name,
          adsetId: row.adset_id,
          creativeId: row.creative_id || null,
          creativeSnapshotId,
          creative,
          totalImpressions: impressions,
          totalReach: parseInt(row.total_reach) || 0,
          totalClicks: parseInt(row.total_clicks) || 0,
          totalSpend: spend,
          totalConversions: parseInt(row.total_conversions) || 0,
          totalMessagingConversations: conversations,
          avgCtr: parseFloat(row.avg_ctr) || 0,
          avgCpm: parseFloat(row.avg_cpm) || 0,
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
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch ad metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Optimization center (playbook recommendations) for a client
  fastify.get<{
    Params: { clientId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; campaignId?: string };
  }>('/api/clients/:clientId/optimization-center', async (request, reply) => {
    try {
      const { clientId } = request.params;
      const { period = '30d', startDate, endDate, campaignId } = request.query;

      const days =
        period === '7d'
          ? 7
          : period === '14d'
            ? 14
            : period === '60d'
              ? 60
              : period === '90d'
                ? 90
                : 30;

      const end = endDate || toIsoDateUtc(new Date());
      const start =
        startDate || toIsoDateUtc(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

      const endMinus6 = shiftIsoDateUtc(end, -6);
      const endMinus13 = shiftIsoDateUtc(end, -13);

      const safeInt = (value: unknown) => {
        const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const safeFloat = (value: unknown) => {
        const parsed = typeof value === 'number' ? value : parseFloat(String(value));
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const percentChange = (current: number, previous: number) => {
        if (previous <= 0) return null;
        return ((current - previous) / previous) * 100;
      };

      const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 2,
        }).format(value);

      const formatPercent = (value: number) => `${value.toFixed(0)}%`;

      const campaignsResult = await pool.query(
        `SELECT
          c.id as campaign_id,
          c.name as campaign_name,
          c.status as campaign_status,
          c.platform as platform,
          c.budget as budget,
          COALESCE(SUM(cm.spend), 0) as spend_total,
          COALESCE(SUM(cm.impressions), 0)::int as impressions_total,
          COALESCE(SUM(cm.clicks), 0)::int as clicks_total,
          COALESCE(SUM(cm.conversions), 0)::int as conversions_total,
          COALESCE(SUM(cm.leads), 0)::int as leads_total,
          COALESCE(SUM(cm.messaging_conversations), 0)::int as conversations_total,
          COALESCE(SUM(cm.messaging_first_reply), 0)::int as first_reply_total,
          COALESCE(AVG(cm.frequency), 0) as avg_frequency_total,
          COALESCE(AVG(cm.cpm), 0) as avg_cpm_total,
          COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.spend ELSE 0 END), 0) as spend_last7,
          COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.impressions ELSE 0 END), 0)::int as impressions_last7,
          COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.conversions ELSE 0 END), 0)::int as conversions_last7,
          COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.leads ELSE 0 END), 0)::int as leads_last7,
          COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.messaging_conversations ELSE 0 END), 0)::int as conversations_last7,
          COALESCE(SUM(CASE WHEN cm.date >= $4 THEN cm.messaging_first_reply ELSE 0 END), 0)::int as first_reply_last7,
          COALESCE(AVG(CASE WHEN cm.date >= $4 THEN cm.frequency ELSE NULL END), 0) as avg_frequency_last7,
          COALESCE(AVG(CASE WHEN cm.date >= $4 THEN cm.cpm ELSE NULL END), 0) as avg_cpm_last7,
          COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.spend ELSE 0 END), 0) as spend_prev7,
          COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.impressions ELSE 0 END), 0)::int as impressions_prev7,
          COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.conversions ELSE 0 END), 0)::int as conversions_prev7,
          COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.leads ELSE 0 END), 0)::int as leads_prev7,
          COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.messaging_conversations ELSE 0 END), 0)::int as conversations_prev7,
          COALESCE(SUM(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.messaging_first_reply ELSE 0 END), 0)::int as first_reply_prev7,
          COALESCE(AVG(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.frequency ELSE NULL END), 0) as avg_frequency_prev7,
          COALESCE(AVG(CASE WHEN cm.date >= $5 AND cm.date < $4 THEN cm.cpm ELSE NULL END), 0) as avg_cpm_prev7
        FROM campaigns c
        LEFT JOIN campaign_metrics cm ON cm.campaign_id = c.id AND cm.date >= $2 AND cm.date <= $3
        WHERE c."clientId" = $1
          AND ($6::text IS NULL OR c.id = $6)
        GROUP BY c.id, c.name, c.status, c.platform, c.budget
        ORDER BY spend_total DESC`,
        [clientId, start, end, endMinus6, endMinus13, campaignId || null]
      );

      const primaryCampaignName =
        campaignsResult.rows.length > 0 ? String((campaignsResult.rows[0] as any).campaign_name || '') : '';
      const primaryTheme = primaryCampaignName ? inferOptimizationTheme(primaryCampaignName) : inferOptimizationTheme('');
      const targets = getOptimizationTargetsForTheme(primaryTheme.themeKey);

      const leadTrackingAgg = await pool.query(
        `SELECT
          lt.campaign_id,
          COUNT(*) FILTER (WHERE lt.date >= $4)::int as tracking_records_last7,
          COALESCE(SUM(CASE WHEN lt.date >= $4 THEN lt.qualified_leads ELSE 0 END), 0)::int as qualified_last7,
          COALESCE(SUM(CASE WHEN lt.date >= $5 AND lt.date < $4 THEN lt.qualified_leads ELSE 0 END), 0)::int as qualified_prev7
        FROM campaign_lead_tracking lt
        JOIN campaigns c ON c.id = lt.campaign_id
        WHERE c."clientId" = $1
          AND lt.date >= $2
          AND lt.date <= $3
          AND ($6::text IS NULL OR lt.campaign_id = $6)
        GROUP BY lt.campaign_id`,
        [clientId, start, end, endMinus6, endMinus13, campaignId || null]
      );

      const leadTrackingByCampaign = new Map<
        string,
        { recordsLast7: number; qualifiedLast7: number; qualifiedPrev7: number }
      >();
      for (const row of leadTrackingAgg.rows) {
        leadTrackingByCampaign.set(String(row.campaign_id), {
          recordsLast7: safeInt(row.tracking_records_last7),
          qualifiedLast7: safeInt(row.qualified_last7),
          qualifiedPrev7: safeInt(row.qualified_prev7),
        });
      }

      const reasonsAgg = await pool.query(
        `SELECT
          lt.campaign_id,
          e.key as reason_key,
          SUM((e.value)::int)::int as total_count
        FROM campaign_lead_tracking lt
        JOIN campaigns c ON c.id = lt.campaign_id
        CROSS JOIN LATERAL jsonb_each_text(COALESCE(lt.disqualification_reasons, '{}'::jsonb)) e(key, value)
        WHERE c."clientId" = $1
          AND lt.date >= $2
          AND lt.date <= $3
          AND lt.date >= $4
          AND ($5::text IS NULL OR lt.campaign_id = $5)
        GROUP BY lt.campaign_id, e.key`,
        [clientId, start, end, endMinus6, campaignId || null]
      );

      const reasonsByCampaign = new Map<string, Array<{ key: string; count: number }>>();
      for (const row of reasonsAgg.rows) {
        const id = String(row.campaign_id);
        const list = reasonsByCampaign.get(id) ?? [];
        list.push({ key: String(row.reason_key), count: safeInt(row.total_count) });
        reasonsByCampaign.set(id, list);
      }

      const creativeQuery = `WITH creative_agg AS (
          SELECT
            m.creative_snapshot_id,
            MAX(m.creative_id) as creative_id,
            array_agg(DISTINCT c.name) as campaigns,
            COUNT(DISTINCT m.ad_id)::int as ads_count,
            COALESCE(SUM(m.spend), 0) as total_spend,
            COALESCE(SUM(m.messaging_conversations), 0)::int as total_conversations,
            COALESCE(AVG(NULLIF(m.hook_rate, 0)), 0) as hook_rate_avg,
            COALESCE(AVG(NULLIF(m.hold_rate, 0)), 0) as hold_rate_avg,
            COALESCE(SUM(CASE WHEN m.date >= $4 THEN m.spend ELSE 0 END), 0) as spend_last7,
            COALESCE(SUM(CASE WHEN m.date >= $4 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_last7,
            COALESCE(SUM(CASE WHEN m.date >= $5 AND m.date < $4 THEN m.spend ELSE 0 END), 0) as spend_prev7,
            COALESCE(SUM(CASE WHEN m.date >= $5 AND m.date < $4 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_prev7
          FROM ad_creative_metrics m
          JOIN campaigns c ON c.id = m.campaign_id
          WHERE c."clientId" = $1
            AND m.date >= $2
            AND m.date <= $3
            AND ($6::text IS NULL OR m.campaign_id = $6)
            AND m.creative_snapshot_id IS NOT NULL
          GROUP BY m.creative_snapshot_id
        )
        SELECT
          a.creative_snapshot_id,
          a.creative_id,
          a.campaigns,
          a.ads_count,
          a.total_spend,
          a.total_conversations,
          a.hook_rate_avg,
          a.hold_rate_avg,
          a.spend_last7,
          a.conv_last7,
          a.spend_prev7,
          a.conv_prev7,
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

      const creativeQueryFallback = `WITH creative_agg AS (
          SELECT
            m.creative_snapshot_id,
            MAX(m.creative_id) as creative_id,
            array_agg(DISTINCT c.name) as campaigns,
            COUNT(DISTINCT m.ad_id)::int as ads_count,
            COALESCE(SUM(m.spend), 0) as total_spend,
            COALESCE(SUM(m.messaging_conversations), 0)::int as total_conversations,
            COALESCE(AVG(NULLIF(m.hook_rate, 0)), 0) as hook_rate_avg,
            COALESCE(AVG(NULLIF(m.hold_rate, 0)), 0) as hold_rate_avg,
            COALESCE(SUM(CASE WHEN m.date >= $4 THEN m.spend ELSE 0 END), 0) as spend_last7,
            COALESCE(SUM(CASE WHEN m.date >= $4 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_last7,
            COALESCE(SUM(CASE WHEN m.date >= $5 AND m.date < $4 THEN m.spend ELSE 0 END), 0) as spend_prev7,
            COALESCE(SUM(CASE WHEN m.date >= $5 AND m.date < $4 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_prev7
          FROM ad_creative_metrics m
          JOIN campaigns c ON c.id = m.campaign_id
          WHERE c."clientId" = $1
            AND m.date >= $2
            AND m.date <= $3
            AND ($6::text IS NULL OR m.campaign_id = $6)
            AND m.creative_snapshot_id IS NOT NULL
          GROUP BY m.creative_snapshot_id
        )
        SELECT
          a.creative_snapshot_id,
          a.creative_id,
          a.campaigns,
          a.ads_count,
          a.total_spend,
          a.total_conversations,
          a.hook_rate_avg,
          a.hold_rate_avg,
          a.spend_last7,
          a.conv_last7,
          a.spend_prev7,
          a.conv_prev7,
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
          NULL::text as copy_insights_status,
          NULL::timestamp as copy_insights_updated_at
        FROM creative_agg a
        LEFT JOIN ad_creative_snapshots s ON s.id = a.creative_snapshot_id
        ORDER BY a.total_spend DESC`;

      const creativeParams = [clientId, start, end, endMinus6, endMinus13, campaignId || null];

      let creativeResult;
      try {
        creativeResult = await pool.query(creativeQuery, creativeParams);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('creative_copy_insights') && message.toLowerCase().includes('does not exist')) {
          creativeResult = await pool.query(creativeQueryFallback, creativeParams);
        } else {
          throw error;
        }
      }

      const toJsonStringArray = (value: unknown): string[] | null => {
        if (!Array.isArray(value)) return null;
        const list = value
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean);
        return list.length > 0 ? list : null;
      };

      const safeText = (value: unknown): string | null => {
        if (typeof value !== 'string') return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const pickText = (single: unknown, list: unknown): string | null => {
        return safeText(single) ?? safeText(toJsonStringArray(list)?.[0]) ?? null;
      };

      const creatives = creativeResult.rows.map((row: any) => {
        const totalSpend = safeFloat(row.total_spend);
        const totalConversations = safeInt(row.total_conversations);
        const cpl = totalConversations > 0 ? totalSpend / totalConversations : null;

        const hookRateRaw = safeFloat(row.hook_rate_avg);
        const holdRateRaw = safeFloat(row.hold_rate_avg);
        const hookRateAvg = hookRateRaw > 0 ? Number(hookRateRaw.toFixed(2)) : null;
        const holdRateAvg = holdRateRaw > 0 ? Number(holdRateRaw.toFixed(2)) : null;

        const videoId = typeof row.video_id === 'string' && row.video_id.trim() ? row.video_id.trim() : null;
        const format = typeof row.format === 'string' && row.format.trim() ? row.format.trim() : null;
        const isVideo = Boolean(videoId || (format && format.toLowerCase().includes('video')));

        const spendLast7 = safeFloat(row.spend_last7);
        const convLast7 = safeInt(row.conv_last7);
        const cplLast7 = convLast7 > 0 ? spendLast7 / convLast7 : null;

        const spendPrev7 = safeFloat(row.spend_prev7);
        const convPrev7 = safeInt(row.conv_prev7);
        const cplPrev7 = convPrev7 > 0 ? spendPrev7 / convPrev7 : null;

        const conversationsPct =
          convPrev7 > 0 ? ((convLast7 - convPrev7) / convPrev7) * 100 : null;
        const cplPct = cplPrev7 && cplLast7 ? ((cplLast7 - cplPrev7) / cplPrev7) * 100 : null;

        return {
          snapshotId: String(row.creative_snapshot_id),
          headline: pickText(row.headline, row.headlines),
          primaryText: pickText(row.primary_text, row.primary_texts),
          description: pickText(row.description, row.descriptions),
          headlines: toJsonStringArray(row.headlines),
          primaryTexts: toJsonStringArray(row.primary_texts),
          descriptions: toJsonStringArray(row.descriptions),
          ctaType: row.cta_type || null,
          ctaTypes: toJsonStringArray(row.cta_types),
          destinationUrl: row.destination_url || null,
          destinationUrls: toJsonStringArray(row.destination_urls),
          imageUrl: row.image_url || null,
          thumbnailUrl: row.thumbnail_url || null,
          videoId,
          format,
          isVideo,
          isDynamic: Boolean(row.is_dynamic),
          copyInsightsStatus: row.copy_insights_status || null,
          copyInsightsUpdatedAt: row.copy_insights_updated_at || null,
          campaigns: toStringArray(row.campaigns),
          adsCount: safeInt(row.ads_count),
          metrics: {
            totalSpend,
            totalConversations,
            cpl,
            hookRateAvg,
            holdRateAvg,
          },
          recent: {
            spend: spendLast7,
            conversations: convLast7,
            cpl: cplLast7,
          },
          previous: {
            spend: spendPrev7,
            conversations: convPrev7,
            cpl: cplPrev7,
          },
          deltas: {
            conversationsPct,
            cplPct,
          },
        };
      });

      const cplValues = creatives
        .map((c: any) => c.metrics.cpl)
        .filter((value: any): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
      const medianCpl = median(cplValues);

      const eligible = creatives.filter(
        (c: any) => c.metrics.totalSpend >= targets.creativeMinSpendWinner && c.metrics.totalConversations > 0
      );
      const winnerCount = Math.min(
        targets.creativeWinnerMaxCount,
        Math.max(1, Math.ceil(eligible.length * targets.creativeWinnerPercentile))
      );
      const winners = [...eligible]
        .sort((a: any, b: any) => b.metrics.totalConversations - a.metrics.totalConversations)
        .slice(0, winnerCount);
      const winnerIds = new Set<string>(winners.map((c: any) => c.snapshotId));

      const loserIds = new Set<string>(
        creatives
          .filter((c: any) => {
            const spend = c.metrics.totalSpend || 0;
            const conv = c.metrics.totalConversations || 0;
            const cplValue = c.metrics.cpl;
            if (spend >= targets.creativeMinSpendLoser && conv === 0) return true;
            if (
              spend >= targets.creativeMinSpendLoser &&
              medianCpl &&
              typeof cplValue === 'number' &&
              cplValue >= medianCpl * targets.creativeLoserCplMultiplier &&
              conv <= targets.creativeLoserMaxConversations
            ) {
              return true;
            }
            return false;
          })
          .map((c: any) => c.snapshotId)
      );

      const fatiguedIds = new Set<string>(
        creatives
          .filter((c: any) => {
            const convPrev = c.previous.conversations || 0;
            const convLast = c.recent.conversations || 0;
            const spendPrev = c.previous.spend || 0;
            const spendLast = c.recent.spend || 0;
            const cplPrev = c.previous.cpl;
            const cplLast = c.recent.cpl;

            const minConvFactor = (100 + targets.creativeFatigueDropPct) / 100;

            if (
              convPrev >= targets.creativeFatigueMinPrevConversations &&
              convLast <= convPrev * minConvFactor &&
              spendLast >= Math.min(spendPrev * 0.8, targets.creativeFatigueMinSpend) &&
              spendLast >= targets.creativeFatigueMinSpend
            ) {
              return true;
            }
            if (
              convPrev >= 5 &&
              convLast >= 3 &&
              spendLast >= targets.creativeFatigueMinSpend &&
              typeof cplPrev === 'number' &&
              typeof cplLast === 'number' &&
              cplLast >= cplPrev * targets.creativeFatigueCplMultiplier
            ) {
              return true;
            }
            return false;
          })
          .map((c: any) => c.snapshotId)
      );

      const enrichedCreatives = creatives.map((c: any) => {
        const isWinner = winnerIds.has(c.snapshotId);
        const isLoser = loserIds.has(c.snapshotId);
        const isFatigued = fatiguedIds.has(c.snapshotId);
        const status = isFatigued ? 'fatigued' : isWinner ? 'winner' : isLoser ? 'loser' : 'neutral';
        return {
          ...c,
          status,
        };
      });

      type OptimizationSeverity = 'critical' | 'warning' | 'info' | 'opportunity';
      type OptimizationAction = 'review' | 'pause' | 'refresh' | 'scale' | 'track' | 'sync';

      const items: Array<{
        id: string;
        ruleId?: string;
        severity: OptimizationSeverity;
        category: 'campaign' | 'creative' | 'qualification' | 'data';
        action: OptimizationAction;
        title: string;
        description: string;
        theme?: { key: string; name: string; matchedBy: string; matchedValue: string | null };
        entity?: { type: 'campaign' | 'creative'; id: string; name?: string | null };
        metrics?: Record<string, number | string | null>;
        thresholds?: Record<string, number | string | null>;
      }> = [];

      const actionableCampaigns: Array<{
        campaignId: string;
        campaignName: string;
        contactsLast7: number;
        contactsPrev7: number;
        spendLast7: number;
        cplLast7: number | null;
        cplPrev7: number | null;
      }> = [];

      for (const camp of campaignsResult.rows as any[]) {
        const campaignIdValue = String(camp.campaign_id);
        const campaignName = String(camp.campaign_name || '');
        const campaignStatus = String(camp.campaign_status || '');

        const campaignTheme = inferOptimizationTheme(campaignName);
        const campaignTargets = getOptimizationTargetsForTheme(campaignTheme.themeKey);

        const spendTotal = safeFloat(camp.spend_total);
        const impressionsTotal = safeInt(camp.impressions_total);

        const spendLast7 = safeFloat(camp.spend_last7);
        const spendPrev7 = safeFloat(camp.spend_prev7);

        const firstReplyLast7 = safeInt(camp.first_reply_last7);
        const avgFrequencyLast7 = safeFloat(camp.avg_frequency_last7);
        const avgCpmLast7 = safeFloat(camp.avg_cpm_last7);

        const conversionsLast7 = safeInt(camp.conversions_last7);
        const conversionsPrev7 = safeInt(camp.conversions_prev7);
        const leadsLast7 = safeInt(camp.leads_last7);
        const leadsPrev7 = safeInt(camp.leads_prev7);
        const messagingLast7 = safeInt(camp.conversations_last7);
        const messagingPrev7 = safeInt(camp.conversations_prev7);

        const isMessagingCampaign = messagingLast7 > 0 || messagingPrev7 > 0;
        const contactsLast7 = messagingLast7 > 0 ? messagingLast7 : leadsLast7 > 0 ? leadsLast7 : conversionsLast7;
        const contactsPrev7 = messagingPrev7 > 0 ? messagingPrev7 : leadsPrev7 > 0 ? leadsPrev7 : conversionsPrev7;

        const costPerContact = contactsLast7 > 0 ? spendLast7 / contactsLast7 : null;
        const costPerContactPrev7 = contactsPrev7 > 0 ? spendPrev7 / contactsPrev7 : null;

        const firstReplyRate =
          messagingLast7 > 0 && firstReplyLast7 >= 0 ? (firstReplyLast7 / messagingLast7) * 100 : null;

        const contactsDelta = percentChange(contactsLast7, contactsPrev7);
        const cplChange =
          costPerContact != null && costPerContactPrev7 != null
            ? percentChange(costPerContact, costPerContactPrev7)
            : null;

        const leadTracking = leadTrackingByCampaign.get(campaignIdValue) ?? {
          recordsLast7: 0,
          qualifiedLast7: 0,
          qualifiedPrev7: 0,
        };

        const topReasons = (reasonsByCampaign.get(campaignIdValue) ?? [])
          .filter((r) => r.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 2)
          .map((r) => `${r.key.replaceAll('_', ' ')} (${r.count})`)
          .join(', ');

        // Delivery stalled in the selected window.
        if (spendTotal === 0 && impressionsTotal === 0 && campaignStatus === 'active') {
          items.push({
            id: `camp-stalled-${campaignIdValue}`,
            ruleId: 'campaign.stalled',
            severity: 'warning',
            category: 'campaign',
            action: 'review',
            title: 'Campanha ativa sem entrega',
            description:
              'A campanha está marcada como ativa, mas não teve impressões/gasto no período selecionado. Verifique status, público, orçamento e limites na conta.',
            theme: {
              key: campaignTheme.themeKey,
              name: campaignTheme.themeName,
              matchedBy: campaignTheme.matchedBy,
              matchedValue: campaignTheme.matchedValue,
            },
            entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
            metrics: { spend: spendTotal, impressions: impressionsTotal },
            thresholds: { minSpendForEvaluation: campaignTargets.minSpendForEvaluation },
          });
          continue;
        }

        // Spend with no contacts.
        if (spendLast7 >= campaignTargets.minSpendForEvaluation && contactsLast7 === 0) {
          items.push({
            id: `camp-no-contacts-${campaignIdValue}`,
            ruleId: 'campaign.no-contacts',
            severity: 'critical',
            category: 'campaign',
            action: 'refresh',
            title: 'Gasto sem gerar contatos',
            description: `${formatCurrency(spendLast7)} investidos nos últimos 7 dias (dentro do período selecionado) sem gerar contatos. Ação: revisar criativos, público e página/conversa de destino.`,
            theme: {
              key: campaignTheme.themeKey,
              name: campaignTheme.themeName,
              matchedBy: campaignTheme.matchedBy,
              matchedValue: campaignTheme.matchedValue,
            },
            entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
            metrics: { spendLast7, contactsLast7 },
            thresholds: { minSpendForEvaluation: campaignTargets.minSpendForEvaluation },
          });
        }

        // Sharp drop in contacts week-over-week.
        if (
          contactsPrev7 >= campaignTargets.minContactsForEvaluation &&
          contactsDelta !== null &&
          contactsDelta <= campaignTargets.contactsDropPctWarning &&
          spendLast7 >= Math.min(campaignTargets.minSpendForEvaluation, 100)
        ) {
          items.push({
            id: `camp-contacts-drop-${campaignIdValue}`,
            ruleId: 'campaign.contacts-drop',
            severity: 'warning',
            category: 'campaign',
            action: 'refresh',
            title: 'Queda brusca de contatos',
            description: `Queda de contatos: ${contactsPrev7} → ${contactsLast7} (${formatPercent(contactsDelta)}). Sinal de fadiga de criativo ou mudança de público.`,
            theme: {
              key: campaignTheme.themeKey,
              name: campaignTheme.themeName,
              matchedBy: campaignTheme.matchedBy,
              matchedValue: campaignTheme.matchedValue,
            },
            entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
            metrics: { contactsLast7, contactsPrev7, spendLast7 },
            thresholds: {
              minContactsForEvaluation: campaignTargets.minContactsForEvaluation,
              contactsDropPctWarning: campaignTargets.contactsDropPctWarning,
            },
          });
        }

        // Cost per contact increased significantly.
        if (
          contactsPrev7 >= campaignTargets.minContactsForEvaluation &&
          contactsLast7 >= Math.min(5, campaignTargets.minContactsForEvaluation) &&
          cplChange !== null &&
          cplChange >= campaignTargets.cplRisePctWarning &&
          costPerContact != null &&
          costPerContactPrev7 != null
        ) {
          items.push({
            id: `camp-cpl-rise-${campaignIdValue}`,
            ruleId: 'campaign.cpl-rise',
            severity: 'warning',
            category: 'campaign',
            action: 'refresh',
            title: 'Custo por contato subiu',
            description: `Custo por contato subiu: ${formatCurrency(costPerContactPrev7)} → ${formatCurrency(costPerContact)} (${formatPercent(cplChange)}). Recomenda-se testar novas variações de criativos.`,
            theme: {
              key: campaignTheme.themeKey,
              name: campaignTheme.themeName,
              matchedBy: campaignTheme.matchedBy,
              matchedValue: campaignTheme.matchedValue,
            },
            entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
            metrics: { costPerContact, costPerContactPrev7, spendLast7 },
            thresholds: { cplRisePctWarning: campaignTargets.cplRisePctWarning },
          });
        }

        // CPL guardrails (theme targets)
        if (
          costPerContact != null &&
          contactsLast7 >= campaignTargets.minContactsForEvaluation &&
          spendLast7 >= campaignTargets.minSpendForEvaluation
        ) {
          if (costPerContact >= campaignTargets.targetCplBadMin) {
            items.push({
              id: `camp-cpl-high-${campaignIdValue}`,
              ruleId: 'campaign.cpl-high',
              severity: 'critical',
              category: 'campaign',
              action: 'refresh',
              title: 'CPL acima do ideal (tema)',
              description: `CPL atual ${formatCurrency(costPerContact)} está acima do ideal para o tema (${campaignTheme.themeName}). Recomendado: revisar criativos, públicos e proposta para reduzir custo por contato.`,
              theme: {
                key: campaignTheme.themeKey,
                name: campaignTheme.themeName,
                matchedBy: campaignTheme.matchedBy,
                matchedValue: campaignTheme.matchedValue,
              },
              entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
              metrics: { cplLast7: costPerContact, contactsLast7, spendLast7 },
              thresholds: {
                targetCplGoodMax: campaignTargets.targetCplGoodMax,
                targetCplOkMax: campaignTargets.targetCplOkMax,
                targetCplBadMin: campaignTargets.targetCplBadMin,
              },
            });
          } else if (costPerContact > campaignTargets.targetCplOkMax) {
            items.push({
              id: `camp-cpl-above-ok-${campaignIdValue}`,
              ruleId: 'campaign.cpl-above-ok',
              severity: 'warning',
              category: 'campaign',
              action: 'refresh',
              title: 'CPL acima do desejado (tema)',
              description: `CPL atual ${formatCurrency(costPerContact)} acima do desejado para o tema (${campaignTheme.themeName}). Sugestão: criar novas variações de criativo e testar ângulos/copy.`,
              theme: {
                key: campaignTheme.themeKey,
                name: campaignTheme.themeName,
                matchedBy: campaignTheme.matchedBy,
                matchedValue: campaignTheme.matchedValue,
              },
              entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
              metrics: { cplLast7: costPerContact, contactsLast7, spendLast7 },
              thresholds: { targetCplOkMax: campaignTargets.targetCplOkMax },
            });
          }
        }

        // Frequency (saturation) guardrail
        if (avgFrequencyLast7 >= campaignTargets.frequencyCritical && spendLast7 >= campaignTargets.minSpendForEvaluation) {
          items.push({
            id: `camp-frequency-critical-${campaignIdValue}`,
            ruleId: 'campaign.frequency-high',
            severity: 'critical',
            category: 'campaign',
            action: 'refresh',
            title: 'Frequência muito alta (saturação)',
            description: `Frequência média ${avgFrequencyLast7.toFixed(2)}x nos últimos 7 dias. Sinal de saturação: priorize renovação de criativos e/ou ampliar público.`,
            theme: {
              key: campaignTheme.themeKey,
              name: campaignTheme.themeName,
              matchedBy: campaignTheme.matchedBy,
              matchedValue: campaignTheme.matchedValue,
            },
            entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
            metrics: { avgFrequencyLast7, avgCpmLast7 },
            thresholds: {
              frequencyWarning: campaignTargets.frequencyWarning,
              frequencyCritical: campaignTargets.frequencyCritical,
            },
          });
        } else if (avgFrequencyLast7 >= campaignTargets.frequencyWarning && spendLast7 >= campaignTargets.minSpendForEvaluation) {
          items.push({
            id: `camp-frequency-warning-${campaignIdValue}`,
            ruleId: 'campaign.frequency-high',
            severity: 'warning',
            category: 'campaign',
            action: 'refresh',
            title: 'Frequência alta (atenção)',
            description: `Frequência média ${avgFrequencyLast7.toFixed(2)}x nos últimos 7 dias. Comece a renovar criativos para evitar queda por fadiga.`,
            theme: {
              key: campaignTheme.themeKey,
              name: campaignTheme.themeName,
              matchedBy: campaignTheme.matchedBy,
              matchedValue: campaignTheme.matchedValue,
            },
            entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
            metrics: { avgFrequencyLast7, avgCpmLast7 },
            thresholds: { frequencyWarning: campaignTargets.frequencyWarning },
          });
        }

        // Messaging first reply rate (quality proxy)
        if (
          firstReplyRate != null &&
          messagingLast7 >= campaignTargets.minContactsForEvaluation &&
          firstReplyRate < campaignTargets.firstReplyRateMin &&
          spendLast7 >= campaignTargets.minSpendForEvaluation
        ) {
          items.push({
            id: `camp-first-reply-low-${campaignIdValue}`,
            ruleId: 'campaign.first-reply-low',
            severity: 'warning',
            category: 'campaign',
            action: 'review',
            title: 'Baixa taxa de primeira resposta',
            description: `Taxa de primeira resposta ${formatPercent(firstReplyRate)} (meta: ≥ ${campaignTargets.firstReplyRateMin}%). Pode indicar conversa iniciada mas sem engajamento. Revise criativos e a abordagem inicial no WhatsApp.`,
            theme: {
              key: campaignTheme.themeKey,
              name: campaignTheme.themeName,
              matchedBy: campaignTheme.matchedBy,
              matchedValue: campaignTheme.matchedValue,
            },
            entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
            metrics: { messagingLast7, firstReplyLast7, firstReplyRate },
            thresholds: { firstReplyRateMin: campaignTargets.firstReplyRateMin },
          });
        }

        // Qualification tracking reminders.
        if (contactsLast7 > 0 && spendLast7 > campaignTargets.minSpendForEvaluation && leadTracking.recordsLast7 === 0) {
          items.push({
            id: `qual-missing-${campaignIdValue}`,
            ruleId: 'qualification.missing',
            severity: 'info',
            category: 'qualification',
            action: 'track',
            title: 'Sem dados de qualificação',
            description:
              'Há contatos no período, mas não há registros de qualificação. Preencha “Dados do Funil” para medir a qualidade e o custo por interessado real.',
            theme: {
              key: campaignTheme.themeKey,
              name: campaignTheme.themeName,
              matchedBy: campaignTheme.matchedBy,
              matchedValue: campaignTheme.matchedValue,
            },
            entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
            metrics: { contactsLast7, spendLast7 },
            thresholds: { minSpendForEvaluation: campaignTargets.minSpendForEvaluation },
          });
        }

        // Low qualification rate (manual).
        if (leadTracking.recordsLast7 > 0 && contactsLast7 > 0) {
          const qualificationRate = leadTracking.qualifiedLast7 > 0 ? (leadTracking.qualifiedLast7 / contactsLast7) * 100 : 0;
          const costPerQualified = leadTracking.qualifiedLast7 > 0 ? spendLast7 / leadTracking.qualifiedLast7 : null;

          if (spendLast7 > campaignTargets.minSpendForEvaluation && leadTracking.qualifiedLast7 === 0) {
            items.push({
              id: `qual-zero-${campaignIdValue}`,
              ruleId: 'qualification.zero',
              severity: 'critical',
              category: 'qualification',
              action: 'review',
              title: 'Contatos sem qualificados',
              description: `Contatos sem nenhum qualificado nesta semana com ${formatCurrency(spendLast7)} de gasto. Verifique mensagem, triagem e atendimento. ${topReasons ? `Motivos comuns: ${topReasons}.` : ''}`,
              theme: {
                key: campaignTheme.themeKey,
                name: campaignTheme.themeName,
                matchedBy: campaignTheme.matchedBy,
                matchedValue: campaignTheme.matchedValue,
              },
              entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
              metrics: { contactsLast7, qualifiedLast7: leadTracking.qualifiedLast7, spendLast7 },
              thresholds: { qualificationRateTargetMin: campaignTargets.qualificationRateTargetMin },
            });
          } else if (qualificationRate < campaignTargets.qualificationRateTargetMin) {
            items.push({
              id: `qual-low-${campaignIdValue}`,
              ruleId: 'qualification.low',
              severity: qualificationRate < Math.max(5, campaignTargets.qualificationRateTargetMin * 0.6) ? 'critical' : 'warning',
              category: 'qualification',
              action: 'review',
              title: 'Qualificação baixa',
              description: `Qualificação baixa: ${leadTracking.qualifiedLast7} qualificados em ${contactsLast7} contatos (${formatPercent(qualificationRate)}). ${costPerQualified != null ? `Custo por qualificado: ${formatCurrency(costPerQualified)}.` : ''} ${topReasons ? `Motivos comuns: ${topReasons}.` : ''}`,
              theme: {
                key: campaignTheme.themeKey,
                name: campaignTheme.themeName,
                matchedBy: campaignTheme.matchedBy,
                matchedValue: campaignTheme.matchedValue,
              },
              entity: { type: 'campaign', id: campaignIdValue, name: campaignName },
              metrics: {
                qualificationRate,
                costPerQualified,
                contactsLast7,
                qualifiedLast7: leadTracking.qualifiedLast7,
              },
              thresholds: { qualificationRateTargetMin: campaignTargets.qualificationRateTargetMin },
            });
          }
        }

        if (spendLast7 >= campaignTargets.minSpendForEvaluation && contactsLast7 > 0) {
          actionableCampaigns.push({
            campaignId: campaignIdValue,
            campaignName,
            contactsLast7,
            contactsPrev7,
            spendLast7,
            cplLast7: costPerContact,
            cplPrev7: costPerContactPrev7,
          });
        }

        // If it's clearly a messaging campaign, keep this hint for the consumer.
        if (isMessagingCampaign && spendLast7 > 0 && contactsLast7 > 0 && leadTracking.recordsLast7 > 0) {
          // no-op: placeholder for future playbook rules.
        }
      }

      // Opportunity: scale the best performer this week (simple heuristic)
      const bestCampaign = [...actionableCampaigns]
        .sort((a, b) => b.contactsLast7 - a.contactsLast7)
        .find((c) => c.contactsLast7 >= Math.max(15, targets.minContactsForEvaluation));

      if (bestCampaign) {
        const bestTheme = inferOptimizationTheme(bestCampaign.campaignName);
        const bestTargets = getOptimizationTargetsForTheme(bestTheme.themeKey);
        const contactsDelta = percentChange(bestCampaign.contactsLast7, bestCampaign.contactsPrev7);
        const cplDelta =
          bestCampaign.cplLast7 != null && bestCampaign.cplPrev7 != null
            ? percentChange(bestCampaign.cplLast7, bestCampaign.cplPrev7)
            : null;

        const meetsCplTarget =
          bestCampaign.cplLast7 != null && Number.isFinite(bestCampaign.cplLast7)
            ? bestCampaign.cplLast7 <= bestTargets.targetCplGoodMax
            : false;

        if (
          meetsCplTarget &&
          ((contactsDelta !== null && contactsDelta >= 20) || (cplDelta !== null && cplDelta <= -20))
        ) {
          items.push({
            id: `opp-scale-${bestCampaign.campaignId}`,
            ruleId: 'campaign.scale-opportunity',
            severity: 'opportunity',
            category: 'campaign',
            action: 'scale',
            title: 'Oportunidade de escalar',
            description:
              `A campanha "${bestCampaign.campaignName}" está performando bem nos últimos 7 dias. Considerar aumentar orçamento gradualmente e duplicar criativos vencedores para manter volume sem fadiga.`,
            theme: {
              key: bestTheme.themeKey,
              name: bestTheme.themeName,
              matchedBy: bestTheme.matchedBy,
              matchedValue: bestTheme.matchedValue,
            },
            entity: { type: 'campaign', id: bestCampaign.campaignId, name: bestCampaign.campaignName },
            metrics: {
              contactsLast7: bestCampaign.contactsLast7,
              spendLast7: bestCampaign.spendLast7,
              cplLast7: bestCampaign.cplLast7,
            },
            thresholds: { targetCplGoodMax: bestTargets.targetCplGoodMax },
          });
        }
      }

      // Creative recommendations
      if (enrichedCreatives.length === 0) {
        items.push({
          id: 'creative-missing',
          ruleId: 'data.no-creatives',
          severity: 'info',
          category: 'data',
          action: 'sync',
          title: 'Sem dados de criativos',
          description: 'Não há métricas de criativos no período. Execute um sync da Meta com syncLevel "ad" ou "full" para capturar criativos e snapshots.',
          theme: {
            key: primaryTheme.themeKey,
            name: primaryTheme.themeName,
            matchedBy: primaryTheme.matchedBy,
            matchedValue: primaryTheme.matchedValue,
          },
        });
      } else {
        const losers = enrichedCreatives
          .filter((c: any) => c.status === 'loser')
          .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
          .slice(0, 3);
        for (const c of losers) {
          const spend = c.metrics.totalSpend || 0;
          const conv = c.metrics.totalConversations || 0;
          const severity: OptimizationSeverity = spend >= 400 && conv === 0 ? 'critical' : 'warning';
          items.push({
            id: `creative-loser-${c.snapshotId}`,
            ruleId: 'creative.loser',
            severity,
            category: 'creative',
            action: 'pause',
            title: 'Criativo com baixo desempenho',
            description: `${formatCurrency(spend)} de investimento com ${conv} conversas. Recomenda-se pausar/substituir e criar novas variações (copy/CTA/gancho).`,
            theme: {
              key: primaryTheme.themeKey,
              name: primaryTheme.themeName,
              matchedBy: primaryTheme.matchedBy,
              matchedValue: primaryTheme.matchedValue,
            },
            entity: { type: 'creative', id: c.snapshotId, name: c.headline },
            metrics: { spend, conversations: conv, cpl: c.metrics.cpl ?? null },
            thresholds: {
              creativeMinSpendLoser: targets.creativeMinSpendLoser,
              creativeLoserCplMultiplier: targets.creativeLoserCplMultiplier,
            },
          });
        }

        const fatigued = enrichedCreatives
          .filter((c: any) => c.status === 'fatigued')
          .sort((a: any, b: any) => (b.recent.spend || 0) - (a.recent.spend || 0))
          .slice(0, 3);
        for (const c of fatigued) {
          items.push({
            id: `creative-fatigued-${c.snapshotId}`,
            ruleId: 'creative.fatigued',
            severity: 'warning',
            category: 'creative',
            action: 'refresh',
            title: 'Sinal de fadiga de criativo',
            description: `O criativo perdeu desempenho nos últimos 7 dias. Ação: manter o ângulo vencedor e testar novas variações de título/primeiro segundo/CTA.`,
            theme: {
              key: primaryTheme.themeKey,
              name: primaryTheme.themeName,
              matchedBy: primaryTheme.matchedBy,
              matchedValue: primaryTheme.matchedValue,
            },
            entity: { type: 'creative', id: c.snapshotId, name: c.headline },
            metrics: {
              recentConversations: c.recent.conversations,
              previousConversations: c.previous.conversations,
              recentCpl: c.recent.cpl ?? null,
              previousCpl: c.previous.cpl ?? null,
            },
            thresholds: {
              creativeFatigueDropPct: targets.creativeFatigueDropPct,
              creativeFatigueCplMultiplier: targets.creativeFatigueCplMultiplier,
            },
          });
        }

        const topWinners = winners
          .filter((c: any) => typeof c.metrics.cpl === 'number' && c.metrics.cpl <= targets.targetCplGoodMax)
          .slice(0, 2);
        for (const c of topWinners) {
          items.push({
            id: `creative-winner-${c.snapshotId}`,
            ruleId: 'creative.winner',
            severity: 'opportunity',
            category: 'creative',
            action: 'scale',
            title: 'Criativo vencedor',
            description: 'Este criativo está entre os melhores do período. Use como referência para novas variações e para sustentar escala sem fadiga.',
            theme: {
              key: primaryTheme.themeKey,
              name: primaryTheme.themeName,
              matchedBy: primaryTheme.matchedBy,
              matchedValue: primaryTheme.matchedValue,
            },
            entity: { type: 'creative', id: c.snapshotId, name: c.headline },
            metrics: { spend: c.metrics.totalSpend, conversations: c.metrics.totalConversations, cpl: c.metrics.cpl ?? null },
            thresholds: { targetCplGoodMax: targets.targetCplGoodMax },
          });
        }

        const lowHook = enrichedCreatives
          .filter((c: any) => {
            const hookRate = c.metrics.hookRateAvg;
            return (
              c.isVideo &&
              typeof hookRate === 'number' &&
              Number.isFinite(hookRate) &&
              hookRate > 0 &&
              hookRate < targets.hookRateMin &&
              (c.metrics.totalSpend || 0) >= targets.creativeMinSpendWinner
            );
          })
          .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
          .slice(0, 3);
        for (const c of lowHook) {
          items.push({
            id: `creative-hook-low-${c.snapshotId}`,
            ruleId: 'creative.video-hook-low',
            severity: 'warning',
            category: 'creative',
            action: 'refresh',
            title: 'Hook baixo (vídeo)',
            description: `Hook rate ${c.metrics.hookRateAvg?.toFixed?.(1) ?? c.metrics.hookRateAvg}% abaixo do mínimo sugerido. Ajuste os 1–3 primeiros segundos (gancho/promessa/prova).`,
            theme: {
              key: primaryTheme.themeKey,
              name: primaryTheme.themeName,
              matchedBy: primaryTheme.matchedBy,
              matchedValue: primaryTheme.matchedValue,
            },
            entity: { type: 'creative', id: c.snapshotId, name: c.headline },
            metrics: {
              spend: c.metrics.totalSpend,
              conversations: c.metrics.totalConversations,
              hookRateAvg: c.metrics.hookRateAvg ?? null,
            },
            thresholds: { hookRateMin: targets.hookRateMin },
          });
        }

        const lowHold = enrichedCreatives
          .filter((c: any) => {
            const holdRate = c.metrics.holdRateAvg;
            return (
              c.isVideo &&
              typeof holdRate === 'number' &&
              Number.isFinite(holdRate) &&
              holdRate > 0 &&
              holdRate < targets.holdRateMin &&
              (c.metrics.totalSpend || 0) >= targets.creativeMinSpendWinner
            );
          })
          .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
          .slice(0, 3);
        for (const c of lowHold) {
          items.push({
            id: `creative-hold-low-${c.snapshotId}`,
            ruleId: 'creative.video-hold-low',
            severity: 'info',
            category: 'creative',
            action: 'refresh',
            title: 'Hold baixo (vídeo)',
            description: `Hold rate ${c.metrics.holdRateAvg?.toFixed?.(1) ?? c.metrics.holdRateAvg}% abaixo do mínimo sugerido. Ajuste ritmo, estrutura e clareza da mensagem.`,
            theme: {
              key: primaryTheme.themeKey,
              name: primaryTheme.themeName,
              matchedBy: primaryTheme.matchedBy,
              matchedValue: primaryTheme.matchedValue,
            },
            entity: { type: 'creative', id: c.snapshotId, name: c.headline },
            metrics: {
              spend: c.metrics.totalSpend,
              conversations: c.metrics.totalConversations,
              holdRateAvg: c.metrics.holdRateAvg ?? null,
            },
            thresholds: { holdRateMin: targets.holdRateMin },
          });
        }

        // Copy recommendations (snapshot + CTA)
        const normalizeCopyText = (value: string) =>
          value
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .trim();

        const preferredCtas = OPTIMIZATION_CENTER_PLAYBOOK_V1.copy?.preferredCtaTypes ?? ['WHATSAPP_MESSAGE', 'SEND_MESSAGE'];
        const prohibitedPhrases = OPTIMIZATION_CENTER_PLAYBOOK_V1.copy?.prohibitedPhrases ?? [];

        const copyCandidateIds = new Set<string>();
        for (const c of winners.slice(0, 5)) copyCandidateIds.add(c.snapshotId);
        for (const c of enrichedCreatives.filter((c: any) => c.status !== 'neutral').slice(0, 8)) copyCandidateIds.add(c.snapshotId);
        for (const c of enrichedCreatives.slice(0, 6)) copyCandidateIds.add(c.snapshotId);

        const copyCandidates = enrichedCreatives.filter((c: any) => copyCandidateIds.has(c.snapshotId));

        for (const c of copyCandidates as any[]) {
          const campaignName = Array.isArray(c.campaigns) && c.campaigns.length > 0 ? c.campaigns[0] : '';
          const creativeTheme = campaignName ? inferOptimizationTheme(campaignName) : primaryTheme;
          const creativeTargets = getOptimizationTargetsForTheme(creativeTheme.themeKey);

          const spend = c.metrics?.totalSpend || 0;
          const conv = c.metrics?.totalConversations || 0;
          const isImportant =
            c.status !== 'neutral' ||
            spend >= creativeTargets.creativeMinSpendWinner ||
            conv >= Math.max(3, Math.floor(creativeTargets.minContactsForEvaluation / 3));

          if (!isImportant) continue;

          const headline = safeText(c.headline);
          const primaryText = safeText(c.primaryText);
          const description = safeText(c.description);
          const ctaType = typeof c.ctaType === 'string' && c.ctaType.trim() ? c.ctaType.trim() : null;

          const combined = [headline, primaryText, description].filter(Boolean).join(' ');
          const combinedNormalized = combined ? normalizeCopyText(combined) : '';

          // Missing copy insights (stored)
          if (!c.copyInsightsStatus) {
            items.push({
              id: `creative-copy-insights-missing-${c.snapshotId}`,
              ruleId: 'creative.copy-insights-missing',
              severity: 'info',
              category: 'creative',
              action: 'review',
              title: 'Sem insights de copy',
              description:
                'Ainda não há análise de copy salva para este criativo. Gere sugestões (IA/fallback) e use como base para novas variações.',
              theme: {
                key: creativeTheme.themeKey,
                name: creativeTheme.themeName,
                matchedBy: creativeTheme.matchedBy,
                matchedValue: creativeTheme.matchedValue,
              },
              entity: { type: 'creative', id: c.snapshotId, name: headline ?? 'Criativo' },
              metrics: { spend, conversations: conv, cpl: c.metrics?.cpl ?? null },
            });
          }

          // Headline missing
          if (!headline) {
            items.push({
              id: `creative-copy-missing-headline-${c.snapshotId}`,
              ruleId: 'creative.copy-missing-headline',
              severity: 'warning',
              category: 'creative',
              action: 'refresh',
              title: 'Criativo sem título (headline)',
              description:
                'O snapshot não possui headline (título). Preencha um título curto e claro para aumentar clique e facilitar testes.',
              theme: {
                key: creativeTheme.themeKey,
                name: creativeTheme.themeName,
                matchedBy: creativeTheme.matchedBy,
                matchedValue: creativeTheme.matchedValue,
              },
              entity: { type: 'creative', id: c.snapshotId, name: 'Criativo' },
              metrics: { spend, conversations: conv },
              thresholds: {
                copyHeadlineMinChars: creativeTargets.copyHeadlineMinChars,
                copyHeadlineMaxChars: creativeTargets.copyHeadlineMaxChars,
              },
            });
          } else {
            // Headline length guardrail
            if (headline.length < creativeTargets.copyHeadlineMinChars || headline.length > creativeTargets.copyHeadlineMaxChars) {
              const reason =
                headline.length < creativeTargets.copyHeadlineMinChars
                  ? `muito curto (${headline.length} chars)`
                  : `muito longo (${headline.length} chars)`;

              items.push({
                id: `creative-copy-headline-length-${c.snapshotId}`,
                ruleId: 'creative.copy-headline-length',
                severity: 'info',
                category: 'creative',
                action: 'refresh',
                title: 'Título fora do recomendado',
                description: `Headline ${reason}. Ajuste para ficar entre ${creativeTargets.copyHeadlineMinChars} e ${creativeTargets.copyHeadlineMaxChars} caracteres.`,
                theme: {
                  key: creativeTheme.themeKey,
                  name: creativeTheme.themeName,
                  matchedBy: creativeTheme.matchedBy,
                  matchedValue: creativeTheme.matchedValue,
                },
                entity: { type: 'creative', id: c.snapshotId, name: headline },
                metrics: { spend, conversations: conv },
                thresholds: {
                  copyHeadlineMinChars: creativeTargets.copyHeadlineMinChars,
                  copyHeadlineMaxChars: creativeTargets.copyHeadlineMaxChars,
                },
              });
            }
          }

          // Primary text too long
          if (primaryText && primaryText.length > creativeTargets.copyPrimaryTextMaxChars) {
            items.push({
              id: `creative-copy-primary-too-long-${c.snapshotId}`,
              ruleId: 'creative.copy-primary-too-long',
              severity: 'info',
              category: 'creative',
              action: 'refresh',
              title: 'Texto principal muito longo',
              description: `Texto com ${primaryText.length} caracteres. Para WhatsApp, prefira algo curto e direto (≤ ${creativeTargets.copyPrimaryTextMaxChars}).`,
              theme: {
                key: creativeTheme.themeKey,
                name: creativeTheme.themeName,
                matchedBy: creativeTheme.matchedBy,
                matchedValue: creativeTheme.matchedValue,
              },
              entity: { type: 'creative', id: c.snapshotId, name: headline ?? 'Criativo' },
              metrics: { spend, conversations: conv },
              thresholds: { copyPrimaryTextMaxChars: creativeTargets.copyPrimaryTextMaxChars },
            });
          }

          // CTA mismatch for conversation objective
          if (ctaType && !preferredCtas.includes(ctaType)) {
            items.push({
              id: `creative-copy-cta-mismatch-${c.snapshotId}`,
              ruleId: 'creative.copy-cta-mismatch',
              severity: 'warning',
              category: 'creative',
              action: 'refresh',
              title: 'CTA pouco compatível com conversa',
              description: `CTA atual: ${ctaType}. Para campanhas de conversa, teste ${preferredCtas.join(' / ')}.`,
              theme: {
                key: creativeTheme.themeKey,
                name: creativeTheme.themeName,
                matchedBy: creativeTheme.matchedBy,
                matchedValue: creativeTheme.matchedValue,
              },
              entity: { type: 'creative', id: c.snapshotId, name: headline ?? 'Criativo' },
              metrics: { spend, conversations: conv, cpl: c.metrics?.cpl ?? null },
              thresholds: { preferredCtaTypes: preferredCtas.join(',') },
            });
          }

          // Theme not mentioned in copy (heuristic)
          if (creativeTheme.themeKey !== 'geral' && combined) {
            const inferredFromCopy = inferOptimizationTheme(combined);
            if (inferredFromCopy.themeKey === 'geral') {
              items.push({
                id: `creative-copy-theme-not-mentioned-${c.snapshotId}`,
                ruleId: 'creative.copy-theme-not-mentioned',
                severity: 'info',
                category: 'creative',
                action: 'refresh',
                title: 'Copy não cita o tema',
                description: `Tema detectado: ${creativeTheme.themeName}, mas a copy não contém palavras-chave claras do tema. Sugestão: explicitar o assunto para aumentar qualificação.`,
                theme: {
                  key: creativeTheme.themeKey,
                  name: creativeTheme.themeName,
                  matchedBy: creativeTheme.matchedBy,
                  matchedValue: creativeTheme.matchedValue,
                },
                entity: { type: 'creative', id: c.snapshotId, name: headline ?? 'Criativo' },
                metrics: { spend, conversations: conv },
              });
            }
          }

          // Compliance risk (prohibited phrases)
          if (combinedNormalized && prohibitedPhrases.length > 0) {
            const matched = prohibitedPhrases.find((phrase) => combinedNormalized.includes(normalizeCopyText(phrase)));
            if (matched) {
              items.push({
                id: `creative-copy-compliance-risk-${c.snapshotId}`,
                ruleId: 'creative.copy-compliance-risk',
                severity: 'warning',
                category: 'creative',
                action: 'review',
                title: 'Risco de promessa (copy)',
                description: `Detectado termo de promessa absoluta (“${matched}”). Ajuste a copy para evitar promessas e reduzir risco de reprovação.`,
                theme: {
                  key: creativeTheme.themeKey,
                  name: creativeTheme.themeName,
                  matchedBy: creativeTheme.matchedBy,
                  matchedValue: creativeTheme.matchedValue,
                },
                entity: { type: 'creative', id: c.snapshotId, name: headline ?? 'Criativo' },
                metrics: { spend, conversations: conv },
                thresholds: { prohibitedPhrase: matched },
              });
            }
          }
        }
      }

      const summary = { critical: 0, warning: 0, info: 0, opportunity: 0 };
      for (const item of items) summary[item.severity] += 1;

      items.sort((a, b) => {
        const order: Record<OptimizationSeverity, number> = {
          critical: 0,
          warning: 1,
          opportunity: 2,
          info: 3,
        };
        return order[a.severity] - order[b.severity];
      });

      const highlights = {
        winners: winners.slice(0, 5).map((c: any) => ({
          snapshotId: c.snapshotId,
          headline: c.headline,
          ctaType: c.ctaType,
          thumbnailUrl: c.thumbnailUrl || c.imageUrl || null,
          isDynamic: c.isDynamic,
          spend: c.metrics.totalSpend,
          conversations: c.metrics.totalConversations,
          cpl: c.metrics.cpl ?? null,
        })),
        losers: enrichedCreatives
          .filter((c: any) => c.status === 'loser')
          .sort((a: any, b: any) => (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0))
          .slice(0, 5)
          .map((c: any) => ({
            snapshotId: c.snapshotId,
            headline: c.headline,
            ctaType: c.ctaType,
            thumbnailUrl: c.thumbnailUrl || c.imageUrl || null,
            isDynamic: c.isDynamic,
            spend: c.metrics.totalSpend,
            conversations: c.metrics.totalConversations,
            cpl: c.metrics.cpl ?? null,
          })),
        fatigued: enrichedCreatives
          .filter((c: any) => c.status === 'fatigued')
          .sort((a: any, b: any) => (b.recent.spend || 0) - (a.recent.spend || 0))
          .slice(0, 5)
          .map((c: any) => ({
            snapshotId: c.snapshotId,
            headline: c.headline,
            ctaType: c.ctaType,
            thumbnailUrl: c.thumbnailUrl || c.imageUrl || null,
            isDynamic: c.isDynamic,
            spend: c.metrics.totalSpend,
            conversations: c.metrics.totalConversations,
            cpl: c.metrics.cpl ?? null,
          })),
      };

      return {
        clientId,
        period: { start, end },
        scope: campaignId ? { campaignId } : { clientId },
        generatedAt: new Date().toISOString(),
        playbookVersion: OPTIMIZATION_CENTER_PLAYBOOK_V1.version,
        theme: {
          ...primaryTheme,
          targets,
        },
        summary: { ...summary, total: items.length },
        highlights,
        items,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch optimization center',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Creative library for a client (aggregated by creative snapshot)
  fastify.get<{
    Params: { clientId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string; campaignId?: string };
  }>('/api/clients/:clientId/creative-library', async (request, reply) => {
    try {
      const { clientId } = request.params;
      const { period = '30d', startDate, endDate, campaignId } = request.query;

      const days =
        period === '7d'
          ? 7
          : period === '14d'
            ? 14
            : period === '60d'
              ? 60
              : period === '90d'
                ? 90
                : 30;

      const end = endDate || toIsoDateUtc(new Date());
      const start =
        startDate || toIsoDateUtc(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

      const endMinus6 = shiftIsoDateUtc(end, -6);
      const endMinus13 = shiftIsoDateUtc(end, -13);

      const adsetNames = await pool.query(
        `SELECT
          a.adset_id,
          MAX(a.adset_name) as adset_name
        FROM adset_metrics a
        JOIN campaigns c ON c.id = a.campaign_id
        WHERE c."clientId" = $1
          AND a.date >= $2
          AND a.date <= $3
          AND ($4::text IS NULL OR a.campaign_id = $4)
        GROUP BY a.adset_id`,
        [clientId, start, end, campaignId || null]
      );

      const adsetNameById = new Map<string, string | null>();
      for (const row of adsetNames.rows) {
        adsetNameById.set(String(row.adset_id), row.adset_name || null);
      }

      const result = await pool.query(
        `WITH creative_agg AS (
          SELECT
            m.creative_snapshot_id,
            MAX(m.creative_id) as creative_id,
            array_agg(DISTINCT c.name) as campaigns,
            array_agg(DISTINCT m.adset_id) FILTER (WHERE m.adset_id IS NOT NULL) as adset_ids,
            COUNT(DISTINCT m.ad_id)::int as ads_count,
            COALESCE(SUM(m.spend), 0) as total_spend,
            COALESCE(SUM(m.messaging_conversations), 0)::int as total_conversations,
            COALESCE(SUM(m.impressions), 0)::int as total_impressions,
            COALESCE(SUM(m.clicks), 0)::int as total_clicks,
            COALESCE(AVG(m.ctr), 0) as avg_ctr,
            COALESCE(AVG(m.cpm), 0) as avg_cpm,
            COALESCE(SUM(CASE WHEN m.date >= $5 THEN m.spend ELSE 0 END), 0) as spend_last7,
            COALESCE(SUM(CASE WHEN m.date >= $5 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_last7,
            COALESCE(SUM(CASE WHEN m.date >= $6 AND m.date < $5 THEN m.spend ELSE 0 END), 0) as spend_prev7,
            COALESCE(SUM(CASE WHEN m.date >= $6 AND m.date < $5 THEN m.messaging_conversations ELSE 0 END), 0)::int as conv_prev7
          FROM ad_creative_metrics m
          JOIN campaigns c ON c.id = m.campaign_id
          WHERE c."clientId" = $1
            AND m.date >= $2
            AND m.date <= $3
            AND ($4::text IS NULL OR m.campaign_id = $4)
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
          s.captured_at as captured_at,
          s.last_seen_at as last_seen_at,
          a.campaigns,
          a.adset_ids,
          a.ads_count,
          a.total_spend,
          a.total_conversations,
          a.total_impressions,
          a.total_clicks,
          a.avg_ctr,
          a.avg_cpm,
          a.spend_last7,
          a.conv_last7,
          a.spend_prev7,
          a.conv_prev7
        FROM creative_agg a
        LEFT JOIN ad_creative_snapshots s ON s.id = a.creative_snapshot_id
        ORDER BY a.total_spend DESC`,
        [clientId, start, end, campaignId || null, endMinus6, endMinus13]
      );

      const creatives = result.rows.map((row: any) => {
        const totalSpend = parseFloat(row.total_spend) || 0;
        const totalConversations = parseInt(row.total_conversations) || 0;
        const cpl = totalConversations > 0 ? totalSpend / totalConversations : null;

        const spendLast7 = parseFloat(row.spend_last7) || 0;
        const convLast7 = parseInt(row.conv_last7) || 0;
        const cplLast7 = convLast7 > 0 ? spendLast7 / convLast7 : null;

        const spendPrev7 = parseFloat(row.spend_prev7) || 0;
        const convPrev7 = parseInt(row.conv_prev7) || 0;
        const cplPrev7 = convPrev7 > 0 ? spendPrev7 / convPrev7 : null;

        const conversationsPct =
          convPrev7 > 0 ? ((convLast7 - convPrev7) / convPrev7) * 100 : null;
        const cplPct =
          cplPrev7 && cplLast7 ? ((cplLast7 - cplPrev7) / cplPrev7) * 100 : null;

        const adsetIds = toStringArray(row.adset_ids);
        const adsets = adsetIds.map((id) => ({
          adsetId: id,
          adsetName: adsetNameById.get(id) ?? null,
        }));

        return {
          snapshotId: row.creative_snapshot_id,
          creativeId: row.creative_id || null,
          capturedAt: row.captured_at || null,
          lastSeenAt: row.last_seen_at || null,
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
          campaigns: toStringArray(row.campaigns),
          adsets,
          adsCount: parseInt(row.ads_count) || 0,
          metrics: {
            totalSpend,
            totalConversations,
            totalImpressions: parseInt(row.total_impressions) || 0,
            totalClicks: parseInt(row.total_clicks) || 0,
            avgCtr: parseFloat(row.avg_ctr) || 0,
            avgCpm: parseFloat(row.avg_cpm) || 0,
            cpl,
          },
          recent: {
            spend: spendLast7,
            conversations: convLast7,
            cpl: cplLast7,
          },
          previous: {
            spend: spendPrev7,
            conversations: convPrev7,
            cpl: cplPrev7,
          },
          deltas: {
            conversationsPct,
            cplPct,
          },
        };
      });

      const cplValues = creatives
        .map((c: any) => c.metrics.cpl)
        .filter((value: any): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
      const medianCpl = median(cplValues);

      const eligible = creatives.filter((c: any) => c.metrics.totalSpend >= 50 && c.metrics.totalConversations > 0);
      const winnerCount = Math.min(5, Math.max(1, Math.ceil(eligible.length * 0.2)));
      const winners = [...eligible].sort((a: any, b: any) => b.metrics.totalConversations - a.metrics.totalConversations).slice(0, winnerCount);
      const winnerIds = new Set<string>(winners.map((c: any) => c.snapshotId));

      const loserIds = new Set<string>(
        creatives
          .filter((c: any) => {
            const spend = c.metrics.totalSpend || 0;
            const conv = c.metrics.totalConversations || 0;
            const cpl = c.metrics.cpl;
            if (spend >= 200 && conv === 0) return true;
            if (spend >= 200 && medianCpl && typeof cpl === 'number' && cpl >= medianCpl * 2 && conv <= 3) return true;
            return false;
          })
          .map((c: any) => c.snapshotId)
      );

      const fatiguedIds = new Set<string>(
        creatives
          .filter((c: any) => {
            const convPrev = c.previous.conversations || 0;
            const convLast = c.recent.conversations || 0;
            const spendPrev = c.previous.spend || 0;
            const spendLast = c.recent.spend || 0;
            const cplPrev = c.previous.cpl;
            const cplLast = c.recent.cpl;

            if (convPrev >= 10 && convLast <= convPrev * 0.5 && spendLast >= Math.min(spendPrev * 0.8, 100) && spendLast >= 100) {
              return true;
            }
            if (convPrev >= 5 && convLast >= 3 && spendLast >= 100 && typeof cplPrev === 'number' && typeof cplLast === 'number' && cplLast >= cplPrev * 1.5) {
              return true;
            }
            return false;
          })
          .map((c: any) => c.snapshotId)
      );

      const enriched = creatives.map((c: any) => {
        const isWinner = winnerIds.has(c.snapshotId);
        const isLoser = loserIds.has(c.snapshotId);
        const isFatigued = fatiguedIds.has(c.snapshotId);
        const status = isFatigued ? 'fatigued' : isWinner ? 'winner' : isLoser ? 'loser' : 'neutral';
        return {
          ...c,
          flags: {
            winner: isWinner,
            loser: isLoser,
            fatigued: isFatigued,
          },
          status,
        };
      });

      const insightsSource = winners.length > 0 ? winners : enriched;
      const ctaAgg = new Map<string, { conversations: number; spend: number }>();
      const headlineAgg = new Map<string, { conversations: number; spend: number }>();

      for (const c of insightsSource as any[]) {
        const conv = c.metrics.totalConversations || 0;
        const spend = c.metrics.totalSpend || 0;
        if (c.ctaType) {
          const current = ctaAgg.get(c.ctaType) ?? { conversations: 0, spend: 0 };
          current.conversations += conv;
          current.spend += spend;
          ctaAgg.set(c.ctaType, current);
        }
        if (c.headline) {
          const key = String(c.headline).trim();
          if (key) {
            const current = headlineAgg.get(key) ?? { conversations: 0, spend: 0 };
            current.conversations += conv;
            current.spend += spend;
            headlineAgg.set(key, current);
          }
        }
      }

      const topCtas = Array.from(ctaAgg.entries())
        .map(([ctaType, data]) => ({
          ctaType,
          conversations: data.conversations,
          spend: Number(data.spend.toFixed(2)),
          cpl: data.conversations > 0 ? Number((data.spend / data.conversations).toFixed(2)) : null,
        }))
        .sort((a, b) => b.conversations - a.conversations)
        .slice(0, 6);

      const topHeadlines = Array.from(headlineAgg.entries())
        .map(([headline, data]) => ({
          headline,
          conversations: data.conversations,
          spend: Number(data.spend.toFixed(2)),
          cpl: data.conversations > 0 ? Number((data.spend / data.conversations).toFixed(2)) : null,
        }))
        .sort((a, b) => b.conversations - a.conversations)
        .slice(0, 6);

      return {
        clientId,
        period: { start, end },
        scope: campaignId ? { campaignId } : { clientId },
        total: enriched.length,
        creatives: enriched,
        insights: {
          medianCpl: medianCpl != null ? Number(medianCpl.toFixed(2)) : null,
          topCtas,
          topHeadlines,
          counts: {
            winners: winnerIds.size,
            losers: loserIds.size,
            fatigued: fatiguedIds.size,
          },
        },
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch creative library',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get a creative snapshot by ID
  fastify.get<{
    Params: { snapshotId: string };
  }>('/api/creative-snapshots/:snapshotId', async (request, reply) => {
    try {
      const { snapshotId } = request.params;

      const result = await pool.query(
        `SELECT
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
          asset_feed_spec
        FROM ad_creative_snapshots
        WHERE id = $1
        LIMIT 1`,
        [snapshotId]
      );

      if (result.rows.length === 0) {
        reply.status(404);
        return { error: 'Creative snapshot not found' };
      }

      const row = result.rows[0] as any;
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
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch creative snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // List snapshots for a creative
  fastify.get<{
    Params: { creativeId: string };
    Querystring: { limit?: string };
  }>('/api/creatives/:creativeId/snapshots', async (request, reply) => {
    try {
      const { creativeId } = request.params;
      const limit = Math.max(1, Math.min(200, Number.parseInt(request.query.limit || '50', 10) || 50));

      const result = await pool.query(
        `SELECT
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
        WHERE creative_id = $1
        ORDER BY captured_at DESC
        LIMIT $2`,
        [creativeId, limit]
      );

      const snapshots = result.rows.map((row: any) => ({
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
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to list creative snapshots',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Breakdowns endpoint
  fastify.get<{
    Params: { campaignId: string; type: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/breakdowns/:type', async (request, reply) => {
    try {
      const { campaignId, type } = request.params;
      const validTypes = ['age_gender', 'platform_position', 'device'];
      if (!validTypes.includes(type)) {
        reply.status(400);
        return { error: `Invalid breakdown type. Valid types: ${validTypes.join(', ')}` };
      }

      const { period = '30d', startDate, endDate } = request.query;
      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT breakdown_data, date, total_spend, total_impressions, total_conversions
         FROM metrics_breakdowns
         WHERE campaign_id = $1 AND breakdown_type = $2 AND date >= $3 AND date <= $4
         ORDER BY date DESC`,
        [campaignId, type, start, end]
      );

      const segmentMap = new Map<string, { label: string; impressions: number; clicks: number; spend: number; reach: number; conversions: number }>();

      for (const row of result.rows) {
        const segments = typeof row.breakdown_data === 'string' ? JSON.parse(row.breakdown_data) : row.breakdown_data;
        for (const seg of segments) {
          const key = seg.label || 'unknown';
          const existing = segmentMap.get(key) || { label: key, impressions: 0, clicks: 0, spend: 0, reach: 0, conversions: 0 };
          existing.impressions += seg.impressions || 0;
          existing.clicks += seg.clicks || 0;
          existing.spend += seg.spend || 0;
          existing.reach += seg.reach || 0;
          existing.conversions += seg.messaging_conversations || 0;
          segmentMap.set(key, existing);
        }
      }

      const segments = Array.from(segmentMap.values())
        .map(seg => ({
          ...seg,
          ctr: seg.impressions > 0 ? (seg.clicks / seg.impressions) * 100 : 0,
          cpm: seg.impressions > 0 ? (seg.spend / seg.impressions) * 1000 : 0,
          shareOfSpend: 0,
        }))
        .sort((a, b) => b.spend - a.spend);

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
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch breakdown data',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Temporal analysis endpoint
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/temporal-analysis', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;
      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const dowResult = await pool.query(
        `SELECT
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
        WHERE campaign_id = $1 AND date >= $2 AND date <= $3
        GROUP BY EXTRACT(DOW FROM date)
        ORDER BY EXTRACT(DOW FROM date)`,
        [campaignId, start, end]
      );

      const dayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

      const byDayOfWeek = dowResult.rows.map((row: any) => {
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
      const sortedByCpl = [...byDayOfWeek].filter(d => d.cpl > 0).sort((a, b) => a.cpl - b.cpl);

      return {
        campaignId,
        byDayOfWeek,
        bestDay: sortedByConversions[0]?.dayName || null,
        worstDay: sortedByConversions[sortedByConversions.length - 1]?.dayName || null,
        cheapestDay: sortedByCpl[0]?.dayName || null,
        mostExpensiveDay: sortedByCpl[sortedByCpl.length - 1]?.dayName || null,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch temporal analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Business metrics endpoint (CAC, LTV)
  fastify.get<{
    Params: { campaignId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/api/campaigns/:campaignId/business-metrics', async (request, reply) => {
    try {
      const { campaignId } = request.params;
      const { period = '30d', startDate, endDate } = request.query;
      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '60d' ? 60 : period === '90d' ? 90 : 30;
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const metricsResult = await pool.query(
        `SELECT SUM(spend) as total_spend, SUM(conversions) as total_conversions,
                SUM(messaging_conversations) as total_conversations
         FROM campaign_metrics
         WHERE campaign_id = $1 AND date >= $2 AND date <= $3`,
        [campaignId, start, end]
      );

      const totalSpend = parseFloat(metricsResult.rows[0]?.total_spend) || 0;
      const totalConversations = parseInt(metricsResult.rows[0]?.total_conversations) || 0;

      const leadResult = await pool.query(
        `SELECT SUM(contracts_closed) as total_contracts,
                SUM(revenue_generated) as total_revenue,
                AVG(average_ticket) as avg_ticket
         FROM campaign_lead_tracking
         WHERE campaign_id = $1 AND date >= $2 AND date <= $3`,
        [campaignId, start, end]
      );

      const totalContracts = parseInt(leadResult.rows[0]?.total_contracts) || 0;
      const totalRevenue = parseFloat(leadResult.rows[0]?.total_revenue) || 0;
      const avgTicket = parseFloat(leadResult.rows[0]?.avg_ticket) || 0;

       const campaignResult = await pool.query(
         `SELECT c.avg_client_lifetime_months, c.avg_monthly_revenue_per_client
          FROM campaigns camp
          JOIN clients c ON camp."clientId" = c.id
          WHERE camp.id = $1`,
         [campaignId]
       );

      const lifetimeMonths = parseFloat(campaignResult.rows[0]?.avg_client_lifetime_months) || 12;
      const monthlyRevenue = parseFloat(campaignResult.rows[0]?.avg_monthly_revenue_per_client) || avgTicket;

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
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch business metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default analyticsRoutes;
