import type { PromptDefinition } from '../types';

export type WeeklyReportPromptInput = {
  clientName: string;
  periodStart: string;
  periodEnd: string;
  totalSpend: number;
  totalContacts: number;
  costPerContact: number;
  bestCampaignName: string;
  qualifiedLine: string;
};

const formatCurrency = (value: number) => value.toFixed(2);

export const REPORT_WEEKLY_PROMPT: PromptDefinition<WeeklyReportPromptInput> = {
  id: 'report-weekly',
  version: 'report-weekly-v1',
  schemaVersion: 'report-weekly-v1',
  owner: 'growth',
  lastUpdated: '2026-02-10',
  description: 'Relatório semanal simples e orientado a resultado para clientes jurídicos.',
  build: (input) => `
    Gere um RELATÓRIO SEMANAL PARA O CLIENTE no formato ideal para escritórios de advocacia.
    Este relatório não deve conter termos técnicos, deve ser simples, direto, elegante e focado em RESULTADO.

    DADOS DA SEMANA:
    - Cliente: ${input.clientName}
    - Período: ${input.periodStart} a ${input.periodEnd}
    - Investimento Total: R$ ${formatCurrency(input.totalSpend)}
    - Contatos (Conversas Iniciadas): ${input.totalContacts}
    - Custo por Contato: R$ ${formatCurrency(input.costPerContact)}
    - Campanha de maior desempenho: ${input.bestCampaignName}

    DADOS DE QUALIFICAÇÃO (MANUAL):
    ${input.qualifiedLine}

    SIGA EXATAMENTE A ESTRUTURA ABAIXO E RETORNE APENAS UM JSON:

    1. Resumo Executivo (executiveSummary)
    Explique a semana em 3–4 linhas, com linguagem simples e humana.

    2. Interpretação dos Resultados (interpretation)
    Transforme os números em significado real.

    3. O que Funcionou Bem (positives)
    Lista de 2 a 3 pontos curtos.

    4. Oportunidades de Melhoria (improvements)
    Lista de 2 a 3 pontos. SEM termos técnicos.

    5. Recomendações para a Próxima Semana (recommendations)
    Lista de 2 a 3 pontos. SEM termos técnicos.

    REGRAS RÍGIDAS:
    - PROIBIDO: CTR, CPC, CPM, Frequência, ROAS, Impressões.
    - Fale a língua do cliente (Advogado/Dono de negócio).

    FORMATO JSON DE RESPOSTA:
    {
      "executiveSummary": "texto...",
      "interpretation": "texto...",
      "positives": ["item", "item"],
      "improvements": ["item", "item"],
      "recommendations": ["item", "item"]
    }
  `,
};
