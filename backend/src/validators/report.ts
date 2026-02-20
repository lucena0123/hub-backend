/**
 * Report generation validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Regex for YYYY-MM-DD format
 */
const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Schema for generating a monthly report
 */
export const reportGenerateSchema = z.object({
  month: z.number()
    .int('Month must be an integer')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z.number()
    .int('Year must be an integer')
    .min(2020, 'Year must be 2020 or later')
    .max(2030, 'Year must be 2030 or earlier'),
});

export type ReportGenerateInput = z.infer<typeof reportGenerateSchema>;

export const reportWeeklyGenerateSchema = z.object({
  startDate: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'startDate must be before or equal to endDate',
    path: ['startDate'],
  }
);

export type ReportWeeklyGenerateInput = z.infer<typeof reportWeeklyGenerateSchema>;

/**
 * Validate report generation data
 */
export function validateReportGenerate(data: unknown) {
  const result = reportGenerateSchema.safeParse(data);
  if (result.success) {
    return { valid: true as const, data: result.data, errors: [] };
  }
  return {
    valid: false as const,
    data: null,
    errors: result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

export function validateWeeklyReportGenerate(data: unknown) {
  const result = reportWeeklyGenerateSchema.safeParse(data);
  if (result.success) {
    return { valid: true as const, data: result.data, errors: [] };
  }
  return {
    valid: false as const,
    data: null,
    errors: result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  };
}
