/**
 * Report Analysis Service
 * Generates insights, recommendations, and highlights from performance data
 */

import { ClientPerformanceSummary } from '../types/metrics';

export function generateInsights(performance: ClientPerformanceSummary): string[] {
  const insights: string[] = [];

  if (performance.avgRoas > 5) {
    insights.push(`Excelente retorno sobre investimento com ROAS de ${performance.avgRoas.toFixed(2)}x, muito acima da media do mercado.`);
  } else if (performance.avgRoas > 3) {
    insights.push(`Bom retorno sobre investimento com ROAS de ${performance.avgRoas.toFixed(2)}x.`);
  } else if (performance.avgRoas > 1) {
    insights.push(`ROAS de ${performance.avgRoas.toFixed(2)}x indica retorno positivo, mas ha espaco para otimizacao.`);
  } else {
    insights.push(`ROAS de ${performance.avgRoas.toFixed(2)}x esta abaixo do ideal. Recomendamos revisao urgente das campanhas.`);
  }

  if (performance.avgCtr > 3) {
    insights.push(`CTR de ${performance.avgCtr.toFixed(2)}% demonstra alta relevancia dos anuncios para o publico-alvo.`);
  } else if (performance.avgCtr < 1) {
    insights.push(`CTR de ${performance.avgCtr.toFixed(2)}% esta baixo. Considere revisar criativos e copy dos anuncios.`);
  }

  if (performance.totalConversions > 0) {
    const conversionRate = (performance.totalConversions / performance.totalClicks) * 100;
    if (conversionRate > 5) {
      insights.push(`Taxa de conversao de ${conversionRate.toFixed(2)}% indica landing pages otimizadas e publico bem segmentado.`);
    } else if (conversionRate < 2) {
      insights.push(`Taxa de conversao de ${conversionRate.toFixed(2)}% sugere oportunidade de melhoria nas landing pages.`);
    }
  }

  const bestCampaign = performance.campaigns.reduce((best, current) =>
    current.roas > best.roas ? current : best
  );
  insights.push(`A campanha "${bestCampaign.campaignName}" teve a melhor performance com ROAS de ${bestCampaign.roas.toFixed(2)}x.`);

  return insights;
}

export function generateRecommendations(performance: ClientPerformanceSummary): string[] {
  const recommendations: string[] = [];

  if (performance.avgRoas < 3) {
    recommendations.push('Revisar segmentacao de publico e ajustar lances para melhorar ROAS.');
    recommendations.push('Analisar jornada do cliente e otimizar funil de conversao.');
  }

  const topCampaigns = performance.campaigns
    .filter(c => c.roas > performance.avgRoas)
    .sort((a, b) => b.roas - a.roas);

  if (topCampaigns.length > 0) {
    recommendations.push(`Considere aumentar investimento nas campanhas de melhor performance: ${topCampaigns.slice(0, 2).map(c => c.campaignName).join(', ')}.`);
  }

  if (performance.avgCtr < 2) {
    recommendations.push('Realizar testes A/B de criativos para melhorar CTR.');
    recommendations.push('Revisar copy dos anuncios para aumentar relevancia.');
  }

  const platforms = new Set(performance.campaigns.map(c => c.platform));
  if (platforms.size === 1) {
    recommendations.push('Considere diversificar plataformas para ampliar alcance e reduzir dependencia.');
  }

  if (performance.avgCpl > 50) {
    recommendations.push('CPL elevado. Recomendamos otimizar formularios e reduzir friccao no processo de conversao.');
  }

  return recommendations;
}

export function generateHighlights(performance: ClientPerformanceSummary): string[] {
  const highlights: string[] = [];

  const roi = ((performance.totalRevenue - performance.totalSpend) / performance.totalSpend) * 100;
  highlights.push(`ROI de ${roi.toFixed(1)}% no periodo.`);

  const bestCampaign = performance.campaigns.reduce((best, current) =>
    current.roas > best.roas ? current : best
  );
  highlights.push(`Campanha de destaque: ${bestCampaign.campaignName} com ${bestCampaign.totalConversions} conversoes.`);

  highlights.push(`${performance.totalConversions} conversoes geradas com investimento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(performance.totalSpend)}.`);

  highlights.push(`${performance.activeCampaigns} campanhas ativas gerando resultados.`);

  return highlights;
}
