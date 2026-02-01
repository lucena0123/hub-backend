/**
 * Report Template Service
 * Generates HTML templates for PDF reports
 */

import { ClientPerformanceSummary } from '../types/metrics';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

const formatPercent = (value: number) =>
  `${value.toFixed(2)}%`;

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    excellent: 'Excelente',
    good: 'Bom',
    fair: 'Regular',
    poor: 'Precisa Atenção',
  };
  return translations[status] || status;
}

function translateBpmnStatus(status: string): string {
  const translations: Record<string, string> = {
    not_started: 'Não Iniciado',
    in_progress: 'Em Progresso',
    completed: 'Concluído',
    blocked: 'Bloqueado',
  };
  return translations[status] || status;
}

export function generateReportHTML(
  performance: ClientPerformanceSummary,
  insights: string[],
  recommendations: string[],
  highlights: string[],
  title: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { font-size: 16px; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .section { margin-bottom: 40px; }
    .section-title {
      font-size: 24px;
      color: #667eea;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #1a1a1a;
    }
    .campaigns-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .campaigns-table th {
      background: #667eea;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    .campaigns-table td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .campaigns-table tr:hover {
      background: #f8f9fa;
    }
    .list { list-style: none; }
    .list li {
      padding: 12px;
      margin-bottom: 8px;
      background: #f8f9fa;
      border-left: 3px solid #667eea;
      border-radius: 4px;
    }
    .highlight {
      background: #fef3c7;
      border-left-color: #f59e0b;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .status-excellent { color: #10b981; font-weight: bold; }
    .status-good { color: #3b82f6; font-weight: bold; }
    .status-fair { color: #f59e0b; font-weight: bold; }
    .status-poor { color: #ef4444; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>${performance.clientName}</p>
    <p>${performance.period.start} a ${performance.period.end}</p>
  </div>

  <div class="content">
    <div class="section">
      <h2 class="section-title">Resumo Executivo</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total de Impressoes</div>
          <div class="metric-value">${formatNumber(performance.totalImpressions)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total de Cliques</div>
          <div class="metric-value">${formatNumber(performance.totalClicks)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total de Conversoes</div>
          <div class="metric-value">${formatNumber(performance.totalConversions)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Investimento Total</div>
          <div class="metric-value">${formatCurrency(performance.totalSpend)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Receita Total</div>
          <div class="metric-value">${formatCurrency(performance.totalRevenue)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">ROAS Medio</div>
          <div class="metric-value">${performance.avgRoas.toFixed(2)}x</div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">CTR Medio</div>
          <div class="metric-value">${formatPercent(performance.avgCtr)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">CPL Medio</div>
          <div class="metric-value">${formatCurrency(performance.avgCpl)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Campanhas Ativas</div>
          <div class="metric-value">${performance.activeCampaigns}/${performance.totalCampaigns}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Destaques do Periodo</h2>
      <ul class="list">
        ${highlights.map(h => `<li class="highlight">${h}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h2 class="section-title">Performance por Campanha</h2>
      <table class="campaigns-table">
        <thead>
          <tr>
            <th>Campanha</th>
            <th>Plataforma</th>
            <th>Impressoes</th>
            <th>Cliques</th>
            <th>Conversoes</th>
            <th>Investimento</th>
            <th>ROAS</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${performance.campaigns.map(camp => `
            <tr>
              <td>${camp.campaignName}</td>
              <td>${camp.platform.toUpperCase()}</td>
              <td>${formatNumber(camp.totalImpressions)}</td>
              <td>${formatNumber(camp.totalClicks)}</td>
              <td>${formatNumber(camp.totalConversions)}</td>
              <td>${formatCurrency(camp.totalSpend)}</td>
              <td>${camp.roas.toFixed(2)}x</td>
              <td class="status-${camp.status}">${translateStatus(camp.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2 class="section-title">Insights</h2>
      <ul class="list">
        ${insights.map(insight => `<li>${insight}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h2 class="section-title">Recomendacoes</h2>
      <ul class="list">
        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>

    ${performance.bpmnProgress ? `
    <div class="section">
      <h2 class="section-title">Progresso BPMN</h2>
      <div class="metric-card">
        <div class="metric-label">Subprocesso Atual</div>
        <div class="metric-value">${performance.bpmnProgress.currentSubprocess}</div>
        <p style="margin-top: 10px;">Progresso: ${performance.bpmnProgress.progressPercentage}%</p>
        <p>Status: ${translateBpmnStatus(performance.bpmnProgress.status)}</p>
        ${performance.bpmnProgress.pendingTasks.length > 0 ? `
          <p style="margin-top: 10px; font-weight: bold;">Tarefas Pendentes:</p>
          <ul style="margin-left: 20px; margin-top: 5px;">
            ${performance.bpmnProgress.pendingTasks.map(task => `<li>${task}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
    ` : ''}
  </div>

  <div class="footer">
    <p>Relatorio gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
    <p>BPMN System - Sistema de Gerenciamento de Campanhas</p>
  </div>
</body>
</html>
  `;
}
