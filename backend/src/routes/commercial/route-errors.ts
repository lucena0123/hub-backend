import type { FastifyReply } from 'fastify';
import { CommercialFlowError } from '../../modules/commercial';

const DEFAULT_STATUS_BY_CODE: Record<string, number> = {
  NOT_FOUND: 404,
  DOR_BLOCKED: 409,
  INVALID_TRANSITION: 409,
  DUPLICATE_LEAD: 409,
  DELETE_GUARD: 400,
  VALIDATION_ERROR: 400,
};

export function handleCommercialRouteError(
  reply: FastifyReply,
  error: unknown,
  options?: { includeDetails?: boolean; statusByCode?: Record<string, number> },
) {
  if (error instanceof CommercialFlowError) {
    const statusByCode = options?.statusByCode || DEFAULT_STATUS_BY_CODE;
    reply.status(statusByCode[error.code] || 400);
    return {
      error: error.code,
      message: error.message,
      ...(options?.includeDetails ? { details: error.details } : {}),
    };
  }

  reply.status(500);
  return {
    error: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'Unknown error',
  };
}
