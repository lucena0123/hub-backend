import type { FastifyReply, FastifyRequest } from 'fastify';

type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';

const getUserRole = (request: FastifyRequest): UserRole | null => {
  const role = (request as any)?.user?.role;
  if (typeof role !== 'string') return null;
  if (role === 'admin' || role === 'manager' || role === 'analyst' || role === 'viewer') return role;
  return null;
};

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await (request as any).jwtVerify();
  } catch {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
    return;
  }
};

export const requireRoles = (roles: readonly UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await (request as any).jwtVerify();
    } catch {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    const role = getUserRole(request);
    if (!role || !roles.includes(role)) {
      reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }
  };
};

