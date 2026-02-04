import 'dotenv/config';

import { inferOptimizationTheme, type OptimizationThemeMatch } from './optimization-playbook';

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
};

const COPY_PROMPT_VERSION = 'copy-v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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

export const buildCopyInsightsPrompt = (input: {
  themeName: string;
  themeKey: string;
  snapshot: CreativeSnapshotInput;
}) => {
  const { themeName, themeKey, snapshot } = input;
  const fallbackHeadline = snapshot.headline ?? (snapshot.headlines?.[0] ?? null);
  const fallbackPrimary = snapshot.primaryText ?? (snapshot.primaryTexts?.[0] ?? null);
  const fallbackDescription = snapshot.description ?? (snapshot.descriptions?.[0] ?? null);

  return `
Você é um especialista em copy para anúncios (Meta Ads) com foco em geração de conversas no WhatsApp para escritórios de advocacia.
Analise o criativo abaixo e sugira melhorias de copy (títulos, textos e CTA), respeitando o tema.

TEMA DETECTADO:
- themeKey: ${themeKey}
- themeName: ${themeName}

CRIATIVO (snapshot):
- headline: ${fallbackHeadline ?? 'N/A'}
- primary_text: ${fallbackPrimary ?? 'N/A'}
- description: ${fallbackDescription ?? 'N/A'}
- cta_type: ${snapshot.ctaType ?? 'N/A'}
- destination_url: ${snapshot.destinationUrl ?? 'N/A'}
- is_dynamic: ${snapshot.isDynamic ? 'true' : 'false'}
- format: ${snapshot.format ?? 'N/A'}

VARIAÇÕES (se existirem em dynamic creative):
- headlines: ${snapshot.headlines ? JSON.stringify(snapshot.headlines.slice(0, 8)) : '[]'}
- primary_texts: ${snapshot.primaryTexts ? JSON.stringify(snapshot.primaryTexts.slice(0, 6)) : '[]'}
- descriptions: ${snapshot.descriptions ? JSON.stringify(snapshot.descriptions.slice(0, 6)) : '[]'}
- cta_types: ${snapshot.ctaTypes ? JSON.stringify(snapshot.ctaTypes.slice(0, 8)) : '[]'}

RETORNE APENAS UM JSON (sem markdown) seguindo este formato:
{
  "angle": {
    "name": "ex: dor, urgência, prova social, benefício, autoridade, passo-a-passo",
    "reason": "por que esse ângulo descreve o criativo"
  },
  "persona": "quem é a pessoa alvo",
  "hook": "como o criativo prende atenção no começo (ou como melhorar)",
  "clarityIssues": ["lista curta do que está confuso/ruim (máx 5)"],
  "complianceRisks": ["cuidados para não prometer demais/evitar linguagem proibida (máx 5)"],
  "suggestions": {
    "headlines": ["5 a 8 opções objetivas e humanas"],
    "primaryTexts": ["3 a 6 opções curtas para WhatsApp"],
    "ctas": ["2 a 4 opções de CTA (texto)"],
    "experiments": ["3 testes A/B sugeridos (ex: gancho X vs Y)"]
  }
}

REGRAS:
- Não invente dados.
- Evite promessas absolutas ("garantido", "100%").
- Linguagem simples e direta em português (pt-BR).
`;
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
): Promise<{ status: CopyInsightsStatus; model: string | null; promptVersion: string; analysis: any | null; errorMessage: string | null }> => {
  const theme = input.theme ?? inferOptimizationTheme(input.snapshot.headline || input.snapshot.primaryText || '');
  const prompt = buildCopyInsightsPrompt({
    themeName: theme.themeName,
    themeKey: theme.themeKey,
    snapshot: input.snapshot,
  });

  if (!OPENAI_API_KEY) {
    return {
      status: 'success',
      model: null,
      promptVersion: COPY_PROMPT_VERSION,
      analysis: buildFallbackCopyInsights({
        themeKey: theme.themeKey,
        themeName: theme.themeName,
        snapshot: input.snapshot,
        reason: 'OPENAI_API_KEY não configurada',
      }),
      errorMessage: null,
    };
  }

  try {
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

    return { status: 'success', model: OPENAI_MODEL, promptVersion: COPY_PROMPT_VERSION, analysis: normalized, errorMessage: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'success',
      model: OPENAI_MODEL,
      promptVersion: COPY_PROMPT_VERSION,
      analysis: buildFallbackCopyInsights({
        themeKey: theme.themeKey,
        themeName: theme.themeName,
        snapshot: input.snapshot,
        reason: errorMessage,
      }),
      errorMessage,
    };
  }
};
