import { ClientPerformanceSummary, AIReportContent, ClientLeadFunnelSummary } from '../types/metrics';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const DISQUALIFICATION_LABELS: Record<string, string> = {
  curioso: 'Curioso / sem intenção',
  fora_tema: 'Fora do tema',
  sem_perfil: 'Sem perfil',
  sem_verba: 'Sem verba',
  ja_tem_advogado: 'Já tem advogado / já resolveu',
  nao_respondeu: 'Não respondeu',
  outros: 'Outros',
};

export function generateReportHTML(
  performance: ClientPerformanceSummary,
  aiContent: AIReportContent,
  title: string,
  options?: {
    recommendationsHeading?: string;
    leadFunnel?: ClientLeadFunnelSummary | null;
    aiMeta?: { promptId?: string | null; promptVersion?: string | null; model?: string | null };
  }
): string {
  const recommendationsHeading = options?.recommendationsHeading ?? 'Recomendações para o Próximo Mês';
  const preferMessaging = (performance.totalMessagingConversations || 0) > 0;
  const bestCampaign = performance.campaigns.reduce((best, current) => {
    const bestScore = preferMessaging ? best.totalMessagingConversations : best.totalConversions;
    const currentScore = preferMessaging ? current.totalMessagingConversations : current.totalConversions;
    return currentScore > bestScore ? current : best;
  }, performance.campaigns[0] || ({ campaignName: 'N/A', totalMessagingConversations: 0, totalConversions: 0 } as any));

  const totalContacts =
    performance.totalMessagingConversations || performance.totalLeads || performance.totalConversions;
  const costPerContact = totalContacts > 0 ? performance.totalSpend / totalContacts : performance.avgCpl;

  const leadFunnel = options?.leadFunnel ?? null;
  const leadFunnelReasons = leadFunnel?.disqualificationReasons ?? {};
  const leadFunnelTopReasons = Object.entries(leadFunnelReasons)
    .filter(([, count]) => Number.isFinite(count) && count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => `${DISQUALIFICATION_LABELS[key] ?? key.replaceAll('_', ' ')} (${count})`)
    .join(', ');

  const aiMeta = options?.aiMeta ?? null;
  const aiMetaParts = [
    aiMeta?.model ? `model ${aiMeta.model}` : null,
    aiMeta?.promptVersion ? `prompt ${aiMeta.promptVersion}` : null,
    aiMeta?.promptId ? `id ${aiMeta.promptId}` : null,
  ].filter(Boolean);
  const aiMetaLine = aiMetaParts.length > 0 ? `IA: ${aiMetaParts.join(' · ')}` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 40px;
      color: #1e293b;
      line-height: 1.6;
      background-color: #fff;
    }

    .header-container {
      margin-bottom: 40px;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
    }
    
    .report-title {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    
    .client-name {
      font-size: 18px;
      color: #64748b;
      margin-top: 8px;
    }

    .ai-meta {
      margin-top: 6px;
      font-size: 11px;
      color: #94a3b8;
    }

    .ai-meta-box {
      font-size: 13px;
      color: #475569;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px dashed #e2e8f0;
    }

    .section {
      margin-bottom: 35px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .executive-text, .interpretation-text {
      font-size: 15px;
      color: #334155;
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    /* MAIN NUMBERS GRID */
    .numbers-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 15px;
    }
    
    .number-card {
      background: #fff; /* Clean white */
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 25px;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    
    .number-label {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .number-value {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
    }

    .highlight-value {
      color: #10b981; /* Green for efficiency/leads */
    }

    /* LIST STYLES for Positives/Improvements */
    .list-container {
      background: #fff;
    }

    .custom-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .custom-list li {
      padding: 12px 15px;
      margin-bottom: 10px;
      background: #f8fafc;
      border-radius: 6px;
      font-size: 15px;
      display: flex;
      align-items: start;
    }

    .custom-list li::before {
      content: '•';
      color: #3b82f6;
      font-weight: bold;
      font-size: 20px;
      margin-right: 12px;
      line-height: 1;
    }

    .positive-list li::before { color: #10b981; }
    .improvement-list li::before { color: #f59e0b; }
    .recommendation-list li::before { color: #6366f1; }

    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }

  </style>
</head>
<body>

  <!-- 1. TÍTULO -->
  <div class="header-container">
    <h1 class="report-title">${title}</h1>
    <div class="client-name">Cliente: ${performance.clientName} | Período: ${performance.period.start} a ${performance.period.end}</div>
    ${aiMetaLine ? `<div class="ai-meta">${aiMetaLine}</div>` : ''}
  </div>

  ${aiMetaLine ? `
  <!-- 2. METADADOS DE IA -->
  <div class="section">
    <h2 class="section-title">2. Metadados de IA</h2>
    <div class="ai-meta-box">${aiMetaLine}</div>
  </div>
  ` : ''}

  <!-- 3. RESUMO EXECUTIVO -->
  <div class="section">
    <h2 class="section-title">3. Resumo Executivo</h2>
    <div class="executive-text">
      ${aiContent.executiveSummary}
    </div>
  </div>

  <!-- 4. NÚMEROS PRINCIPAIS -->
  <div class="section">
    <h2 class="section-title">4. Números Principais</h2>
    <div class="numbers-grid">
      <div class="number-card">
        <div class="number-label">Investimento Total</div>
        <div class="number-value">${formatCurrency(performance.totalSpend)}</div>
      </div>
      <div class="number-card">
        <div class="number-label">Contatos (Conversas Iniciadas)</div>
        <div class="number-value highlight-value">${formatNumber(totalContacts)}</div>
      </div>
      <div class="number-card">
        <div class="number-label">Custo por Contato</div>
        <div class="number-value">${formatCurrency(costPerContact)}</div>
      </div>
      <div class="number-card">
        <div class="number-label">Campanha de Destaque</div>
        <div class="number-value" style="font-size: 20px; padding-top: 5px;">${bestCampaign.campaignName}</div>
      </div>
    </div>

    ${leadFunnel && leadFunnel.recordsCount > 0 ? `
    <div style="margin-top: 22px;">
      <div class="section-title" style="font-size: 14px; margin-bottom: 10px;">Qualificação dos Contatos (WhatsApp)</div>
      <div class="numbers-grid">
        <div class="number-card">
          <div class="number-label">Contatos Qualificados</div>
          <div class="number-value highlight-value">${formatNumber(leadFunnel.totalQualifiedLeads)}</div>
        </div>
        <div class="number-card">
          <div class="number-label">Percentual de Interesse</div>
          <div class="number-value">${leadFunnel.qualificationRate != null ? formatPercent(leadFunnel.qualificationRate) : '-'}</div>
        </div>
        <div class="number-card">
          <div class="number-label">Custo por Interessado Real</div>
          <div class="number-value">${leadFunnel.costPerQualifiedLead != null ? formatCurrency(leadFunnel.costPerQualifiedLead) : '-'}</div>
        </div>
        <div class="number-card">
          <div class="number-label">Motivos mais comuns</div>
          <div class="number-value" style="font-size: 14px; font-weight: 600; line-height: 1.3; padding-top: 2px;">
            ${leadFunnelTopReasons || '-'}
          </div>
        </div>
      </div>
    </div>
    ` : ''}
  </div>

  <!-- 5. INTERPRETAÇÃO DOS RESULTADOS -->
  <div class="section">
    <h2 class="section-title">5. Interpretação dos Resultados</h2>
    <div class="interpretation-text" style="border-left-color: #8b5cf6; background: #fdf4ff;">
      ${aiContent.interpretation}
    </div>
  </div>

  <!-- 6. O QUE FUNCIONOU BEM -->
  <div class="section" style="page-break-inside: avoid;">
    <h2 class="section-title">6. O que Funcionou Bem</h2>
    <ul class="custom-list positive-list">
      ${aiContent.positives.map(item => `<li>${item}</li>`).join('')}
    </ul>
  </div>

  <!-- 7. OPORTUNIDADES DE MELHORIA -->
  <div class="section" style="page-break-inside: avoid;">
    <h2 class="section-title">7. Oportunidades de Melhoria</h2>
    <ul class="custom-list improvement-list">
      ${aiContent.improvements.map(item => `<li>${item}</li>`).join('')}
    </ul>
  </div>

  <!-- 8. RECOMENDAÇÕES -->
  <div class="section" style="page-break-inside: avoid;">
    <h2 class="section-title">8. ${recommendationsHeading}</h2>
    <ul class="custom-list recommendation-list">
      ${aiContent.recommendations.map(item => `<li>${item}</li>`).join('')}
    </ul>
  </div>

  <div class="footer">
    <p>Relatório gerado automaticamente • ${new Date().toLocaleDateString('pt-BR')}</p>
  </div>

</body>
</html>
  `;
}
