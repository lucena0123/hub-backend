import 'dotenv/config';

import { inferOptimizationTheme, type OptimizationThemeMatch } from './optimization-playbook';
import { getPromptDefinition } from './ai-prompts';
import type { AiOutputService } from './ai-output-service';
import { getAiOutputCacheHours, hashAiInput, normalizeAiError } from '../utils/ai-output';
import { z } from 'zod';
import { zodErrorToReason } from '../utils/ai-guardrails';

type CreativeSnapshotInput = {
  snapshotId: string;
  headline: string | null;
  primaryText: string | null;
  description: string | null;
  ctaType: string | null;
  destinationUrl: string | null;
  isDynamic: boolean;
  headlines: string[] | null;
  primaryTexts: string[] | null;
  descriptions: string[] | null;
  ctaTypes: string[] | null;
  destinationUrls: string[] | null;
  format: string | null;
};

export type CopyInsightsStatus = 'success' | 'failed' | 'pending';

export type CreativeCopyInsightsRecord = {
  snapshotId: string;
  themeKey: string | null;
  themeName: string | null;
  status: CopyInsightsStatus;
  model: string | null;
  promptId: string | null;
  promptVersion: string | null;
  analysis: any | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type GenerateCopyInsightsInput = {
  snapshot: CreativeSnapshotInput;
  theme?: OptimizationThemeMatch | null;
  force?: boolean;
  aiOutputs?: AiOutputService;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.1';

const copyInsightsSchema = z.object({
  angle: z
    .object({
      name: z.string().nullable().optional(),
      reason: z.string().nullable().optional(),
    })
    .optional(),
  persona: z.string().nullable().optional(),
  hook: z.string().nullable().optional(),
  clarityIssues: z.array(z.string()).default([]),
  complianceRisks: z.array(z.string()).default([]),
  suggestions: z
    .object({
      headlines: z.array(z.string()).default([]),
      primaryTexts: z.array(z.string()).default([]),
      ctas: z.array(z.string()).default([]),
      experiments: z.array(z.string()).default([]),
    })
    .default({ headlines: [], primaryTexts: [], ctas: [], experiments: [] }),
  aiUsed: z.boolean().optional(),
  message: z.string().optional(),
});

const normalizeList = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const list = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  return list.length > 0 ? list : null;
};

const safeText = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const extractJsonObject = async (response: Response) => {
  const data = (await response.json()) as any;
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') throw new Error('OpenAI: resposta inválida');
  return JSON.parse(raw);
};

const truncate = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

const buildFallbackCopyInsights = (input: {
  themeName: string;
  themeKey: string;
  snapshot: CreativeSnapshotInput;
  reason?: string | null;
}) => {
  const { themeKey, themeName, snapshot, reason } = input;

  const topic =
    safeText(snapshot.headline) ??
    safeText(snapshot.primaryText) ??
    safeText(snapshot.description) ??
    themeName;

  const topicShort = truncate(topic ?? themeName, 60);

  const baseHeadline = (value: string) => truncate(value, 60);

  const byTheme: Record<string, { headlines: string[]; primaryTexts: string[] }> = {
    trabalhador: {
      headlines: [
        baseHeadline(`${topicShort}: veja se você tem direito`),
        baseHeadline('Você foi demitido(a)? Entenda seus direitos'),
        baseHeadline('Rescisão indireta: saiba quando se aplica'),
        baseHeadline('Direitos do trabalhador: orientação no WhatsApp'),
        baseHeadline('Converse com um advogado agora'),
      ],
      primaryTexts: [
        'Conte rapidamente o que aconteceu e receba uma orientação inicial pelo WhatsApp.',
        'Se você acha que seus direitos foram desrespeitados, fale com um advogado e entenda os próximos passos.',
        'Atendimento direto e humano. Envie sua dúvida e veja quais documentos podem ajudar no seu caso.',
      ],
    },
    passageiro_aereo: {
      headlines: [
        baseHeadline(`${topicShort}: veja se você tem direito`),
        baseHeadline('Voo cancelado/atrasado? Saiba o que fazer'),
        baseHeadline('Bagagem extraviada? Entenda seus direitos'),
        baseHeadline('Direitos do passageiro: orientação no WhatsApp'),
        baseHeadline('Fale com um advogado agora'),
      ],
      primaryTexts: [
        'Atraso, cancelamento ou problemas na viagem? Envie uma mensagem e entenda seus direitos.',
        'Conte o que aconteceu com seu voo e receba uma orientação inicial pelo WhatsApp.',
        'Atendimento direto e objetivo: avaliamos seu caso e orientamos os próximos passos.',
      ],
    },
    salario_maternidade: {
      headlines: [
        baseHeadline(`${topicShort}: saiba se você tem direito`),
        baseHeadline('Salário maternidade: veja como solicitar'),
        baseHeadline('Gestante: entenda seus direitos'),
        baseHeadline('Orientação no WhatsApp (maternidade)'),
        baseHeadline('Converse com um advogado agora'),
      ],
      primaryTexts: [
        'Dúvidas sobre salário maternidade? Envie uma mensagem e entenda se você tem direito.',
        'Conte sua situação e receba uma orientação inicial pelo WhatsApp.',
        'Atendimento direto e humano. Ajudamos você a entender o que é necessário para o seu caso.',
      ],
    },
    geral: {
      headlines: [
        baseHeadline(`${topicShort}: saiba se você tem direito`),
        baseHeadline(`Entenda seus direitos: ${themeName}`),
        baseHeadline('Tire suas dúvidas no WhatsApp'),
        baseHeadline('Converse com um advogado agora'),
        baseHeadline('Orientação inicial pelo WhatsApp'),
      ],
      primaryTexts: [
        'Envie uma mensagem e entenda seus direitos com uma orientação inicial.',
        'Atendimento direto e humano. Conte sua dúvida e saiba os próximos passos.',
        'Quer entender seu caso? Fale com um advogado pelo WhatsApp.',
      ],
    },
  };

  const selected =
    themeKey === 'trabalhista'
      ? byTheme.trabalhador
      : themeKey === 'passageiro_aereo'
        ? byTheme.passageiro_aereo
        : themeKey === 'salario_maternidade'
          ? byTheme.salario_maternidade
          : byTheme.geral;

  const ctas = ['Falar no WhatsApp', 'Quero orientação', 'Tirar dúvidas', 'Falar agora'];

  return {
    aiUsed: false,
    message: reason
      ? `Sugestões geradas sem IA (motivo: ${truncate(reason, 160)}).`
      : 'Sugestões geradas sem IA (fallback).',
    angle: {
      name: 'informativo',
      reason: 'Baseado em padrões de copy comuns para gerar conversas no WhatsApp.',
    },
    persona: 'Pessoa buscando orientação jurídica sobre o tema',
    hook: `Comece com uma pergunta direta sobre "${topicShort}" e convide para conversar no WhatsApp.`,
    clarityIssues: [
      'Deixar claro o tema em uma frase',
      'Evitar termos técnicos',
      'Chamada para ação direta (WhatsApp)',
    ],
    complianceRisks: [
      'Evitar promessas absolutas (ex.: “garantido”)',
      'Evitar linguagem sensacionalista',
      'Não prometer resultado',
    ],
    suggestions: {
      headlines: selected.headlines,
      primaryTexts: selected.primaryTexts,
      ctas,
      experiments: [
        'Gancho em forma de pergunta vs afirmação',
        'CTA “WhatsApp” vs “Mensagem”',
        'Título curto (≤ 40) vs título médio (≤ 60)',
      ],
    },
  };
};

export const generateCopyInsights = async (
  input: GenerateCopyInsightsInput
): Promise<{ status: CopyInsightsStatus; model: string | null; promptId: string; promptVersion: string; analysis: any | null; errorMessage: string | null }> => {
  const theme = input.theme ?? inferOptimizationTheme(input.snapshot.headline || input.snapshot.primaryText || '');
  const promptDef = getPromptDefinition('copy-insights');
  const prompt = promptDef.build({
    themeName: theme.themeName,
    themeKey: theme.themeKey,
    snapshot: input.snapshot,
  });
  const inputHash = hashAiInput({
    type: 'copy-insights',
    entityId: input.snapshot.snapshotId,
    model: OPENAI_MODEL,
    promptId: promptDef.id,
    promptVersion: promptDef.version,
    prompt,
  });

  if (input.aiOutputs && !input.force) {
    const cached = await input.aiOutputs.getCachedOutput({
      type: 'copy-insights',
      inputHash,
      maxAgeHours: getAiOutputCacheHours(),
    });
    if (cached?.payload) {
      await input.aiOutputs.logOutput({
        type: 'copy-insights',
        entityId: input.snapshot.snapshotId,
        model: cached.model ?? OPENAI_MODEL,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
        status: 'cached',
        payload: cached.payload,
        error: null,
        errorReason: null,
        fallbackUsed: false,
        latencyMs: 0,
        inputHash,
      });
      return {
        status: 'success',
        model: cached.model ?? OPENAI_MODEL,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
        analysis: cached.payload,
        errorMessage: null,
      };
    }
  }

  if (!OPENAI_API_KEY) {
    const fallback = buildFallbackCopyInsights({
      themeKey: theme.themeKey,
      themeName: theme.themeName,
      snapshot: input.snapshot,
      reason: 'OPENAI_API_KEY não configurada',
    });
    if (input.aiOutputs) {
      await input.aiOutputs.logOutput({
        type: 'copy-insights',
        entityId: input.snapshot.snapshotId,
        model: null,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
        status: 'skipped',
        payload: fallback,
        error: { reason: 'missing_api_key' },
        errorReason: 'missing_api_key',
        fallbackUsed: true,
        latencyMs: null,
        inputHash,
      });
    }
    return {
      status: 'success',
      model: null,
      promptId: promptDef.id,
      promptVersion: promptDef.version,
      analysis: fallback,
      errorMessage: null,
    };
  }

  try {
    const startedAt = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
    }

    const content = await extractJsonObject(response);
    const normalized = {
      angle: {
        name: safeText(content?.angle?.name) ?? safeText(content?.angleName) ?? null,
        reason: safeText(content?.angle?.reason) ?? safeText(content?.angleReason) ?? null,
      },
      persona: safeText(content?.persona) ?? null,
      hook: safeText(content?.hook) ?? null,
      clarityIssues: normalizeList(content?.clarityIssues) ?? [],
      complianceRisks: normalizeList(content?.complianceRisks) ?? [],
      suggestions: {
        headlines: normalizeList(content?.suggestions?.headlines) ?? [],
        primaryTexts: normalizeList(content?.suggestions?.primaryTexts) ?? [],
        ctas: normalizeList(content?.suggestions?.ctas) ?? [],
        experiments: normalizeList(content?.suggestions?.experiments) ?? [],
      },
      aiUsed: true,
    };

    const validated = copyInsightsSchema.safeParse(normalized);
    if (!validated.success) {
      throw new Error(`Invalid AI response: ${zodErrorToReason(validated.error)}`);
    }

    if (input.aiOutputs) {
      await input.aiOutputs.logOutput({
        type: 'copy-insights',
        entityId: input.snapshot.snapshotId,
        model: OPENAI_MODEL,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
        status: 'success',
        payload: validated.data,
        error: null,
        errorReason: null,
        fallbackUsed: false,
        latencyMs: Date.now() - startedAt,
        inputHash,
      });
    }

    return {
      status: 'success',
      model: OPENAI_MODEL,
      promptId: promptDef.id,
      promptVersion: promptDef.version,
      analysis: validated.data,
      errorMessage: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fallback = buildFallbackCopyInsights({
      themeKey: theme.themeKey,
      themeName: theme.themeName,
      snapshot: input.snapshot,
      reason: errorMessage,
    });
    if (input.aiOutputs) {
      await input.aiOutputs.logOutput({
        type: 'copy-insights',
        entityId: input.snapshot.snapshotId,
        model: OPENAI_MODEL,
        promptId: promptDef.id,
        promptVersion: promptDef.version,
        status: 'failed',
        payload: fallback,
        error: normalizeAiError(error),
        errorReason: zodErrorToReason(error),
        fallbackUsed: true,
        latencyMs: null,
        inputHash,
      });
    }
    return {
      status: 'success',
      model: OPENAI_MODEL,
      promptId: promptDef.id,
      promptVersion: promptDef.version,
      analysis: fallback,
      errorMessage,
    };
  }
};
