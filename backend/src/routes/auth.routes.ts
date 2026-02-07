import { FastifyPluginAsync } from 'fastify';
import { validateRegister, validateLogin } from '../validators/auth';
import { authenticate } from '../middleware/auth';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const { auth: authService } = fastify.services;

  // Register new user
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
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
};

export default authRoutes;
