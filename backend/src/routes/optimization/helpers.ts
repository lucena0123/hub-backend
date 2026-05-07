import type { FastifyInstance } from 'fastify';

import { createAuditLog } from '../../middleware/audit';

export const sendApiError = (
  reply: { status: (statusCode: number) => { send: (payload: unknown) => unknown } },
  statusCode: number,
  code: string,
  error: string,
  details?: unknown
) => {
  return reply.status(statusCode).send({
    success: false,
    code,
    error,
    ...(details ? { details } : {}),
  });
};

export type OptimizationAuditParams = {
  userId?: string;
  userRole?: string;
  clientId?: string;
  processId?: string;
  action: 'create' | 'update' | 'delete' | 'read';
  entityType: 'task' | 'campaign' | 'client' | 'process' | 'user';
  entityId: string;
  changes?: unknown;
  metadata?: unknown;
};

export const logOptimizationAudit = async (
  fastify: FastifyInstance,
  params: OptimizationAuditParams
) => {
  await createAuditLog(fastify.pool, {
    userId: params.userId,
    userRole: params.userRole,
    clientId: params.clientId,
    processId: params.processId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    changes: params.changes,
    metadata: params.metadata,
  });
};

export const ensureClientExists = async (fastify: FastifyInstance, clientId: string) => {
  const client = await fastify.prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });

  return !!client;
};
