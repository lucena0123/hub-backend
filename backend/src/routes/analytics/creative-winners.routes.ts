import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { shiftIsoDateUtc, toIsoDateUtc, toStringArray } from '../../utils';
import { scoreCreatives } from './optimization-center/creative-scoring';
import {
  getOptimizationTargetsForTheme,
  resolveOptimizationTheme,
} from '../../services/optimization-playbook';

const creativeWinnersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/api/clients/:clientId/creative-winners', async (request, reply) => {
    const { clientId } = request.params as { clientId: string };
    const { period = '90d', limit = '20' } = request.query as { period?: string; limit?: string };

    try {
      const analytics = fastify.services.analytics;
      const days = parseInt(period) || 90;
      const maxResults = Math.min(parseInt(limit) || 20, 50);

      const end = toIsoDateUtc(new Date());
      const start = toIsoDateUtc(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
      const endMinus6 = shiftIsoDateUtc(end, -6);
      const endMinus13 = shiftIsoDateUtc(end, -13);

      let clientTargetOverrides: Record<string, unknown> | null = null;
      try {
        clientTargetOverrides = await analytics.getClientOptimizationTargets(clientId);
      } catch (_) {}

      const creativeRows = await analytics.getCreativeLibraryStats(
        clientId, start, end, endMinus6, endMinus13
      );

      if (creativeRows.length === 0) {
        return { clientId, period: { start, end }, winners: [], total: 0 };
      }

      const primaryRow = creativeRows[0] as any;
      const primaryName = String(primaryRow?.campaigns?.[0] || '');
      const primaryThemeKey = toStringArray(primaryRow?.optimization_theme_keys)?.[0] ?? null;
      const primarySubthemeKey = toStringArray(primaryRow?.optimization_subtheme_keys)?.[0] ?? null;
      const theme = resolveOptimizationTheme({
        campaignName: primaryName,
        themeKey: primaryThemeKey,
        subthemeKey: primarySubthemeKey,
      });
      const targets = getOptimizationTargetsForTheme(theme.themeKey, clientTargetOverrides);

      const creatives = creativeRows.map((row: any) => {
        const totalSpend = parseFloat(row.total_spend) || 0;
        const totalConversations = parseInt(row.total_conversations) || 0;
        const cpl = totalConversations > 0 ? totalSpend / totalConversations : null;

        const spendLast7 = parseFloat(row.spend_last7) || 0;
        const convLast7 = parseInt(row.conv_last7) || 0;
        const cplLast7 = convLast7 > 0 ? spendLast7 / convLast7 : null;

        const spendPrev7 = parseFloat(row.spend_prev7) || 0;
        const convPrev7 = parseInt(row.conv_prev7) || 0;
        const cplPrev7 = convPrev7 > 0 ? spendPrev7 / convPrev7 : null;

        return {
          snapshotId: String(row.creative_snapshot_id),
          headline: row.headline || null,
          primaryText: row.primary_text || null,
          description: row.description || null,
          ctaType: row.cta_type || null,
          imageUrl: row.image_url || null,
          thumbnailUrl: row.thumbnail_url || null,
          campaigns: toStringArray(row.campaigns),
          adNames: toStringArray(row.ad_names),
          metrics: { totalSpend, totalConversations, cpl },
          recent: { spend: spendLast7, conversations: convLast7, cpl: cplLast7 },
          previous: { spend: spendPrev7, conversations: convPrev7, cpl: cplPrev7 },
          deltas: {
            conversationsPct: convPrev7 > 0 ? ((convLast7 - convPrev7) / convPrev7) * 100 : null,
            cplPct: cplPrev7 && cplLast7 ? ((cplLast7 - cplPrev7) / cplPrev7) * 100 : null,
          },
        };
      });

      const { enrichedCreatives } = scoreCreatives(creatives, targets);

      const winners = enrichedCreatives
        .filter((c: any) => c.status === 'winner' && c.metrics.totalSpend >= 100 && c.metrics.totalConversations >= 5)
        .sort((a: any, b: any) => (a.metrics.cpl ?? Infinity) - (b.metrics.cpl ?? Infinity));

      // Group by normalized headline
      const patternMap = new Map<string, any>();
      for (const w of winners) {
        const key = (w.headline || '').toLowerCase().trim();
        if (!key) continue;

        const existing = patternMap.get(key);
        if (existing) {
          existing.totalSpend += w.metrics.totalSpend;
          existing.totalConversations += w.metrics.totalConversations;
          existing.variants.push(w);
          for (const camp of w.campaigns) {
            if (!existing.campaigns.includes(camp)) existing.campaigns.push(camp);
          }
        } else {
          patternMap.set(key, {
            headline: w.headline,
            primaryText: w.primaryText,
            ctaType: w.ctaType,
            imageUrl: w.thumbnailUrl || w.imageUrl,
            totalSpend: w.metrics.totalSpend,
            totalConversations: w.metrics.totalConversations,
            campaigns: [...w.campaigns],
            variants: [w],
          });
        }
      }

      const patterns = Array.from(patternMap.values())
        .map((p) => ({
          headline: p.headline,
          primaryText: p.primaryText,
          ctaType: p.ctaType,
          imageUrl: p.imageUrl,
          totalSpend: p.totalSpend,
          totalConversations: p.totalConversations,
          cpl: p.totalConversations > 0 ? p.totalSpend / p.totalConversations : null,
          campaigns: p.campaigns,
          variantCount: p.variants.length,
        }))
        .sort((a, b) => (a.cpl ?? Infinity) - (b.cpl ?? Infinity))
        .slice(0, maxResults);

      return {
        clientId,
        period: { start, end },
        total: patterns.length,
        winners: patterns,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch creative winners',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default creativeWinnersRoutes;
