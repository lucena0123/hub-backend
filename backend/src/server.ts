/**
 * BPMN System - Backend API Server
 * Main entry point
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const PORT = parseInt(process.env.PORT || '3001');
const HOST = '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ============================================================================
// INSTÂNCIAS GLOBAIS
// ============================================================================

export const prisma = new PrismaClient({
  log: IS_PRODUCTION ? ['error'] : ['query', 'error', 'warn'],
});

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// ============================================================================
// FASTIFY SETUP
// ============================================================================

const fastify = Fastify({
  logger: {
    level: IS_PRODUCTION ? 'info' : 'debug',
    transport: IS_PRODUCTION
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
  },
});

// ============================================================================
// PLUGINS
// ============================================================================

// CORS
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

// Security Headers
fastify.register(helmet, {
  contentSecurityPolicy: false, // Desabilitar para desenvolvimento
});

// JWT Authentication
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'change-this-in-production-min-32-chars-long',
  sign: {
    expiresIn: '1h',
  },
});

// JWT Decorator para autenticação
fastify.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// ============================================================================
// ROUTES
// ============================================================================

// Health Check
fastify.get('/health', async (request, reply) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Test Redis connection
    const redisPing = await redis.ping();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisPing === 'PONG' ? 'connected' : 'disconnected',
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  } catch (error) {
    reply.status(503);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Root endpoint
fastify.get('/', async () => {
  return {
    name: 'BPMN System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      clients: '/api/clients',
      processes: '/api/processes',
      tasks: '/api/tasks',
      campaigns: '/api/campaigns',
      metrics: '/api/metrics',
    },
  };
});

// ============================================================================
// API ROUTES
// ============================================================================

// Clients
fastify.get('/api/clients', async (request, reply) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: {
            processes: true,
            campaigns: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return clients;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch clients',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

fastify.post('/api/clients', async (request, reply) => {
  try {
    const body = request.body as any;

    const client = await prisma.client.create({
      data: {
        name: body.name,
        email: body.email,
        tier: body.tier || 'standard',
        status: body.status || 'active',
        contractStart: new Date(body.contractStart),
        contractEnd: body.contractEnd ? new Date(body.contractEnd) : null,
        budget: body.budget,
      },
    });

    reply.status(201);
    return client;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to create client',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

fastify.get('/api/clients/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        processes: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
        campaigns: true,
        _count: {
          select: {
            processes: true,
            campaigns: true,
            metrics: true,
          },
        },
      },
    });

    if (!client) {
      reply.status(404);
      return { error: 'Client not found' };
    }

    return client;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch client',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Processes
fastify.get('/api/processes', async (request, reply) => {
  try {
    const processes = await prisma.processInstance.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            tier: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 50,
    });

    return processes;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch processes',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

fastify.get('/api/processes/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const process = await prisma.processInstance.findUnique({
      where: { id },
      include: {
        client: true,
        tasks: {
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    if (!process) {
      reply.status(404);
      return { error: 'Process not found' };
    }

    return process;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch process',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Tasks
fastify.get('/api/tasks', async (request, reply) => {
  try {
    const { status } = request.query as { status?: string };

    const tasks = await prisma.task.findMany({
      where: status ? { status } : undefined,
      include: {
        processInstance: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { startedAt: 'desc' }],
      take: 100,
    });

    return tasks;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch tasks',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Dashboard Stats
fastify.get('/api/dashboard/stats', async (request, reply) => {
  try {
    const [
      totalClients,
      activeClients,
      runningProcesses,
      pendingTasks,
      completedTasksToday,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'active' } }),
      prisma.processInstance.count({ where: { status: 'running' } }),
      prisma.task.count({ where: { status: 'pending' } }),
      prisma.task.count({
        where: {
          status: 'completed',
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalClients,
      activeClients,
      runningProcesses,
      pendingTasks,
      completedTasksToday,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  reply.status(error.statusCode || 500).send({
    error: error.name || 'Internal Server Error',
    message: error.message,
    statusCode: error.statusCode || 500,
  });
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const closeGracefully = async (signal: string) => {
  console.log(`\n⚠️  Received signal to terminate: ${signal}`);

  try {
    // Close Fastify server
    await fastify.close();
    console.log('✅ Fastify server closed');

    // Disconnect Prisma
    await prisma.$disconnect();
    console.log('✅ Database disconnected');

    // Close Redis
    await redis.quit();
    console.log('✅ Redis disconnected');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// ============================================================================
// START SERVER
// ============================================================================

const start = async () => {
  try {
    // Connect to Redis
    await redis.connect();
    console.log('✅ Redis connected');

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start Fastify server
    await fastify.listen({ port: PORT, host: HOST });

    console.log('\n🚀 BPMN System API is running!');
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${HOST}:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
