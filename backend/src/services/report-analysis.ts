import type { ClientPerformanceSummary, AIReportContent, ClientLeadFunnelSummary } from '../types/metrics';
import type { AiOutputService, AiOutputLogInput } from './ai-output-service';
import { getPromptDefinition } from './ai-prompts';
import { getAiOutputCacheHours, hashAiInput, normalizeAiError } from '../utils/ai-output';
import { z } from 'zod';
import { zodErrorToReason } from '../utils/ai-guardrails';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const reportContentSchema = z.object({
  executiveSummary: z.string().min(1),
  interpretation: z.string().min(1),
  positives: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

type ReportAiTelemetry = {
  aiOutputs?: AiOutputService;
  entityId: string;
  type: 'report-monthly' | 'report-weekly';
};

const logAiOutput = async (
  telemetry: ReportAiTelemetry | undefined,
  input: Omit<AiOutputLogInput, 'type' | 'entityId'>
) => {
  if (!telemetry?.aiOutputs) return;
  await telemetry.aiOutputs.logOutput({
    type: telemetry.type,
    entityId: telemetry.entityId,
    ...input,
  });
};

const generateWithPrompt = async (
  prompt: string,
  fallback: AIReportContent,
  options?: {
    telemetry?: ReportAiTelemetry;
    inputHash?: string | null;
    promptId?: string | null;
    promptVersion?: string | null;
  }
): Promise<AIReportContent> => {
  if (!OPENAI_API_KEY) {
    await logAiOutput(options?.telemetry, {
      status: 'skipped',
      payload: fallback,
      error: { reason: 'missing_api_key' },
      errorReason: 'missing_api_key',
      fallbackUsed: true,
      latencyMs: null,
      inputHash: options?.inputHash ?? null,
      model: null,
      promptId: options?.promptId ?? null,
      promptVersion: options?.promptVersion ?? null,
    });
    return fallback;
  }

  try {
    const startedAt = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);

    const data = (await response.json()) as any;
    const content = JSON.parse(data.choices[0].message.content);
    const parsedResult = reportContentSchema.safeParse(content);
    if (!parsedResult.success) {
      throw new Error(`Invalid AI response: ${zodErrorToReason(parsedResult.error)}`);
    }
    const parsed = parsedResult.data;

    await logAiOutput(options?.telemetry, {
      status: 'success',
      payload: parsed,
      error: null,
      errorReason: null,
      fallbackUsed: false,
      latencyMs: Date.now() - startedAt,
      inputHash: options?.inputHash ?? null,
      model: OPENAI_MODEL,
      promptId: options?.promptId ?? null,
      promptVersion: options?.promptVersion ?? null,
    });

    return parsed;
  } catch (error) {
    console.warn('Error generating report content:', error);
    await logAiOutput(options?.telemetry, {
      status: 'failed',
      payload: fallback,
      error: normalizeAiError(error),
      errorReason: zodErrorToReason(error),
      fallbackUsed: true,
      latencyMs: null,
      inputHash: options?.inputHash ?? null,
      model: OPENAI_MODEL,
      promptId: options?.promptId ?? null,
      promptVersion: options?.promptVersion ?? null,
    });
    return fallback;
  }
};

const pickBestCampaign = (performance: ClientPerformanceSummary) => {
  const preferMessaging = (performance.totalMessagingConversations || 0) > 0;

  const fallback = performance.campaigns[0] || {
    campaignName: 'N/A',
    totalMessagingConversations: 0,
    totalConversions: 0,
  };

  return performance.campaigns.reduce((best, current) => {
    const bestScore = preferMessaging ? best.totalMessagingConversations : best.totalConversions;
    const currentScore = preferMessaging ? current.totalMessagingConversations : current.totalConversions;
    return currentScore > bestScore ? current : best;
  }, fallback as any);
};

const formatReasonsLine = (reasons: Record<string, number> | undefined, max: number) => {
  if (!reasons) return null;
  const entries = Object.entries(reasons)
    .filter(([, count]) => Number.isFinite(count) && count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max);

  if (entries.length === 0) return null;
  return entries.map(([key, count]) => `${key} (${count})`).join(', ');
};

export async function generateClientReportContent(
  performance: ClientPerformanceSummary,
  leadFunnel?: ClientLeadFunnelSummary | null,
  telemetry?: ReportAiTelemetry
): Promise<AIReportContent> {
  const totalContacts =
    performance.totalMessagingConversations || performance.totalLeads || performance.totalConversions;
  const costPerContact =
    totalContacts > 0 ? performance.totalSpend / totalContacts : performance.avgCpl;

  const fallback: AIReportContent = {
    executiveSummary: 'Este mês tivemos um volume consistente de contatos, mantendo o investimento dentro do planejado.',
    interpretation:
      'Os números indicam que estamos atraindo pessoas interessadas em atendimento, e agora podemos acompanhar melhor a qualidade desses contatos.',
    positives: ['Volume de contatos consistente', 'Investimento dentro do planejado'],
    improvements: ['Registrar quantos contatos foram realmente qualificados', 'Testar novas variações de criativos'],
    recommendations: ['Manter os temas que mais geram contatos', 'Acompanhar semanalmente a qualidade dos contatos'],
  };

  const bestCampaign = pickBestCampaign(performance);

  const reasonsLine = formatReasonsLine(leadFunnel?.disqualificationReasons, 3);
  const qualifiedLine =
    leadFunnel && leadFunnel.recordsCount > 0
      ? `- Contatos realmente interessados (qualificados): ${leadFunnel.totalQualifiedLeads}
    - Custo por interessado real: ${leadFunnel.costPerQualifiedLead != null ? `R$ ${leadFunnel.costPerQualifiedLead.toFixed(2)}` : 'N/A'}
    - Percentual de interessados reais: ${leadFunnel.qualificationRate != null ? `${leadFunnel.qualificationRate.toFixed(1)}%` : 'N/A'}
    ${reasonsLine ? `- Principais motivos de desqualificação: ${reasonsLine}` : ''}`
      : `- Qualificação (WhatsApp): não registrada neste período.`;

  const promptDef = getPromptDefinition('report-monthly');
  const prompt = promptDef.build({
    clientName: performance.clientName,
    totalSpend: performance.totalSpend,
    totalContacts,
    costPerContact,
    bestCampaignName: bestCampaign.campaignName,
    qualifiedLine,
  });

  const inputHash = telemetry
    ? hashAiInput({
        type: telemetry.type,
        entityId: telemetry.entityId,
        model: OPENAI_MODEL,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
        prompt,
      })
    : null;

  if (telemetry?.aiOutputs && inputHash) {
    const cached = await telemetry.aiOutputs.getCachedOutput({
      type: telemetry.type,
      inputHash,
      maxAgeHours: getAiOutputCacheHours(),
    });
    if (cached?.payload) {
      await logAiOutput(telemetry, {
        status: 'cached',
        payload: cached.payload,
        error: null,
        errorReason: null,
        fallbackUsed: false,
        latencyMs: 0,
        inputHash,
        model: cached.model ?? OPENAI_MODEL,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
      });
      return cached.payload as AIReportContent;
    }
  }

  return generateWithPrompt(prompt, fallback, {
    telemetry,
    inputHash,
    promptId: promptDef.id,
    promptVersion: promptDef.version,
  });
}

export async function generateClientWeeklyReportContent(
  performance: ClientPerformanceSummary,
  leadFunnel?: ClientLeadFunnelSummary | null,
  telemetry?: ReportAiTelemetry
): Promise<AIReportContent> {
  const fallback: AIReportContent = {
    executiveSummary: 'Esta semana tivemos um volume consistente de contatos, com investimento dentro do planejado.',
    interpretation: 'Os números indicam que seguimos atraindo pessoas interessadas em atendimento, com boa eficiência.',
    positives: ['Volume de conversas estável', 'Custo por contato controlado'],
    improvements: ['Testar novas imagens', 'Ajustar a mensagem para reduzir curiosos'],
    recommendations: ['Manter foco nos temas com melhor retorno', 'Testar 1–2 novas variações de criativos'],
  };

  const totalContacts =
    performance.totalMessagingConversations || performance.totalLeads || performance.totalConversions;
  const costPerContact =
    totalContacts > 0 ? performance.totalSpend / totalContacts : performance.avgCpl;

  const bestCampaign = pickBestCampaign(performance);

  const reasonsLine = formatReasonsLine(leadFunnel?.disqualificationReasons, 3);
  const qualifiedLine =
    leadFunnel && leadFunnel.recordsCount > 0
      ? `- Contatos realmente interessados (qualificados): ${leadFunnel.totalQualifiedLeads}
    - Custo por interessado real: ${leadFunnel.costPerQualifiedLead != null ? `R$ ${leadFunnel.costPerQualifiedLead.toFixed(2)}` : 'N/A'}
    - Percentual de interessados reais: ${leadFunnel.qualificationRate != null ? `${leadFunnel.qualificationRate.toFixed(1)}%` : 'N/A'}
    ${reasonsLine ? `- Principais motivos de desqualificação: ${reasonsLine}` : ''}`
      : `- Qualificação (WhatsApp): não registrada nesta semana.`;

  const promptDef = getPromptDefinition('report-weekly');
  const prompt = promptDef.build({
    clientName: performance.clientName,
    periodStart: performance.period.start,
    periodEnd: performance.period.end,
    totalSpend: performance.totalSpend,
    totalContacts,
    costPerContact,
    bestCampaignName: bestCampaign.campaignName,
    qualifiedLine,
  });

  const inputHash = telemetry
    ? hashAiInput({
        type: telemetry.type,
        entityId: telemetry.entityId,
        model: OPENAI_MODEL,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
        prompt,
      })
    : null;

  if (telemetry?.aiOutputs && inputHash) {
    const cached = await telemetry.aiOutputs.getCachedOutput({
      type: telemetry.type,
      inputHash,
      maxAgeHours: getAiOutputCacheHours(),
    });
    if (cached?.payload) {
      await logAiOutput(telemetry, {
        status: 'cached',
        payload: cached.payload,
        error: null,
        errorReason: null,
        fallbackUsed: false,
        latencyMs: 0,
        inputHash,
        model: cached.model ?? OPENAI_MODEL,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
      });
      return cached.payload as AIReportContent;
    }
  }

  return generateWithPrompt(prompt, fallback, {
    telemetry,
    inputHash,
    promptId: promptDef.id,
    promptVersion: promptDef.version,
  });
}
