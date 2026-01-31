/**
 * Report generation validation schemas using Zod
 */

import { z } from 'zod';

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
