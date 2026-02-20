import { FastifyPluginAsync } from 'fastify';
import { resolveOptimizationTheme } from '../../services/optimization-playbook';
import { generateCopyInsights } from '../../services/creative-copy-insights';

const copyInsightsRoutes: FastifyPluginAsync = async (fastify) => {


  // Copy insights (AI) for a creative snapshot
  fastify.get<{
    Params: { snapshotId: string };
  }>('/api/creative-snapshots/:snapshotId/copy-insights', async (request, reply) => {
    try {
      const { snapshotId } = request.params;

      const { analytics } = fastify.services;
      const result = await analytics.getCopyInsight(snapshotId);

      if (!result) {
        reply.status(404);
        return { error: 'Copy insights not found' };
      }

      return result;
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
      const { analytics } = fastify.services;

      const existing = await analytics.getCopyInsight(snapshotId);

      if (!force && existing && existing.status === 'success') {
        return { success: true, snapshotId, reused: true };
      }

      const snapshot = await analytics.getCreativeSnapshot(snapshotId);

      if (!snapshot) {
        reply.status(404);
        return { error: 'Creative snapshot not found' };
      }

      const themeKeyFromBody =
        typeof body.themeKey === 'string' && body.themeKey.trim() ? body.themeKey.trim() : null;
      const themeNameFromBody =
        typeof body.themeName === 'string' && body.themeName.trim() ? body.themeName.trim() : null;

      let campaignName: string | null = null;
      let campaignThemeKey: string | null = null;
      let campaignSubthemeKey: string | null = null;

      if (!themeKeyFromBody) {
        const campaignTheme = await analytics.getCampaignThemeBySnapshotId(snapshotId);
        campaignName = campaignTheme?.campaignName ?? null;
        campaignThemeKey = campaignTheme?.themeKey ?? null;
        campaignSubthemeKey = campaignTheme?.subthemeKey ?? null;
      }

      const resolved = resolveOptimizationTheme({
        campaignName: themeNameFromBody ?? campaignName ?? '',
        themeKey: themeKeyFromBody ?? campaignThemeKey ?? null,
        subthemeKey: campaignSubthemeKey ?? null,
      });

      const theme = {
        themeKey: resolved.themeKey,
        themeName: themeNameFromBody ?? resolved.themeName,
        matchedBy: themeKeyFromBody ? 'manual' : resolved.matchedBy,
        matchedValue: themeKeyFromBody ? themeKeyFromBody : resolved.matchedValue,
      } as any;

      const insights = await generateCopyInsights({
        snapshot: {
          snapshotId: snapshot.snapshotId,
          headline: snapshot.headline,
          primaryText: snapshot.primaryText,
          description: snapshot.description,
          ctaType: snapshot.ctaType,
          destinationUrl: snapshot.destinationUrl,
          isDynamic: snapshot.isDynamic,
          headlines: snapshot.headlines,
          primaryTexts: snapshot.primaryTexts,
          descriptions: snapshot.descriptions,
          ctaTypes: snapshot.ctaTypes,
          destinationUrls: snapshot.destinationUrls,
          format: snapshot.format,
        },
        theme,
        force,
        aiOutputs: fastify.services.aiOutputs,
      });

      await analytics.upsertCopyInsight({
        snapshotId,
        themeKey: theme.themeKey ?? null,
        themeName: theme.themeName ?? null,
        status: insights.status,
        model: insights.model ?? null,
        promptId: insights.promptId ?? null,
        promptVersion: insights.promptVersion,
        analysis: JSON.stringify(insights.analysis),
        errorMessage: insights.errorMessage ?? null,
      });

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
