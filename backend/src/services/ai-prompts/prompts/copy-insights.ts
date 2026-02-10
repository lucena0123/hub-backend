import type { PromptDefinition } from '../types';

export type CopyInsightsPromptInput = {
  themeKey: string;
  themeName: string;
  snapshot: {
    headline: string | null;
    primaryText: string | null;
    description: string | null;
    ctaType: string | null;
    destinationUrl: string | null;
    isDynamic: boolean;
    format: string | null;
    headlines: string[] | null;
    primaryTexts: string[] | null;
    descriptions: string[] | null;
    ctaTypes: string[] | null;
  };
};

const resolveFallback = (value: string | null, list?: string[] | null) => {
  if (value && value.trim().length > 0) return value;
  if (!list || list.length === 0) return null;
  const first = list.find((item) => typeof item === 'string' && item.trim().length > 0);
  return first ?? null;
};

export const COPY_INSIGHTS_PROMPT: PromptDefinition<CopyInsightsPromptInput> = {
  id: 'copy-insights',
  version: 'copy-v1',
  schemaVersion: 'copy-insights-v1',
  owner: 'growth',
  lastUpdated: '2026-02-10',
  description: 'Analisa copy de criativo (Meta Ads) e sugere melhorias com foco em conversas no WhatsApp.',
  build: (input) => {
    const { themeKey, themeName, snapshot } = input;
    const fallbackHeadline = resolveFallback(snapshot.headline, snapshot.headlines);
    const fallbackPrimary = resolveFallback(snapshot.primaryText, snapshot.primaryTexts);
    const fallbackDescription = resolveFallback(snapshot.description, snapshot.descriptions);

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
  },
};
