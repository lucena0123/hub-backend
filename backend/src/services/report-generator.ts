import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { MetricsService } from './metrics-service';
import type { MonthlyReport } from '../types/metrics';
import { toIsoDateUtc } from '../utils/date';
import { generateClientReportContent, generateClientWeeklyReportContent } from './report-analysis';
import { getClientLeadFunnelSummary } from './reports/lead-funnel-summary';
import { generateReportPdf } from './reports/pdf';
import { mapReportRow } from './reports/report-row';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export class ReportGenerator {
  private metricsService: MetricsService;

  constructor(private pool: Pool) {
    this.metricsService = new MetricsService(pool);
  }

  async generateMonthlyReport(
    clientId: string,
    month: number,
    year: number
  ): Promise<MonthlyReport> {
    // Use UTC boundaries to avoid timezone shifts (off-by-one day).
    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 0));

    const startDateStr = toIsoDateUtc(periodStart);
    const endDateStr = toIsoDateUtc(periodEnd);

    const performanceData = await this.metricsService.getClientPerformanceSummary(
      clientId,
      { startDate: startDateStr, endDate: endDateStr }
    );

    const leadFunnel = await getClientLeadFunnelSummary({
      pool: this.pool,
      clientId,
      startDate: startDateStr,
      endDate: endDateStr,
      performance: performanceData,
    });

    // Generate AI Content using the new Structure
    const aiContent = await generateClientReportContent(performanceData, leadFunnel);

    const reportId = uuidv4();
    const title = `Relatório Mensal - ${MONTH_NAMES[month - 1]} ${year}`;

    const summaryData = {
      performance: performanceData,
      aiContent,
      leadFunnel,
    };

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Unique filename per generated report to avoid overwriting PDFs for the same period.
    const fileName = `${clientId}_${year}-${String(month).padStart(2, '0')}_${reportId}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    await generateReportPdf({ performance: performanceData, aiContent, outputPath: filePath, title, options: { leadFunnel } });

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

    return mapReportRow(result.rows[0]);
  }

  async generateWeeklyReport(clientId: string, startDate: string, endDate: string): Promise<MonthlyReport> {
    const performanceData = await this.metricsService.getClientPerformanceSummary(clientId, {
      startDate,
      endDate,
    });

    const leadFunnel = await getClientLeadFunnelSummary({
      pool: this.pool,
      clientId,
      startDate,
      endDate,
      performance: performanceData,
    });

    const aiContent = await generateClientWeeklyReportContent(performanceData, leadFunnel);

    const reportId = uuidv4();
    const title = `Relatório Semanal - ${startDate} a ${endDate}`;

    const summaryData = {
      performance: performanceData,
      aiContent,
      leadFunnel,
    };

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `${clientId}_weekly_${startDate}_${endDate}_${reportId}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    await generateReportPdf({
      performance: performanceData,
      aiContent,
      outputPath: filePath,
      title,
      options: { recommendationsHeading: 'Recomendações para a Próxima Semana', leadFunnel },
    });

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
        'weekly',
        startDate,
        endDate,
        title,
        JSON.stringify(summaryData),
        filePath,
        fileSize,
        'generated',
      ]
    );

    return mapReportRow(result.rows[0]);
  }

  async getReportHistory(clientId: string): Promise<MonthlyReport[]> {
    const result = await this.pool.query(
      `SELECT * FROM monthly_reports
       WHERE client_id = $1
       ORDER BY period_start DESC`,
      [clientId]
    );

    return result.rows.map((row) => mapReportRow(row));
  }

  async getReportById(reportId: string): Promise<MonthlyReport | null> {
    const result = await this.pool.query(
      'SELECT * FROM monthly_reports WHERE id = $1',
      [reportId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapReportRow(result.rows[0]);
  }
}
