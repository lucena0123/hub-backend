/**
 * Meta Ads sync validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Regex for YYYY-MM-DD format
 */
const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Schema for Meta Ads sync request
 */
export const metaSyncSchema = z.object({
  since: z.string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
    .optional(),
  until: z.string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
    .optional(),
  accountId: z.string()
    .max(50, 'Account ID too long')
    .optional(),
  dryRun: z.boolean()
    .optional()
    .default(false),
  syncLevel: z.enum(['campaign', 'adset', 'ad', 'full'])
    .optional()
    .default('campaign'),
}).refine(
  (data) => {
    // If both dates provided, validate since < until
    if (data.since && data.until) {
      return new Date(data.since) < new Date(data.until);
    }
    return true;
  },
  {
    message: 'since date must be before until date',
    path: ['since'],
  }
).refine(
  (data) => {
    // Prevent date ranges > 90 days
    if (data.since && data.until) {
      const daysDiff = Math.floor(
        (new Date(data.until).getTime() - new Date(data.since).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff <= 90;
    }
    return true;
  },
  {
    message: 'Date range cannot exceed 90 days',
    path: ['until'],
  }
);

export type MetaSyncInput = z.infer<typeof metaSyncSchema>;

/**
 * Validate Meta sync request
 */
export function validateMetaSync(data: unknown) {
  const result = metaSyncSchema.safeParse(data);
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
