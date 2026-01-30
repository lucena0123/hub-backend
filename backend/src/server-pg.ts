/**
 * BPMN System - Backend API Server
 * Using node-postgres (pg) for database access
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createClient } from 'redis';
import { Pool } from 'pg';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// PostgreSQL Pool
const pool = new Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'bpmn_system',
  user: 'bpmn',
  password: 'dev123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis Client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Fastify Server
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

// ============================================================================
// ROUTES
// ============================================================================

// Health Check
fastify.get('/health', async (request, reply) => {
  try {
    // Test PostgreSQL
    const dbResult = await pool.query('SELECT 1 as test');
    const dbConnected = dbResult.rows[0].test === 1;

    // Test Redis
    const redisPing = await redis.ping();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
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
    status: 'running',
    database: 'PostgreSQL (native pg driver)',
    endpoints: {
      health: '/health',
      clients: '/api/clients',
      processes: '/api/processes',
      tasks: '/api/tasks',
      campaigns: '/api/campaigns',
      dashboard: '/api/dashboard/stats',
    },
  };
});

// Get all clients
fastify.get('/api/clients', async (request, reply) => {
  try {
    const result = await pool.query(`
      SELECT
        id, name, email, tier, status,
        budget, "contractStart", "contractEnd",
        "createdAt", "updatedAt"
      FROM clients
      ORDER BY "createdAt" DESC
    `);

    return result.rows;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch clients',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get client by ID
fastify.get('/api/clients/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const clientResult = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (clientResult.rows.length === 0) {
      reply.status(404);
      return { error: 'Client not found' };
    }

    const client = clientResult.rows[0];

    // Get related data
    const [campaignsResult, processesResult] = await Promise.all([
      pool.query('SELECT * FROM campaigns WHERE "clientId" = $1', [id]),
      pool.query(
        'SELECT * FROM process_instances WHERE "clientId" = $1 ORDER BY "startedAt" DESC LIMIT 10',
        [id]
      ),
    ]);

    return {
      ...client,
      campaigns: campaignsResult.rows,
      recentProcesses: processesResult.rows,
    };
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch client',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get all campaigns
fastify.get('/api/campaigns', async (request, reply) => {
  try {
    const result = await pool.query(`
      SELECT
        c.*,
        cl.name as "clientName",
        cl.tier as "clientTier"
      FROM campaigns c
      LEFT JOIN clients cl ON c."clientId" = cl.id
      ORDER BY c."createdAt" DESC
    `);

    return result.rows;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch campaigns',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get all processes
fastify.get('/api/processes', async (request, reply) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        c.name as "clientName",
        c.tier as "clientTier"
      FROM process_instances p
      LEFT JOIN clients c ON p."clientId" = c.id
      ORDER BY p."startedAt" DESC
      LIMIT 50
    `);

    return result.rows;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch processes',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get process by ID
fastify.get('/api/processes/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const processResult = await pool.query(
      `SELECT p.*, c.name as "clientName"
       FROM process_instances p
       LEFT JOIN clients c ON p."clientId" = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (processResult.rows.length === 0) {
      reply.status(404);
      return { error: 'Process not found' };
    }

    const process = processResult.rows[0];

    // Get tasks
    const tasksResult = await pool.query(
      'SELECT * FROM tasks WHERE "processInstanceId" = $1 ORDER BY "startedAt" ASC',
      [id]
    );

    return {
      ...process,
      tasks: tasksResult.rows,
    };
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch process',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get all tasks
fastify.get('/api/tasks', async (request, reply) => {
  try {
    const { status } = request.query as { status?: string };

    let query = `
      SELECT
        t.*,
        p."processId",
        c.name as "clientName"
      FROM tasks t
      LEFT JOIN process_instances p ON t."processInstanceId" = p.id
      LEFT JOIN clients c ON p."clientId" = c.id
    `;

    const params: string[] = [];

    if (status) {
      query += ' WHERE t.status = $1';
      params.push(status);
    }

    query += ' ORDER BY t.priority DESC, t."startedAt" DESC LIMIT 100';

    const result = await pool.query(query, params);

    return result.rows;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch tasks',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Dashboard stats
fastify.get('/api/dashboard/stats', async (request, reply) => {
  try {
    const [
      totalClientsResult,
      activeClientsResult,
      runningProcessesResult,
      pendingTasksResult,
      completedTodayResult,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM clients'),
      pool.query("SELECT COUNT(*) as count FROM clients WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) as count FROM process_instances WHERE status = 'running'"),
      pool.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'"),
      pool.query(`
        SELECT COUNT(*) as count FROM tasks
        WHERE status = 'completed'
        AND "completedAt" >= CURRENT_DATE
      `),
    ]);

    return {
      totalClients: parseInt(totalClientsResult.rows[0].count),
      activeClients: parseInt(activeClientsResult.rows[0].count),
      runningProcesses: parseInt(runningProcessesResult.rows[0].count),
      pendingTasks: parseInt(pendingTasksResult.rows[0].count),
      completedTasksToday: parseInt(completedTodayResult.rows[0].count),
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
    await fastify.close();
    console.log('✅ Fastify server closed');

    await pool.end();
    console.log('✅ PostgreSQL pool closed');

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
    // Test PostgreSQL connection
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected');

    // Connect to Redis
    await redis.connect();
    console.log('✅ Redis connected');

    // Start Fastify server
    await fastify.listen({ port: PORT, host: HOST });

    console.log('\n🚀 BPMN System API is running!');
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${HOST}:${PORT}`);
    console.log(`   Database: PostgreSQL (native pg driver)`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
