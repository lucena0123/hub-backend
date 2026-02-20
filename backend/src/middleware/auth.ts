/**
 * JWT Authentication Middleware
 */

import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Decoded JWT payload
 */
export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Auth guard - verifies JWT token, returns 401 if invalid
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Optional auth - sets user if token present, but doesn't block
 */
export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    // Silently ignore - user is optional
  }
}
