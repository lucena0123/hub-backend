import type { PrismaClient } from '@prisma/client';

import { getDateRange } from './metrics/date-range';
import type { AnalyticsService } from './analytics/analytics-service';
import type { AiOutputService } from './ai-output-service';
import { getAiOutputCacheHours, hashAiInput, normalizeAiError } from '../utils/ai-output';

export type AbTestSuggestionCategory = 'hook' | 'cta' | 'format' | 'visual';
export type AbTestTargetMetric = 'conversations' | 'ctr' | 'cpl' | 'hook_rate' | 'hold_rate';

export type AbTestSuggestion = {
  id: string;
  category: AbTestSuggestionCategory;
  title: string;
  hypothesis: string;
  targetMetric: AbTestTargetMetric;
};

export type AbTestSuggestionsResponse = {
  snapshotId: string;
  clientId: string | null;
  period: { start: string; end: string };
  suggestions: AbTestSuggestion[];
  model: string | null;
  promptId: string | null;
  promptVersion: string | null;
  cached: boolean;
  createdAt: string | null;
};

type SuggestionContext = {
  snapshotId: string;
  headline: string | null;
  primaryText: string | null;
  ctaType: string | null;
  format: string | null;
  visualAttributes: any | null;
  metrics: {
    spend: number;
    conversations: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpl: number | null;
    hookRateAvg: number | null;
    holdRateAvg: number | null;
  };
  copyInsights: any | null;
};

const MODEL_ID = 'heuristic-v1';
const PROMPT_ID = 'ab-test-suggestions';
const PROMPT_VERSION = 'v1';

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
};

const pickFirstDifferent = (items: string[], current: string | null) => {
  const normalizedCurrent = current?.toLowerCase() ?? null;
  return items.find((item) => item.toLowerCase() !== normalizedCurrent) ?? null;
};

const inferFormatSuggestion = (format: string | null) => {
  const raw = format?.toLowerCase() ?? '';
  if (!raw) return 'Testar variação de formato (imagem vs vídeo).';
  if (raw.includes('video')) return 'Testar versão estática/imagem com a mesma oferta.';
  if (raw.includes('carousel')) return 'Testar versão em vídeo curto com o mesmo gancho.';
  return 'Testar versão em vídeo curto (15–30s) com o mesmo gancho.';
};

const buildSuggestions = (ctx: SuggestionContext): AbTestSuggestion[] => {
  const suggestions: AbTestSuggestion[] = [];
  const push = (item: Omit<AbTestSuggestion, 'id'>) => {
    const exists = suggestions.some((s) => s.title === item.title && s.category === item.category);
    if (!exists) {
      suggestions.push({ ...item, id: `${ctx.snapshotId}-${item.category}-${suggestions.length + 1}` });
    }
  };

  const { metrics, copyInsights } = ctx;
  const currentCta = normalizeText(ctx.ctaType);
  const copySuggestionCtas = toArray(copyInsights?.suggestions?.ctas);
  const copySuggestionHeadlines = toArray(copyInsights?.suggestions?.headlines);
  const copyExperiments = toArray(copyInsights?.suggestions?.experiments);
  const hookIdea = normalizeText(copyInsights?.hook) ?? copySuggestionHeadlines[0] ?? normalizeText(ctx.headline);

  const ctaCandidate = pickFirstDifferent(copySuggestionCtas, currentCta);
  if (ctaCandidate) {
    push({
      category: 'cta',
      title: `Testar CTA "${ctaCandidate}" vs "${currentCta ?? 'atual'}"`,
      hypothesis: 'Um CTA mais direto pode aumentar o volume de conversas qualificadas.',
      targetMetric: 'conversations',
    });
  }

  if ((metrics.hookRateAvg != null && metrics.hookRateAvg < 20) || metrics.ctr < 1) {
    push({
      category: 'hook',
      title: hookIdea
        ? `Novo gancho inspirado em "${hookIdea}"`
        : 'Testar novo gancho com benefício principal',
      hypothesis: 'Um gancho mais claro aumenta o CTR e a taxa de conversas.',
      targetMetric: metrics.hookRateAvg != null ? 'hook_rate' : 'ctr',
    });
  }

  if (metrics.holdRateAvg != null && metrics.holdRateAvg < 25) {
    push({
      category: 'hook',
      title: 'Testar vídeo mais curto com prova social no início',
      hypothesis: 'Reduzir duração e antecipar prova social melhora a retenção e conversas.',
      targetMetric: 'hold_rate',
    });
  }

  if (ctx.format) {
    push({
      category: 'format',
      title: inferFormatSuggestion(ctx.format),
      hypothesis: 'Mudança de formato pode aumentar engajamento e conversas.',
      targetMetric: 'conversations',
    });
  }

  const visual = ctx.visualAttributes ?? {};
  if (visual.textDensity != null && visual.textDensity > 0.25) {
    push({
      category: 'visual',
      title: 'Reduzir texto na imagem e destacar 1 benefício principal',
      hypothesis: 'Menos texto melhora leitura rápida e aumenta cliques qualificados.',
      targetMetric: 'ctr',
    });
  } else if (visual.contrastLevel === 'low') {
    push({
      category: 'visual',
      title: 'Aumentar contraste entre fundo e texto/CTA',
      hypothesis: 'Maior contraste facilita leitura e aumenta a taxa de cliques.',
      targetMetric: 'ctr',
    });
  } else if (visual.faceDetected === false) {
    push({
      category: 'visual',
      title: 'Testar criativo com rosto humano e contexto real',
      hypothesis: 'Humanização tende a elevar confiança e conversas.',
      targetMetric: 'conversations',
    });
  }

  for (const experiment of copyExperiments) {
    if (suggestions.length >= 5) break;
    const lower = experiment.toLowerCase();
    const category: AbTestSuggestionCategory =
      lower.includes('cta') || lower.includes('whatsapp') ? 'cta'
        : lower.includes('vídeo') || lower.includes('video') || lower.includes('formato') ? 'format'
          : lower.includes('imagem') ? 'visual'
            : 'hook';
    push({
      category,
      title: experiment,
      hypothesis: 'Experimentar esta variação pode melhorar conversas ou CTR.',
      targetMetric: category === 'cta' ? 'conversations' : 'ctr',
    });
  }

  const hasCategory = (category: AbTestSuggestionCategory) =>
    suggestions.some((s) => s.category === category);

  if (!hasCategory('format')) {
    push({
      category: 'format',
      title: 'Testar formato alternativo (imagem vs vídeo) mantendo a mesma oferta',
      hypothesis: 'Formato diferente pode elevar CTR e conversas.',
      targetMetric: 'ctr',
    });
  }

  if (!hasCategory('visual')) {
    push({
      category: 'visual',
      title: 'Testar versão com visual mais limpo e foco no benefício principal',
      hypothesis: 'Visual mais objetivo tende a aumentar cliques qualificados.',
      targetMetric: 'ctr',
    });
  }

  while (suggestions.length < 3) {
    push({
      category: 'hook',
      title: 'Testar headline curta (≤ 40 caracteres) vs headline detalhada',
      hypothesis: 'Headline mais direta pode aumentar o CTR inicial.',
      targetMetric: 'ctr',
    });
    if (suggestions.length >= 3) break;
    push({
      category: 'cta',
      title: 'Testar CTA consultivo ("Falar com especialista") vs direto ("Falar no WhatsApp")',
      hypothesis: 'CTA consultivo pode elevar taxa de conversas qualificadas.',
      targetMetric: 'conversations',
    });
  }

  return suggestions.slice(0, 5);
};

export class AbTestSuggestionsService {
  constructor(
    private prisma: PrismaClient,
    private analytics: AnalyticsService,
    private aiOutputs?: AiOutputService
  ) {}

  async getSuggestions(params: {
    snapshotId: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    force?: boolean;
  }): Promise<AbTestSuggestionsResponse | null> {
    const { snapshotId, period, startDate, endDate, force } = params;
    const range = getDateRange(period || '30d', startDate, endDate);

    const snapshot = await this.analytics.getCreativeSnapshot(snapshotId);
    if (!snapshot) return null;

    const metricsResult = await this.prisma.$queryRaw<any[]>`
      SELECT
        MIN(c."clientId") as client_id,
        COALESCE(SUM(m.spend), 0)::float as spend,
        COALESCE(SUM(m.messaging_conversations), 0)::int as conversations,
        COALESCE(SUM(m.impressions), 0)::int as impressions,
        COALESCE(SUM(m.clicks), 0)::int as clicks,
        COALESCE(AVG(m.ctr), 0)::float as avg_ctr,
        COALESCE(AVG(NULLIF(m.hook_rate, 0)), 0)::float as hook_rate_avg,
        COALESCE(AVG(NULLIF(m.hold_rate, 0)), 0)::float as hold_rate_avg
      FROM ad_creative_metrics m
      JOIN campaigns c ON c.id = m.campaign_id
      WHERE m.creative_snapshot_id = ${snapshotId}
        AND m.date >= ${new Date(range.start)}
        AND m.date <= ${new Date(range.end)}
    `;

    const metricsRow = metricsResult[0] ?? {};
    const spend = Number(metricsRow.spend) || 0;
    const conversations = Number(metricsRow.conversations) || 0;
    const impressions = Number(metricsRow.impressions) || 0;
    const clicks = Number(metricsRow.clicks) || 0;
    const ctr = Number(metricsRow.avg_ctr) || 0;
    const hookRateAvg = metricsRow.hook_rate_avg != null ? Number(metricsRow.hook_rate_avg) : null;
    const holdRateAvg = metricsRow.hold_rate_avg != null ? Number(metricsRow.hold_rate_avg) : null;
    const cpl = conversations > 0 ? spend / conversations : null;

    const copyInsight = await this.analytics.getCopyInsight(snapshotId);
    const copyAnalysis = copyInsight?.analysis ?? null;

    const context: SuggestionContext = {
      snapshotId,
      headline: snapshot.headline ?? null,
      primaryText: snapshot.primaryText ?? null,
      ctaType: snapshot.ctaType ?? null,
      format: snapshot.format ?? null,
      visualAttributes: snapshot.visualAttributes ?? null,
      metrics: {
        spend,
        conversations,
        impressions,
        clicks,
        ctr,
        cpl,
        hookRateAvg,
        holdRateAvg,
      },
      copyInsights: copyAnalysis,
    };

    const inputHash = hashAiInput({
      type: PROMPT_ID,
      snapshotId,
      period: range,
      metrics: context.metrics,
      ctaType: context.ctaType,
      format: context.format,
      visualAttributes: context.visualAttributes,
      copyInsights: context.copyInsights,
    });

    if (this.aiOutputs && !force) {
      const cached = await this.aiOutputs.getCachedOutput({
        type: PROMPT_ID,
        inputHash,
        maxAgeHours: getAiOutputCacheHours(),
      });
      if (cached?.payload?.suggestions) {
        await this.aiOutputs.logOutput({
          type: PROMPT_ID,
          entityId: snapshotId,
          model: cached.model ?? MODEL_ID,
          promptId: PROMPT_ID,
          promptVersion: PROMPT_VERSION,
          status: 'cached',
          payload: cached.payload,
          error: null,
          errorReason: null,
          fallbackUsed: false,
          latencyMs: 0,
          inputHash,
        });
        return {
          snapshotId,
          clientId: metricsRow.client_id ?? null,
          period: range,
          suggestions: cached.payload.suggestions as AbTestSuggestion[],
          model: cached.model ?? MODEL_ID,
          promptId: PROMPT_ID,
          promptVersion: PROMPT_VERSION,
          cached: true,
          createdAt: cached.createdAt ?? null,
        };
      }
    }

    try {
      const suggestions = buildSuggestions(context);
      const payload = {
        suggestions,
        summary: {
          spend,
          conversations,
          impressions,
          clicks,
          ctr,
          cpl,
          hookRateAvg,
          holdRateAvg,
        },
      };

      if (this.aiOutputs) {
        await this.aiOutputs.logOutput({
          type: PROMPT_ID,
          entityId: snapshotId,
          model: MODEL_ID,
          promptId: PROMPT_ID,
          promptVersion: PROMPT_VERSION,
          status: 'success',
          payload,
          error: null,
          errorReason: null,
          fallbackUsed: false,
          latencyMs: null,
          inputHash,
        });
      }

      return {
        snapshotId,
        clientId: metricsRow.client_id ?? null,
        period: range,
        suggestions,
        model: MODEL_ID,
        promptId: PROMPT_ID,
        promptVersion: PROMPT_VERSION,
        cached: false,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      const fallback = buildSuggestions(context);
      if (this.aiOutputs) {
        await this.aiOutputs.logOutput({
          type: PROMPT_ID,
          entityId: snapshotId,
          model: MODEL_ID,
          promptId: PROMPT_ID,
          promptVersion: PROMPT_VERSION,
          status: 'failed',
          payload: { suggestions: fallback },
          error: normalizeAiError(error),
          errorReason: 'generation_failed',
          fallbackUsed: true,
          latencyMs: null,
          inputHash,
        });
      }

      return {
        snapshotId,
        clientId: metricsRow.client_id ?? null,
        period: range,
        suggestions: fallback,
        model: MODEL_ID,
        promptId: PROMPT_ID,
        promptVersion: PROMPT_VERSION,
        cached: false,
        createdAt: new Date().toISOString(),
      };
    }
  }
}
