import { ZodError } from 'zod';

export const zodErrorToReason = (error: unknown): string => {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`).join('; ');
  }
  if (error instanceof Error) return error.message;
  return String(error);
};
