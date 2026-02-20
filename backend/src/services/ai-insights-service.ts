import type { PrismaClient } from '@prisma/client';

import type { MetricsService } from './metrics-service';
import type { AnalyticsService } from './analytics/analytics-service';
import type { AiOutputService } from './ai-output-service';
import { AbTestSuggestionsService } from './ab-test-suggestions';
import { getDateRange } from './metrics/date-range';
import { getAiOutputCacheHours, hashAiInput } from '../utils/ai-output';

export type AiInsightsResponse = {
  entity: { type: 'campaign' | 'creative'; id: string; name?: string | null };
  period: { start: string; end: string };
  summary: string;
  recommendations: string[];
  confidence: number;
  cached: boolean;
  createdAt: string | null;
};

const clampConfidence = (value: number) => Math.max(0.1, Math.min(0.95, value));

export class AiInsightsService {
  constructor(
    private prisma: PrismaClient,
    private metrics: MetricsService,
    private analytics: AnalyticsService,
    private aiOutputs?: AiOutputService
  ) {}

  async getCampaignInsights(params: {
    campaignId: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    force?: boolean;
  }): Promise<AiInsightsResponse> {
    const { campaignId, period, startDate, endDate, force } = params;
    const metrics = await this.metrics.getPerformanceSummary(campaignId, {
      period: period as any,
      startDate,
      endDate,
    });

    const contacts =
      metrics.totalMessagingConversations ||
      metrics.totalLeads ||
      metrics.totalConversions;
    const cpl = contacts > 0 ? metrics.totalSpend / contacts : metrics.avgCpl;

    const summary = contacts > 0
      ? `Investimento de R$ ${metrics.totalSpend.toFixed(2)} gerou ${contacts} contatos no período. CTR médio ${metrics.avgCtr.toFixed(1)}% e CPL ~R$ ${cpl.toFixed(2)}.`
      : `Houve investimento de R$ ${metrics.totalSpend.toFixed(2)} sem geração de contatos no período.`;

    const recommendations: string[] = [];
    if (contacts === 0 && metrics.totalSpend > 0) {
      recommendations.push('Revisar criativos e segmentação; validar tracking de conversões.');
    }
    if (metrics.avgCtr < 1) {
      recommendations.push('Testar novos ganchos e formatos para elevar CTR.');
    }
    if (metrics.avgFrequency >= 4) {
      recommendations.push('Renovar criativos para reduzir fadiga de audiência.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Manter estratégia atual e monitorar qualidade dos contatos.');
    }

    let confidence = 0.45;
    if (metrics.totalSpend >= 300 && metrics.totalImpressions >= 5000) confidence = 0.75;
    else if (metrics.totalSpend >= 150) confidence = 0.6;
    else if (metrics.totalSpend >= 50) confidence = 0.5;
    confidence = clampConfidence(confidence);

    const inputHash = hashAiInput({
      type: 'campaign-insights',
      campaignId,
      period: metrics.period,
      metrics: {
        spend: metrics.totalSpend,
        contacts,
        ctr: metrics.avgCtr,
        cpl,
        frequency: metrics.avgFrequency,
      },
    });

    if (this.aiOutputs && !force) {
      const cached = await this.aiOutputs.getCachedOutput({
        type: 'campaign-insights',
        inputHash,
        maxAgeHours: getAiOutputCacheHours(),
      });
      if (cached?.payload) {
        await this.aiOutputs.logOutput({
          type: 'campaign-insights',
          entityId: campaignId,
          model: cached.model ?? 'heuristic-v1',
          promptId: 'campaign-insights',
          promptVersion: 'v1',
          status: 'cached',
          payload: cached.payload,
          error: null,
          errorReason: null,
          fallbackUsed: false,
          latencyMs: 0,
          inputHash,
        });
        return {
          ...(cached.payload as AiInsightsResponse),
          cached: true,
          createdAt: cached.createdAt ?? null,
        };
      }
    }

    const payload: AiInsightsResponse = {
      entity: { type: 'campaign', id: campaignId, name: metrics.campaignName ?? null },
      period: metrics.period,
      summary,
      recommendations,
      confidence,
      cached: false,
      createdAt: new Date().toISOString(),
    };

    if (this.aiOutputs) {
      await this.aiOutputs.logOutput({
        type: 'campaign-insights',
        entityId: campaignId,
        model: 'heuristic-v1',
        promptId: 'campaign-insights',
        promptVersion: 'v1',
        status: 'success',
        payload,
        error: null,
        errorReason: null,
        fallbackUsed: false,
        latencyMs: null,
        inputHash,
      });
    }

    return payload;
  }

  async getCreativeInsights(params: {
    snapshotId: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    force?: boolean;
  }): Promise<AiInsightsResponse | null> {
    const { snapshotId, period, startDate, endDate, force } = params;
    const resolvedRange = getDateRange(period || '30d', startDate, endDate);
    const snapshot = await this.analytics.getCreativeSnapshot(snapshotId);
    if (!snapshot) return null;

    const copyInsight = await this.analytics.getCopyInsight(snapshotId);
    const copyAnalysis = copyInsight?.analysis ?? null;

    const abTestService = new AbTestSuggestionsService(
      this.prisma,
      this.analytics,
      this.aiOutputs
    );
    const abTests = await abTestService.getSuggestions({
      snapshotId,
      period,
      startDate,
      endDate,
      force: false,
    });

    const hook = copyAnalysis?.hook ? String(copyAnalysis.hook) : null;
    const angle = copyAnalysis?.angle?.name ? String(copyAnalysis.angle.name) : null;
    const persona = copyAnalysis?.persona ? String(copyAnalysis.persona) : null;

    const summaryParts = [
      hook ? `Gancho: ${hook}` : null,
      angle ? `Ângulo: ${angle}` : null,
      persona ? `Persona: ${persona}` : null,
    ].filter(Boolean);

    const summary = summaryParts.length > 0
      ? summaryParts.join(' · ')
      : 'Sem resumo de copy disponível para este criativo.';

    const recommendations = abTests?.suggestions?.map((s) => s.title).slice(0, 3) ?? [];
    if (recommendations.length === 0 && copyAnalysis?.suggestions?.experiments) {
      recommendations.push(...copyAnalysis.suggestions.experiments.slice(0, 3));
    }
    if (recommendations.length === 0) {
      recommendations.push('Testar novos ganchos e CTAs para melhorar conversas.');
    }

    let confidence = copyInsight?.status === 'success' ? 0.7 : 0.55;
    if (abTests?.cached) confidence -= 0.05;
    confidence = clampConfidence(confidence);

    const inputHash = hashAiInput({
      type: 'creative-insights',
      snapshotId,
      period: resolvedRange,
      copyAnalysis,
      recommendations,
    });

    if (this.aiOutputs && !force) {
      const cached = await this.aiOutputs.getCachedOutput({
        type: 'creative-insights',
        inputHash,
        maxAgeHours: getAiOutputCacheHours(),
      });
      if (cached?.payload) {
        await this.aiOutputs.logOutput({
          type: 'creative-insights',
          entityId: snapshotId,
          model: cached.model ?? 'heuristic-v1',
          promptId: 'creative-insights',
          promptVersion: 'v1',
          status: 'cached',
          payload: cached.payload,
          error: null,
          errorReason: null,
          fallbackUsed: false,
          latencyMs: 0,
          inputHash,
        });
        return {
          ...(cached.payload as AiInsightsResponse),
          cached: true,
          createdAt: cached.createdAt ?? null,
        };
      }
    }

    const payload: AiInsightsResponse = {
      entity: { type: 'creative', id: snapshotId, name: snapshot.headline ?? snapshot.primaryText ?? null },
      period: {
        start: resolvedRange.start,
        end: resolvedRange.end,
      },
      summary,
      recommendations,
      confidence,
      cached: false,
      createdAt: new Date().toISOString(),
    };

    if (this.aiOutputs) {
      await this.aiOutputs.logOutput({
        type: 'creative-insights',
        entityId: snapshotId,
        model: 'heuristic-v1',
        promptId: 'creative-insights',
        promptVersion: 'v1',
        status: 'success',
        payload,
        error: null,
        errorReason: null,
        fallbackUsed: false,
        latencyMs: null,
        inputHash,
      });
    }

    return payload;
  }
}
