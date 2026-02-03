import { Pool } from 'pg';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { MetricsService } from './metrics-service';
import { MonthlyReport, ClientPerformanceSummary, AIReportContent } from '../types/metrics';
import { generateReportHTML } from './report-template';
import { generateClientReportContent } from './report-analysis';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export class ReportGenerator {
  private metricsService: MetricsService;

  constructor(private pool: Pool) {
    this.metricsService = new MetricsService(pool);
  }

  private formatIsoDateUtc(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async generateMonthlyReport(
    clientId: string,
    month: number,
    year: number
  ): Promise<MonthlyReport> {
    // Use UTC boundaries to avoid timezone shifts (off-by-one day).
    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 0));

    const startDateStr = this.formatIsoDateUtc(periodStart);
    const endDateStr = this.formatIsoDateUtc(periodEnd);

    const performanceData = await this.metricsService.getClientPerformanceSummary(
      clientId,
      { startDate: startDateStr, endDate: endDateStr }
    );

    // Generate AI Content using the new Structure
    const aiContent = await generateClientReportContent(performanceData);

    const reportId = uuidv4();
    const title = `Relatório Mensal - ${MONTH_NAMES[month - 1]} ${year}`;

    const summaryData = {
      performance: performanceData,
      aiContent
    };

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Unique filename per generated report to avoid overwriting PDFs for the same period.
    const fileName = `${clientId}_${year}-${String(month).padStart(2, '0')}_${reportId}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    await this.generatePDF(performanceData, aiContent, filePath, title);

    const fileSize = fs.statSync(filePath).size;

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
        startDateStr,
        endDateStr,
        title,
        JSON.stringify(summaryData),
        filePath,
        fileSize,
        'generated',
      ]
    );

    return this.mapReportRow(result.rows[0]);
  }

  private async generatePDF(
    performance: ClientPerformanceSummary,
    aiContent: AIReportContent,
    outputPath: string,
    title: string
  ): Promise<void> {
    const html = generateReportHTML(performance, aiContent, title);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });


    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for Chart.js to finish rendering (if applicable and used by the template).
    const hasChartRenderedFlag = await page.evaluate(() =>
      Object.prototype.hasOwnProperty.call(globalThis as any, 'chartRendered')
    );
    if (hasChartRenderedFlag) {
      try {
        await page.waitForFunction('window.chartRendered === true', { timeout: 5000 });
      } catch {
        console.warn('Chart rendering timeout or check failed, proceeding with PDF generation anyway.');
      }
    }


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

  async getReportHistory(clientId: string): Promise<MonthlyReport[]> {
    const result = await this.pool.query(
      `SELECT * FROM monthly_reports
       WHERE client_id = $1
       ORDER BY period_start DESC`,
      [clientId]
    );

    return result.rows.map(row => this.mapReportRow(row));
  }

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
}
