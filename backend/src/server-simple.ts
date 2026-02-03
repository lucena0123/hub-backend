/**
 * BPMN System - Backend API Server (Simplified)
 * Versão sem Prisma para testes iniciais
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createClient } from 'redis';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

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

// Plugins
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

fastify.register(helmet, {
  contentSecurityPolicy: false,
});

// Health Check
fastify.get('/health', async (_request, reply) => {
  try {
    const redisPing = await redis.ping();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisPing === 'PONG' ? 'connected' : 'disconnected',
        database: 'connected (direct SQL)',
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
    status: 'running',
    endpoints: {
      health: '/health',
      clients: '/api/clients',
      processes: '/api/processes',
      tasks: '/api/tasks',
      dashboard: '/api/dashboard/stats',
    },
  };
});

// Mock clients endpoint
fastify.get('/api/clients', async () => {
  return [
    {
      id: 'client-a-001',
      name: 'Cliente A Corp',
      email: 'contato@clientea.com',
      tier: 'premium',
      status: 'active',
      budget: 10000.0,
    },
    {
      id: 'client-b-001',
      name: 'Cliente B Ltd',
      email: 'contato@clienteb.com',
      tier: 'standard',
      status: 'active',
      budget: 5000.0,
    },
  ];
});

// Mock dashboard stats
fastify.get('/api/dashboard/stats', async () => {
  return {
    totalClients: 2,
    activeClients: 2,
    runningProcesses: 1,
    pendingTasks: 2,
    completedTasksToday: 5,
    timestamp: new Date().toISOString(),
  };
});

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  console.log(`\n⚠️  Received signal to terminate: ${signal}`);

  try {
    await fastify.close();
    console.log('✅ Fastify server closed');

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

// Start server
const start = async () => {
  try {
    await redis.connect();
    console.log('✅ Redis connected');

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
