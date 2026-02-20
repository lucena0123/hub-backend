import type { PromptDefinition } from '../types';

export type WeeklySummaryPromptInput = {
  clientName: string;
  weekStart: string;
  weekEnd: string;
  spend: number;
  spendPrev: number;
  spendChange: number | null;
  conversations: number;
  conversationsPrev: number;
  conversationsChange: number | null;
  cpl: number | null;
  cplPrev: number | null;
  cplChange: number | null;
  anomalyCount: number;
  proposalsExecuted: number;
};

const formatCurrency = (value: number) => value.toFixed(2);

export const WEEKLY_SUMMARY_PROMPT: PromptDefinition<WeeklySummaryPromptInput> = {
  id: 'weekly-summary',
  version: 'weekly-summary-v1',
  schemaVersion: 'weekly-summary-v1',
  owner: 'growth',
  lastUpdated: '2026-02-10',
  description: 'Resumo semanal objetivo para performance Meta Ads (jurídico), com highlights e próximos passos.',
  build: (input) => `
Você é um analista de marketing digital especializado em Meta Ads para escritórios de advocacia no Brasil.
Gere um resumo semanal de performance para o cliente "${input.clientName}".

Dados da semana (${input.weekStart} a ${input.weekEnd}):
- Investimento: R$${formatCurrency(input.spend)} (semana anterior: R$${formatCurrency(input.spendPrev)}, variação: ${input.spendChange ?? 'N/A'}%)
- Conversas iniciadas: ${input.conversations} (semana anterior: ${input.conversationsPrev}, variação: ${input.conversationsChange ?? 'N/A'}%)
- CPL: ${input.cpl !== null ? `R$${formatCurrency(input.cpl)}` : 'N/A'} (anterior: ${input.cplPrev !== null ? `R$${formatCurrency(input.cplPrev)}` : 'N/A'}, variação: ${input.cplChange ?? 'N/A'}%)
- Anomalias detectadas na semana: ${input.anomalyCount}
- Ações de otimização executadas: ${input.proposalsExecuted}

Responda em JSON com este formato exato:
{
  "summary": "Parágrafo de 2-3 frases resumindo a semana",
  "highlights": ["ponto positivo 1", "ponto positivo 2"],
  "concerns": ["preocupação 1", "preocupação 2"],
  "nextSteps": ["próximo passo 1", "próximo passo 2", "próximo passo 3"]
}

Regras:
- Use português brasileiro
- Seja direto e objetivo
- Máximo 3 highlights, 3 concerns, 3 nextSteps
- Se não houver dados suficientes, indique isso no summary
`,
};
