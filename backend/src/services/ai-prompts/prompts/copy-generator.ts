import type { PromptDefinition } from '../types';

export type CopyGeneratorPromptInput = {
  themeKey: string;
  themeName: string;
  winners: { headline: string | null; primaryText: string | null; ctaType: string | null; cpl: number | null }[];
  count: number;
};

const renderWinnersBlock = (winners: CopyGeneratorPromptInput['winners']) => {
  if (winners.length === 0) return '  (nenhum winner disponível)';
  return winners
    .map(
      (w, i) =>
        `  ${i + 1}. headline: "${w.headline ?? 'N/A'}" | primaryText: "${(w.primaryText ?? '').slice(0, 120)}" | CTA: ${w.ctaType ?? 'N/A'} | CPL: R$${
          w.cpl?.toFixed(2) ?? 'N/A'
        }`
    )
    .join('\n');
};

export const COPY_GENERATOR_PROMPT: PromptDefinition<CopyGeneratorPromptInput> = {
  id: 'copy-generator',
  version: 'copy-gen-v1',
  schemaVersion: 'copy-gen-v1',
  owner: 'growth',
  lastUpdated: '2026-02-10',
  description: 'Gera variações de copy com base em winners e tema, priorizando conversas no WhatsApp.',
  build: (input) => {
    const winnersBlock = renderWinnersBlock(input.winners);

    return `
Você é um especialista em copywriting para anúncios Meta Ads focados em geração de conversas no WhatsApp para escritórios de advocacia.

OBJETIVO: Gerar ${input.count} variações novas de copy (headline + primaryText + CTA + ângulo) baseadas nos winners existentes do cliente.

TEMA:
- themeKey: ${input.themeKey}
- themeName: ${input.themeName}

WINNERS ATUAIS (melhores criativos por CPL):
${winnersBlock}

REGRAS:
- Gere exatamente ${input.count} variações
- Cada variação deve ter um ângulo diferente (dor, urgência, prova social, benefício, autoridade, curiosidade, etc.)
- Headlines com no máximo 60 caracteres
- PrimaryText com no máximo 300 caracteres
- CTA deve ser um dos: WHATSAPP_MESSAGE, SEND_MESSAGE, LEARN_MORE, CONTACT_US
- Linguagem simples, direta, em português (pt-BR)
- Evite promessas absolutas ("garantido", "100%")
- Se inspire nos winners mas NÃO copie diretamente
- Priorize WHATSAPP_MESSAGE como CTA (é o que gera mais conversas)

RETORNE APENAS UM JSON (sem markdown) neste formato:
{
  "suggestions": [
    {
      "headline": "texto da headline",
      "primaryText": "texto principal do anúncio",
      "cta": "WHATSAPP_MESSAGE",
      "angle": "nome do ângulo usado"
    }
  ]
}
`;
  },
};
