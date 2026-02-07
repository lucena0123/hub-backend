import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { MetricsService } from './metrics-service';
import type { MonthlyReport } from '../types/metrics';
import { toIsoDateUtc } from '../utils/date';
import { generateClientReportContent, generateClientWeeklyReportContent } from './report-analysis';
import { getClientLeadFunnelSummary } from './reports/lead-funnel-summary';
import { generateReportPdf } from './reports/pdf';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export class ReportGenerator {


  constructor(private prisma: PrismaClient, private metricsService: MetricsService) {
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
      prisma: this.prisma,
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

    // Unique filename per generated generated report to avoid overwriting PDFs for the same period.
    const fileName = `${clientId}_${year}-${String(month).padStart(2, '0')}_${reportId}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    await generateReportPdf({ performance: performanceData, aiContent, outputPath: filePath, title, options: { leadFunnel } });

    const fileSize = fs.statSync(filePath).size;

    const report = await this.prisma.monthlyReport.create({
      data: {
        id: reportId,
        clientId,
        reportType: 'monthly',
        periodStart: new Date(startDateStr),
        periodEnd: new Date(endDateStr),
        title,
        summaryData: summaryData as any, // Cast to any to avoid strict JSON typing issues if types mismatch slightly
        filePath,
        fileSize,
        status: 'generated',
        generatedAt: new Date(),
      }
    });

    // We need to map it back to MonthlyReport type expected by frontend/controller
    // The Prisma result has camelCase keys which matches our mapReportRow internal logic mostly, 
    // but mapReportRow expects snake_case from PG driver.
    // Instead of using mapReportRow, we should constructing the object directly or make a compatible mapper.
    // Let's adapt mapReportRow or just return a compatible object.

    return {
      id: report.id,
      clientId: report.clientId,
      reportType: report.reportType as any,
      periodStart: report.periodStart.toISOString(),
      periodEnd: report.periodEnd.toISOString(),
      title: report.title,
      summaryData: report.summaryData as any,
      filePath: report.filePath || undefined,
      fileSize: report.fileSize || undefined,
      pdfUrl: report.pdfUrl || undefined,
      generatedBy: report.generatedBy || undefined,
      generatedAt: report.generatedAt.toISOString(),
      version: report.version || 1,
      status: report.status as any,
      metadata: report.metadata,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  async generateWeeklyReport(clientId: string, startDate: string, endDate: string): Promise<MonthlyReport> {
    const performanceData = await this.metricsService.getClientPerformanceSummary(clientId, {
      startDate,
      endDate,
    });

    const leadFunnel = await getClientLeadFunnelSummary({
      prisma: this.prisma,
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

    const report = await this.prisma.monthlyReport.create({
      data: {
        id: reportId,
        clientId,
        reportType: 'weekly',
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        title,
        summaryData: summaryData as any,
        filePath,
        fileSize,
        status: 'generated',
        generatedAt: new Date(),
      }
    });

    return {
      id: report.id,
      clientId: report.clientId,
      reportType: report.reportType as any,
      periodStart: report.periodStart.toISOString(),
      periodEnd: report.periodEnd.toISOString(),
      title: report.title,
      summaryData: report.summaryData as any,
      filePath: report.filePath || undefined,
      fileSize: report.fileSize || undefined,
      pdfUrl: report.pdfUrl || undefined,
      generatedBy: report.generatedBy || undefined,
      generatedAt: report.generatedAt.toISOString(),
      version: report.version || 1,
      status: report.status as any,
      metadata: report.metadata,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  async getReportHistory(clientId: string): Promise<MonthlyReport[]> {
    const reports = await this.prisma.monthlyReport.findMany({
      where: { clientId },
      orderBy: { periodStart: 'desc' }
    });

    return reports.map(report => ({
      id: report.id,
      clientId: report.clientId,
      reportType: report.reportType as any,
      periodStart: report.periodStart.toISOString(), // Assuming these are Date objects from Prisma
      periodEnd: report.periodEnd.toISOString(),
      title: report.title,
      summaryData: report.summaryData as any,
      filePath: report.filePath || undefined,
      fileSize: report.fileSize || undefined,
      pdfUrl: report.pdfUrl || undefined,
      generatedBy: report.generatedBy || undefined,
      generatedAt: report.generatedAt.toISOString(),
      version: report.version || 1,
      status: report.status as any,
      metadata: report.metadata,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }));
  }

  async getReportById(reportId: string): Promise<MonthlyReport | null> {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return null;
    }

    return {
      id: report.id,
      clientId: report.clientId,
      reportType: report.reportType as any,
      periodStart: report.periodStart.toISOString(),
      periodEnd: report.periodEnd.toISOString(),
      title: report.title,
      summaryData: report.summaryData as any,
      filePath: report.filePath || undefined,
      fileSize: report.fileSize || undefined,
      pdfUrl: report.pdfUrl || undefined,
      generatedBy: report.generatedBy || undefined,
      generatedAt: report.generatedAt.toISOString(),
      version: report.version || 1,
      status: report.status as any,
      metadata: report.metadata,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }
}
