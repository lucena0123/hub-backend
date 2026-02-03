import type { ClientPerformanceSummary, AIReportContent, ClientLeadFunnelSummary } from '../types/metrics';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const generateWithPrompt = async (prompt: string, fallback: AIReportContent): Promise<AIReportContent> => {
  if (!OPENAI_API_KEY) return fallback;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);

    const data = (await response.json()) as any;
    const content = JSON.parse(data.choices[0].message.content);

    return {
      executiveSummary: content.executiveSummary || fallback.executiveSummary,
      interpretation: content.interpretation || fallback.interpretation,
      positives: content.positives || fallback.positives,
      improvements: content.improvements || fallback.improvements,
      recommendations: content.recommendations || fallback.recommendations,
    };
  } catch (error) {
    console.warn('Error generating report content:', error);
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
  leadFunnel?: ClientLeadFunnelSummary | null
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

  const prompt = `
    Gere um RELATÓRIO MENSAL PARA O CLIENTE no formato ideal para escritórios de advocacia.
    Este relatório não deve conter termos técnicos, deve ser simples, direto, elegante e focado em RESULTADO.

    DADOS DO MÊS:
    - Cliente: ${performance.clientName}
    - Investimento Total: R$ ${performance.totalSpend.toFixed(2)}
    - Contatos (Conversas Iniciadas): ${totalContacts}
    - Custo por Contato: R$ ${costPerContact.toFixed(2)}
    - Campanha de maior desempenho: ${bestCampaign.campaignName}

    DADOS DE QUALIFICAÇÃO (MANUAL):
    ${qualifiedLine}

    SIGA EXATAMENTE A ESTRUTURA ABAIXO E RETORNE APENAS UM JSON:

    1. Resumo Executivo (executiveSummary)
    Explique o mês em 3–4 linhas, com linguagem simples e humana.

    2. Interpretação dos Resultados (interpretation)
    Transforme os números em significado real.

    3. O que Funcionou Bem (positives)
    Lista de 2 a 3 pontos curtos.

    4. Oportunidades de Melhoria (improvements)
    Lista de 2 a 3 pontos. SEM termos técnicos.

    5. Recomendações para o Próximo Mês (recommendations)
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
  `;

  return generateWithPrompt(prompt, fallback);
}

export async function generateClientWeeklyReportContent(
  performance: ClientPerformanceSummary,
  leadFunnel?: ClientLeadFunnelSummary | null
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

  const prompt = `
    Gere um RELATÓRIO SEMANAL PARA O CLIENTE no formato ideal para escritórios de advocacia.
    Este relatório não deve conter termos técnicos, deve ser simples, direto, elegante e focado em RESULTADO.

    DADOS DA SEMANA:
    - Cliente: ${performance.clientName}
    - Período: ${performance.period.start} a ${performance.period.end}
    - Investimento Total: R$ ${performance.totalSpend.toFixed(2)}
    - Contatos (Conversas Iniciadas): ${totalContacts}
    - Custo por Contato: R$ ${costPerContact.toFixed(2)}
    - Campanha de maior desempenho: ${bestCampaign.campaignName}

    DADOS DE QUALIFICAÇÃO (MANUAL):
    ${qualifiedLine}

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
  `;

  return generateWithPrompt(prompt, fallback);
}
