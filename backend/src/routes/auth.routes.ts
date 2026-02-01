import { FastifyPluginAsync } from 'fastify';
import { validateRegister, validateLogin } from '../validators/auth';
import { authenticate } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  // Register new user
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const validation = validateRegister(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const { name, email, password, role } = validation.data!;

      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        reply.status(409);
        return { error: 'Email already registered' };
      }

      const id = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users (id, name, email, role, "passwordHash", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, name, email, role, "createdAt"`,
        [id, name, email.toLowerCase(), role, passwordHash]
      );

      const user = result.rows[0];
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

      const { email, password } = validation.data!;

      const result = await pool.query(
        'SELECT id, name, email, role, "passwordHash" FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        reply.status(401);
        return { error: 'Invalid credentials' };
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.passwordHash);

      if (!validPassword) {
        reply.status(401);
        return { error: 'Invalid credentials' };
      }

      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Login failed', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get current user (protected)
  fastify.get('/api/auth/me', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.user;
    const result = await pool.query(
      'SELECT id, name, email, role, "createdAt" FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return { error: 'User not found' };
    }

    return result.rows[0];
  });
};

export default authRoutes;
