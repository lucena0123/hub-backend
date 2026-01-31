/**
 * Metrics import validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Single metric entry for import
 */
const metricEntrySchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  impressions: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  spend: z.number().min(0).default(0),
  conversions: z.number().int().min(0).default(0),
  revenue: z.number().min(0).default(0),
  leads: z.number().int().min(0).default(0),
});

/**
 * Schema for batch importing metrics
 */
export const metricsImportSchema = z.object({
  metrics: z.array(metricEntrySchema)
    .min(1, 'At least one metric entry is required')
    .max(1000, 'Maximum 1000 entries per import'),
  overwrite: z.boolean().optional().default(false),
});

/**
 * Schema for single metric upsert
 */
export const metricUpsertSchema = metricEntrySchema;

export type MetricsImportInput = z.infer<typeof metricsImportSchema>;
export type MetricEntryInput = z.infer<typeof metricEntrySchema>;

/**
 * Validate batch metrics import
 */
export function validateMetricsImport(data: unknown) {
  const result = metricsImportSchema.safeParse(data);
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

/**
 * Validate single metric entry
 */
export function validateMetricUpsert(data: unknown) {
  const result = metricUpsertSchema.safeParse(data);
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
