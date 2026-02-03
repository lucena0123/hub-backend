import type { ClientPerformanceSummary, AIReportContent } from '../types/metrics';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateClientReportContent(performance: ClientPerformanceSummary): Promise<AIReportContent> {
  const defaultContent: AIReportContent = {
    executiveSummary: "Este mês tivemos um volume consistente de leads, mantendo o investimento dentro do planejado.",
    interpretation: "Os números indicam que estamos atraindo o público certo, com um custo por contato saudável.",
    positives: ["Volume de conversas estável", "Investimento eficiente"],
    improvements: ["Testar novas imagens", "Ampliar o alcance"],
    recommendations: ["Manter foco na campanha principal", "Acompanhar qualidade dos leads"]
  };

  if (!OPENAI_API_KEY) return defaultContent;

  const bestCampaign = performance.campaigns.reduce((best, current) =>
    current.totalConversions > best.totalConversions ? current : best
    , performance.campaigns[0] || { campaignName: 'N/A' });

  const prompt = `
    Gere um RELATÓRIO MENSAL PARA O CLIENTE no formato ideal para escritórios de advocacia.
    Este relatório não deve conter termos técnicos, deve ser simples, direto, elegante e focado em RESULTADO.

    DADOS DO MÊS:
    - Cliente: ${performance.clientName}
    - Investimento Total: R$ ${performance.totalSpend.toFixed(2)}
    - Leas (Pessoas Interessadas): ${performance.totalLeads || performance.totalConversions}
    - Custo por Interessado (CPL): R$ ${performance.avgCpl.toFixed(2)}
    - Campanha de maior desempenho: ${bestCampaign.campaignName}

    SIGA EXATAMENTE A ESTRUTURA ABAIXO E RETORNE APENAS UM JSON:

    1. Resumo Executivo (executiveSummary)
    Explique o mês em 3–4 linhas, com linguagem simples e humana.
    Exemplo: "Este mês tivemos um bom volume de pessoas buscando atendimento..."

    2. Interpretação dos Resultados (interpretation)
    Transforme os números em significado real.
    Exemplo: "Esses números mostram que o escritório atraiu pessoas realmente interessadas."

    3. O que Funcionou Bem (positives)
    Lista de 2 a 3 pontos curtos. Ex: "Volume de conversas", "Boa eficiência".

    4. Oportunidades de Melhoria (improvements)
    Lista de 2 a 3 pontos. Ex: "Testar novas imagens", "Ampliar alcance". SEM termos técnicos.

    5. Recomendações para o Próximo Mês (recommendations)
    Lista de 2 a 3 pontos. Ex: "Manter foco", "Ampliar investimento".

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

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);

    const data = await response.json() as any;
    const content = JSON.parse(data.choices[0].message.content);

    return {
      executiveSummary: content.executiveSummary || defaultContent.executiveSummary,
      interpretation: content.interpretation || defaultContent.interpretation,
      positives: content.positives || defaultContent.positives,
      improvements: content.improvements || defaultContent.improvements,
      recommendations: content.recommendations || defaultContent.recommendations
    };

  } catch (error) {
    console.warn('Error generating report content:', error);
    return defaultContent;
  }
}
