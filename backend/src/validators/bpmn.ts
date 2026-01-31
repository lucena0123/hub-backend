/**
 * BPMN progress validation schemas using Zod
 */

import { z } from 'zod';

// Valid subprocess IDs (BPMN 1.x through 5.x)
const subprocessPattern = /^\d+\.\d+$/;
const bpmnStatuses = ['in_progress', 'completed', 'blocked', 'not_started'] as const;

/**
 * Schema for initializing BPMN progress
 */
export const bpmnInitSchema = z.object({
  startingSubprocess: z.string()
    .regex(subprocessPattern, 'Subprocess must be in format X.Y (e.g., 4.1)')
    .optional()
    .default('1.1'),
});

/**
 * Schema for updating BPMN progress
 */
export const bpmnUpdateSchema = z.object({
  currentSubprocess: z.string()
    .regex(subprocessPattern, 'Subprocess must be in format X.Y (e.g., 4.2)')
    .optional(),
  status: z.enum(bpmnStatuses, {
    errorMap: () => ({ message: `Status must be one of: ${bpmnStatuses.join(', ')}` }),
  }).optional(),
  progressPercentage: z.number()
    .min(0, 'Progress cannot be less than 0')
    .max(100, 'Progress cannot exceed 100')
    .optional(),
  completedSubprocesses: z.array(z.string().regex(subprocessPattern)).optional(),
  blockers: z.array(z.object({
    description: z.string().min(1, 'Blocker description required'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
    createdAt: z.string().datetime().optional(),
  })).optional(),
  notes: z.string().max(2000, 'Notes too long').optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export type BPMNInitInput = z.infer<typeof bpmnInitSchema>;
export type BPMNUpdateInput = z.infer<typeof bpmnUpdateSchema>;

/**
 * Validate BPMN initialization data
 */
export function validateBpmnInit(data: unknown) {
  const result = bpmnInitSchema.safeParse(data);
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
 * Validate BPMN update data
 */
export function validateBpmnUpdate(data: unknown) {
  const result = bpmnUpdateSchema.safeParse(data);
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
