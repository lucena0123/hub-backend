import type { MonthlyReport } from '../../types/metrics';

export const mapReportRow = (row: any): MonthlyReport => {
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
};

