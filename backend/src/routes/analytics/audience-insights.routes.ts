import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { toIsoDateUtc } from '../../utils';

type AudienceSegment = {
  segment: string;
  spend: number;
  conversations: number;
  cpl: number | null;
  spendShare: number;
  impressions: number;
};

type AudienceInsightsResponse = {
  clientId: string;
  campaignId: string;
  period: { start: string; end: string };
  totalSpend: number;
  totalConversations: number;
  avgCpl: number | null;
  bestSegments: AudienceSegment[];
  wastefulSegments: AudienceSegment[];
  allSegments: AudienceSegment[];
  recommendation: string | null;
};

const audienceInsightsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/api/clients/:clientId/audience-insights', async (request, reply) => {
    const { clientId } = request.params as { clientId: string };
    const { campaignId, period = '30d' } = request.query as { campaignId?: string; period?: string };

    if (!campaignId) {
      reply.status(400);
      return { error: 'campaignId is required' };
    }

    try {
      const analytics = fastify.services.analytics;
      const days = parseInt(period) || 30;
      const end = toIsoDateUtc(new Date());
      const start = toIsoDateUtc(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

      // Get age_gender breakdowns
      const breakdowns = await analytics.getBreakdowns(campaignId, 'age_gender', start, end);

      if (!breakdowns || breakdowns.segments.length === 0) {
        return {
          clientId,
          campaignId,
          period: { start, end },
          totalSpend: 0,
          totalConversations: 0,
          avgCpl: null,
          bestSegments: [],
          wastefulSegments: [],
          allSegments: [],
          recommendation: null,
        } as AudienceInsightsResponse;
      }

      const totalSpend = breakdowns.segments.reduce((s: number, seg: any) => s + (seg.spend || 0), 0);
      const totalConversations = breakdowns.segments.reduce((s: number, seg: any) => s + (seg.conversions || 0), 0);
      const avgCpl = totalConversations > 0 ? totalSpend / totalConversations : null;

      // Calculate CPL per segment
      const allSegments: AudienceSegment[] = breakdowns.segments
        .map((seg: any) => ({
          segment: seg.label,
          spend: seg.spend || 0,
          conversations: seg.conversions || 0,
          cpl: seg.conversions > 0 ? seg.spend / seg.conversions : null,
          spendShare: totalSpend > 0 ? ((seg.spend || 0) / totalSpend) * 100 : 0,
          impressions: seg.impressions || 0,
        }))
        .filter((seg: AudienceSegment) => seg.spend > 0)
        .sort((a: AudienceSegment, b: AudienceSegment) => (a.cpl ?? Infinity) - (b.cpl ?? Infinity));

      // Best segments: lowest CPL with at least some conversions
      const bestSegments = allSegments
        .filter((seg) => seg.conversations >= 2 && seg.cpl != null)
        .slice(0, 3);

      // Wasteful segments: high spend share but very few or no conversions
      const wastefulSegments = allSegments
        .filter((seg) => seg.spendShare >= 5 && (seg.conversations === 0 || (seg.cpl != null && avgCpl != null && seg.cpl > avgCpl * 2)))
        .sort((a, b) => b.spendShare - a.spendShare)
        .slice(0, 3);

      // Build recommendation
      let recommendation: string | null = null;
      if (bestSegments.length > 0 && wastefulSegments.length > 0) {
        const best = bestSegments[0];
        const worst = wastefulSegments[0];
        const savings = worst.spend * 0.5;
        recommendation = `Concentre orçamento em "${best.segment}" (CPL R$ ${best.cpl?.toFixed(2)}) e reduza em "${worst.segment}" (${worst.spendShare.toFixed(0)}% do spend, ${worst.conversations} conversas). Economia potencial: ~R$ ${savings.toFixed(0)}/período.`;
      } else if (bestSegments.length > 0) {
        const best = bestSegments[0];
        recommendation = `Melhor segmento: "${best.segment}" com CPL de R$ ${best.cpl?.toFixed(2)}. Considere aumentar orçamento neste público.`;
      }

      const result: AudienceInsightsResponse = {
        clientId,
        campaignId,
        period: { start, end },
        totalSpend,
        totalConversations,
        avgCpl,
        bestSegments,
        wastefulSegments,
        allSegments,
        recommendation,
      };

      return result;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch audience insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default audienceInsightsRoutes;
