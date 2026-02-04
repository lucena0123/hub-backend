import { FastifyPluginAsync } from 'fastify';
import { inferOptimizationTheme } from '../../services/optimization-playbook';
import { generateCopyInsights } from '../../services/creative-copy-insights';

const copyInsightsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

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

      const themeKeyFromBody =
        typeof body.themeKey === 'string' && body.themeKey.trim() ? body.themeKey.trim() : null;
      const themeNameFromBody =
        typeof body.themeName === 'string' && body.themeName.trim() ? body.themeName.trim() : null;

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
};

export default copyInsightsRoutes;

