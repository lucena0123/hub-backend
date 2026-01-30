/**
 * Report Generator Service
 * Generates monthly PDF reports for clients using Puppeteer
 */

import { Pool } from 'pg';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { MetricsService } from './metrics-service';
import { MonthlyReport, ClientPerformanceSummary } from '../types/metrics';
import * as fs from 'fs';
import * as path from 'path';

export class ReportGenerator {
  private metricsService: MetricsService;

  constructor(private pool: Pool) {
    this.metricsService = new MetricsService(pool);
  }

  /**
   * Generate a monthly report for a client
   */
  async generateMonthlyReport(
    clientId: string,
    month: number,
    year: number
  ): Promise<MonthlyReport> {
    // Calculate date range for the month
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0); // Last day of month

    const startDateStr = periodStart.toISOString().split('T')[0];
    const endDateStr = periodEnd.toISOString().split('T')[0];

    // Get client performance data
    const performanceData = await this.metricsService.getClientPerformanceSummary(
      clientId,
      { startDate: startDateStr, endDate: endDateStr }
    );

    // Generate insights and recommendations
    const insights = this.generateInsights(performanceData);
    const recommendations = this.generateRecommendations(performanceData);
    const highlights = this.generateHighlights(performanceData);

    // Create report record
    const reportId = uuidv4();
    const title = `Relatório Mensal - ${this.getMonthName(month)} ${year}`;

    const summaryData = {
      performance: performanceData,
      insights,
      recommendations,
      highlights,
    };

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate PDF
    const fileName = `${clientId}_${year}-${String(month).padStart(2, '0')}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    await this.generatePDF(performanceData, insights, recommendations, highlights, filePath, title);

    const fileSize = fs.statSync(filePath).size;

    // Save report to database
    const result = await this.pool.query(
      `INSERT INTO monthly_reports
       (id, client_id, report_type, period_start, period_end, title, summary_data,
        file_path, file_size, status, generated_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
       RETURNING *`,
      [
        reportId,
        clientId,
        'monthly',
        periodStart,
        periodEnd,
        title,
        JSON.stringify(summaryData),
        filePath,
        fileSize,
        'generated',
      ]
    );

    return this.mapReportRow(result.rows[0]);
  }

  /**
   * Generate PDF from HTML template
   */
  private async generatePDF(
    performance: ClientPerformanceSummary,
    insights: string[],
    recommendations: string[],
    highlights: string[],
    outputPath: string,
    title: string
  ): Promise<void> {
    const html = this.generateHTML(performance, insights, recommendations, highlights, title);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });

    await browser.close();
  }

  /**
   * Generate HTML template for report
   */
  private generateHTML(
    performance: ClientPerformanceSummary,
    insights: string[],
    recommendations: string[],
    highlights: string[],
    title: string
  ): string {
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatNumber = (value: number) =>
      new Intl.NumberFormat('pt-BR').format(value);

    const formatPercent = (value: number) =>
      `${value.toFixed(2)}%`;

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
    <!-- Resumo Executivo -->
    <div class="section">
      <h2 class="section-title">📊 Resumo Executivo</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total de Impressões</div>
          <div class="metric-value">${formatNumber(performance.totalImpressions)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total de Cliques</div>
          <div class="metric-value">${formatNumber(performance.totalClicks)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total de Conversões</div>
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
          <div class="metric-label">ROAS Médio</div>
          <div class="metric-value">${performance.avgRoas.toFixed(2)}x</div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">CTR Médio</div>
          <div class="metric-value">${formatPercent(performance.avgCtr)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">CPL Médio</div>
          <div class="metric-value">${formatCurrency(performance.avgCpl)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Campanhas Ativas</div>
          <div class="metric-value">${performance.activeCampaigns}/${performance.totalCampaigns}</div>
        </div>
      </div>
    </div>

    <!-- Destaques do Período -->
    <div class="section">
      <h2 class="section-title">⭐ Destaques do Período</h2>
      <ul class="list">
        ${highlights.map(h => `<li class="highlight">${h}</li>`).join('')}
      </ul>
    </div>

    <!-- Performance por Campanha -->
    <div class="section">
      <h2 class="section-title">📈 Performance por Campanha</h2>
      <table class="campaigns-table">
        <thead>
          <tr>
            <th>Campanha</th>
            <th>Plataforma</th>
            <th>Impressões</th>
            <th>Cliques</th>
            <th>Conversões</th>
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
              <td class="status-${camp.status}">${this.translateStatus(camp.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Insights -->
    <div class="section">
      <h2 class="section-title">💡 Insights</h2>
      <ul class="list">
        ${insights.map(insight => `<li>${insight}</li>`).join('')}
      </ul>
    </div>

    <!-- Recomendações -->
    <div class="section">
      <h2 class="section-title">🎯 Recomendações</h2>
      <ul class="list">
        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>

    <!-- Progresso BPMN -->
    ${performance.bpmnProgress ? `
    <div class="section">
      <h2 class="section-title">🔄 Progresso BPMN</h2>
      <div class="metric-card">
        <div class="metric-label">Subprocesso Atual</div>
        <div class="metric-value">${performance.bpmnProgress.currentSubprocess}</div>
        <p style="margin-top: 10px;">Progresso: ${performance.bpmnProgress.progressPercentage}%</p>
        <p>Status: ${this.translateBpmnStatus(performance.bpmnProgress.status)}</p>
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
    <p>Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
    <p>BPMN System - Sistema de Gerenciamento de Campanhas</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate insights based on performance data
   */
  private generateInsights(performance: ClientPerformanceSummary): string[] {
    const insights: string[] = [];

    // ROAS analysis
    if (performance.avgRoas > 5) {
      insights.push(`Excelente retorno sobre investimento com ROAS de ${performance.avgRoas.toFixed(2)}x, muito acima da média do mercado.`);
    } else if (performance.avgRoas > 3) {
      insights.push(`Bom retorno sobre investimento com ROAS de ${performance.avgRoas.toFixed(2)}x.`);
    } else if (performance.avgRoas > 1) {
      insights.push(`ROAS de ${performance.avgRoas.toFixed(2)}x indica retorno positivo, mas há espaço para otimização.`);
    } else {
      insights.push(`ROAS de ${performance.avgRoas.toFixed(2)}x está abaixo do ideal. Recomendamos revisão urgente das campanhas.`);
    }

    // CTR analysis
    if (performance.avgCtr > 3) {
      insights.push(`CTR de ${performance.avgCtr.toFixed(2)}% demonstra alta relevância dos anúncios para o público-alvo.`);
    } else if (performance.avgCtr < 1) {
      insights.push(`CTR de ${performance.avgCtr.toFixed(2)}% está baixo. Considere revisar criativos e copy dos anúncios.`);
    }

    // Conversion analysis
    if (performance.totalConversions > 0) {
      const conversionRate = (performance.totalConversions / performance.totalClicks) * 100;
      if (conversionRate > 5) {
        insights.push(`Taxa de conversão de ${conversionRate.toFixed(2)}% indica landing pages otimizadas e público bem segmentado.`);
      } else if (conversionRate < 2) {
        insights.push(`Taxa de conversão de ${conversionRate.toFixed(2)}% sugere oportunidade de melhoria nas landing pages.`);
      }
    }

    // Campaign performance comparison
    const bestCampaign = performance.campaigns.reduce((best, current) =>
      current.roas > best.roas ? current : best
    );
    insights.push(`A campanha "${bestCampaign.campaignName}" teve a melhor performance com ROAS de ${bestCampaign.roas.toFixed(2)}x.`);

    return insights;
  }

  /**
   * Generate recommendations based on performance data
   */
  private generateRecommendations(performance: ClientPerformanceSummary): string[] {
    const recommendations: string[] = [];

    // ROAS-based recommendations
    if (performance.avgRoas < 3) {
      recommendations.push('Revisar segmentação de público e ajustar lances para melhorar ROAS.');
      recommendations.push('Analisar jornada do cliente e otimizar funil de conversão.');
    }

    // Budget recommendations
    const topCampaigns = performance.campaigns
      .filter(c => c.roas > performance.avgRoas)
      .sort((a, b) => b.roas - a.roas);

    if (topCampaigns.length > 0) {
      recommendations.push(`Considere aumentar investimento nas campanhas de melhor performance: ${topCampaigns.slice(0, 2).map(c => c.campaignName).join(', ')}.`);
    }

    // CTR recommendations
    if (performance.avgCtr < 2) {
      recommendations.push('Realizar testes A/B de criativos para melhorar CTR.');
      recommendations.push('Revisar copy dos anúncios para aumentar relevância.');
    }

    // Platform diversity
    const platforms = new Set(performance.campaigns.map(c => c.platform));
    if (platforms.size === 1) {
      recommendations.push('Considere diversificar plataformas para ampliar alcance e reduzir dependência.');
    }

    // CPL recommendations
    if (performance.avgCpl > 50) {
      recommendations.push('CPL elevado. Recomendamos otimizar formulários e reduzir fricção no processo de conversão.');
    }

    return recommendations;
  }

  /**
   * Generate highlights based on performance data
   */
  private generateHighlights(performance: ClientPerformanceSummary): string[] {
    const highlights: string[] = [];

    // ROI highlight
    const roi = ((performance.totalRevenue - performance.totalSpend) / performance.totalSpend) * 100;
    highlights.push(`ROI de ${roi.toFixed(1)}% no período.`);

    // Best performing campaign
    const bestCampaign = performance.campaigns.reduce((best, current) =>
      current.roas > best.roas ? current : best
    );
    highlights.push(`Campanha de destaque: ${bestCampaign.campaignName} com ${bestCampaign.totalConversions} conversões.`);

    // Total results
    highlights.push(`${performance.totalConversions} conversões geradas com investimento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(performance.totalSpend)}.`);

    // Active campaigns
    highlights.push(`${performance.activeCampaigns} campanhas ativas gerando resultados.`);

    return highlights;
  }

  /**
   * Get report history for a client
   */
  async getReportHistory(clientId: string): Promise<MonthlyReport[]> {
    const result = await this.pool.query(
      `SELECT * FROM monthly_reports
       WHERE client_id = $1
       ORDER BY period_start DESC`,
      [clientId]
    );

    return result.rows.map(row => this.mapReportRow(row));
  }

  /**
   * Get a specific report by ID
   */
  async getReportById(reportId: string): Promise<MonthlyReport | null> {
    const result = await this.pool.query(
      'SELECT * FROM monthly_reports WHERE id = $1',
      [reportId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapReportRow(result.rows[0]);
  }

  /**
   * Map database row to MonthlyReport type
   */
  private mapReportRow(row: any): MonthlyReport {
    return {
      id: row.id,
      clientId: row.client_id,
      reportType: row.report_type,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      title: row.title,
      summaryData: row.summary_data,
      filePath: row.file_path,
      fileSize: row.file_size,
      pdfUrl: row.pdf_url,
      generatedBy: row.generated_by,
      generatedAt: row.generated_at,
      version: row.version,
      status: row.status,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get month name in Portuguese
   */
  private getMonthName(month: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  }

  /**
   * Translate status to Portuguese
   */
  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      excellent: 'Excelente',
      good: 'Bom',
      fair: 'Regular',
      poor: 'Precisa Atenção',
    };
    return translations[status] || status;
  }

  /**
   * Translate BPMN status to Portuguese
   */
  private translateBpmnStatus(status: string): string {
    const translations: Record<string, string> = {
      not_started: 'Não Iniciado',
      in_progress: 'Em Progresso',
      completed: 'Concluído',
      blocked: 'Bloqueado',
    };
    return translations[status] || status;
  }
}
