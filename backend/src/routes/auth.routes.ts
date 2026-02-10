import { FastifyPluginAsync } from 'fastify';
import { validateRegister, validateLogin } from '../validators/auth';
import { authenticate } from '../middleware/auth';
import { IS_PRODUCTION } from '../config/env';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const { auth: authService } = fastify.services;

  // Register new user
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const allowPublicRegister = process.env.ALLOW_PUBLIC_REGISTER === 'true' || !IS_PRODUCTION;
      if (!allowPublicRegister) {
        reply.status(403);
        return { error: 'Registration disabled' };
      }

      const validation = validateRegister(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const user = await authService.register(validation.data!);

      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      reply.status(201);
      return { user, token };
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error && error.message === 'Email already registered') {
        reply.status(409);
        return { error: 'Email already registered' };
      }
      reply.status(500);
      return { error: 'Registration failed', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const validation = validateLogin(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const user = await authService.login(validation.data!);

      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return {
        user,
        token,
      };
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error && error.message === 'Invalid credentials') {
        reply.status(401);
        return { error: 'Invalid credentials' };
      }
      reply.status(500);
      return { error: 'Login failed', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get current user (protected)
  fastify.get('/api/auth/me', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { id } = request.user;
      const user = await authService.getUserById(id);

      if (!user) {
        reply.status(404);
        return { error: 'User not found' };
      }

      return user;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to fetch user', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Update profile (protected)
  fastify.put('/api/auth/profile', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { name } = request.body as { name: string };
      if (!name || name.trim().length < 2) {
        reply.status(400);
        return { error: 'Nome deve ter pelo menos 2 caracteres' };
      }
      const user = await authService.updateProfile(request.user.id, { name });
      return user;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to update profile', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Change password (protected)
  fastify.put('/api/auth/password', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { oldPassword, newPassword } = request.body as { oldPassword: string; newPassword: string };
      if (!newPassword || newPassword.length < 6) {
        reply.status(400);
        return { error: 'Nova senha deve ter pelo menos 6 caracteres' };
      }
      await authService.changePassword(request.user.id, oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid current password') {
        reply.status(400);
        return { error: 'Senha atual incorreta' };
      }
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to change password', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
};

export default authRoutes;
