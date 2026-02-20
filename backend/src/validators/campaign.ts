/**
 * Campaign validation schemas using Zod
 */

import { z } from 'zod';

// Valid platforms
const platforms = ['meta', 'google', 'tiktok', 'linkedin', 'twitter', 'other'] as const;
const campaignStatuses = ['active', 'paused', 'completed', 'draft'] as const;

/**
 * Schema for creating a new campaign
 */
export const campaignCreateSchema = z.object({
  clientId: z.string().uuid('clientId must be a valid UUID'),
  name: z.string().min(1, 'Campaign name is required').max(200, 'Name too long'),
  platform: z.enum(platforms, {
    errorMap: () => ({ message: `Platform must be one of: ${platforms.join(', ')}` }),
  }),
  budget: z.number().positive('Budget must be positive').max(10_000_000, 'Budget exceeds maximum'),
  externalId: z.string().max(100).optional(),
  optimizationThemeKey: z.string().max(100).optional(),
  optimizationSubthemeKey: z.string().max(100).optional(),
  status: z.enum(campaignStatuses).optional().default('active'),
});

/**
 * Schema for updating an existing campaign
 */
export const campaignUpdateSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(200).optional(),
  platform: z.enum(platforms, {
    errorMap: () => ({ message: `Platform must be one of: ${platforms.join(', ')}` }),
  }).optional(),
  budget: z.number().positive('Budget must be positive').max(10_000_000).optional(),
  status: z.enum(campaignStatuses).optional(),
  spent: z.number().min(0, 'Spent cannot be negative').optional(),
  optimizationThemeKey: z.string().max(100).nullable().optional(),
  optimizationSubthemeKey: z.string().max(100).nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;

/**
 * Validate and parse campaign creation data
 */
export function validateCampaignCreate(data: unknown) {
  const result = campaignCreateSchema.safeParse(data);
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
 * Validate and parse campaign update data
 */
export function validateCampaignUpdate(data: unknown) {
  const result = campaignUpdateSchema.safeParse(data);
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
