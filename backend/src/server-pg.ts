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
import { validateClientCreate, validateClientUpdate, prepareClientData } from './validators/client';
import { ClientAudit } from './middleware/audit';
import { MetricsService } from './services/metrics-service';
import { BPMNTracker } from './services/bpmn-tracker';
import { v4 as uuidv4 } from 'uuid';

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

// Services
const clientAudit = new ClientAudit(pool);
const metricsService = new MetricsService(pool);
const bpmnTracker = new BPMNTracker(pool);

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

// Create new client
fastify.post('/api/clients', async (request, reply) => {
  try {
    // Validate request body
    const validation = validateClientCreate(request.body);

    if (!validation.valid) {
      reply.status(400);
      return {
        error: 'Validation failed',
        details: validation.errors,
      };
    }

    // Check if email already exists
    const existingClient = await pool.query(
      'SELECT id FROM clients WHERE email = $1',
      [(request.body as any).email.toLowerCase().trim()]
    );

    if (existingClient.rows.length > 0) {
      reply.status(409);
      return {
        error: 'Email already exists',
        message: 'A client with this email already exists',
      };
    }

    // Prepare data for insertion
    const clientData = prepareClientData(request.body as any);
    const clientId = uuidv4();

    // Insert into database
    const result = await pool.query(
      `INSERT INTO clients
       (id, name, email, tier, status, budget, "contractStart", "contractEnd", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        clientId,
        clientData.name,
        clientData.email,
        clientData.tier,
        clientData.status,
        clientData.budget,
        clientData.contractStart,
        clientData.contractEnd,
      ]
    );

    const newClient = result.rows[0];

    // Log audit trail
    await clientAudit.logCreate(clientId, newClient);

    reply.status(201);
    return newClient;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to create client',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Update client
fastify.put('/api/clients/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    // Validate request body
    const validation = validateClientUpdate(request.body);

    if (!validation.valid) {
      reply.status(400);
      return {
        error: 'Validation failed',
        details: validation.errors,
      };
    }

    // Get existing client
    const existingResult = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      reply.status(404);
      return { error: 'Client not found' };
    }

    const existingClient = existingResult.rows[0];
    const updateData = request.body as any;

    // Check if email is being changed and if new email exists
    if (updateData.email && updateData.email !== existingClient.email) {
      const emailCheck = await pool.query(
        'SELECT id FROM clients WHERE email = $1 AND id != $2',
        [updateData.email.toLowerCase().trim(), id]
      );

      if (emailCheck.rows.length > 0) {
        reply.status(409);
        return {
          error: 'Email already exists',
          message: 'Another client with this email already exists',
        };
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(updateData.name.trim());
    }
    if (updateData.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(updateData.email.toLowerCase().trim());
    }
    if (updateData.tier !== undefined) {
      updates.push(`tier = $${paramIndex++}`);
      values.push(updateData.tier);
    }
    if (updateData.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }
    if (updateData.budget !== undefined) {
      updates.push(`budget = $${paramIndex++}`);
      values.push(updateData.budget);

      // Auto-update tier based on new budget if tier not explicitly provided
      if (updateData.tier === undefined) {
        const { calculateTier } = await import('./utils/validators');
        const newTier = calculateTier(updateData.budget);
        updates.push(`tier = $${paramIndex++}`);
        values.push(newTier);
      }
    }
    if (updateData.contractStart !== undefined) {
      updates.push(`"contractStart" = $${paramIndex++}`);
      values.push(updateData.contractStart);
    }
    if (updateData.contractEnd !== undefined) {
      updates.push(`"contractEnd" = $${paramIndex++}`);
      values.push(updateData.contractEnd);
    }

    if (updates.length === 0) {
      reply.status(400);
      return { error: 'No valid fields to update' };
    }

    // Always update updatedAt
    updates.push(`"updatedAt" = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE clients
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    const updatedClient = result.rows[0];

    // Log audit trail
    await clientAudit.logUpdate(id, existingClient, updatedClient);

    return updatedClient;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to update client',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Delete client (soft delete)
fastify.delete('/api/clients/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    // Get existing client
    const clientResult = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (clientResult.rows.length === 0) {
      reply.status(404);
      return { error: 'Client not found' };
    }

    const client = clientResult.rows[0];

    // Check if client has running processes
    const runningProcesses = await pool.query(
      'SELECT COUNT(*) as count FROM process_instances WHERE "clientId" = $1 AND status = $2',
      [id, 'running']
    );

    if (parseInt(runningProcesses.rows[0].count) > 0) {
      reply.status(409);
      return {
        error: 'Cannot delete client',
        message: 'Client has running processes. Please complete or cancel them first.',
      };
    }

    // Soft delete - set status to inactive
    const result = await pool.query(
      `UPDATE clients
       SET status = 'inactive', "updatedAt" = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    const deletedClient = result.rows[0];

    // Log audit trail
    await clientAudit.logDelete(id, client);

    return {
      message: 'Client deleted successfully',
      client: deletedClient,
    };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to delete client',
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

// ============================================================================
// METRICS ENDPOINTS
// ============================================================================

// Get campaign metrics
fastify.get('/api/campaigns/:id/metrics', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { period, startDate, endDate, platform } = request.query as any;

    const metrics = await metricsService.getCampaignMetrics(id, {
      period,
      startDate,
      endDate,
      platform,
    });

    return metrics;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch campaign metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get campaign performance summary
fastify.get('/api/campaigns/:id/performance-summary', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { period, startDate, endDate } = request.query as any;

    const summary = await metricsService.getPerformanceSummary(id, {
      period,
      startDate,
      endDate,
    });

    return summary;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch performance summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get client performance summary (all campaigns)
fastify.get('/api/clients/:id/performance-summary', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { period, startDate, endDate } = request.query as any;

    const summary = await metricsService.getClientPerformanceSummary(id, {
      period,
      startDate,
      endDate,
    });

    return summary;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch client performance summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// ============================================================================
// BPMN TRACKING ENDPOINTS
// ============================================================================

// Get client BPMN progress
fastify.get('/api/clients/:id/bpmn-progress', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const progress = await bpmnTracker.getProgress(id);

    if (!progress) {
      reply.status(404);
      return { error: 'BPMN progress not found for this client' };
    }

    return progress;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch BPMN progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Initialize BPMN tracking for client
fastify.post('/api/clients/:id/bpmn-progress', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { startingSubprocess } = request.body as any;

    const progress = await bpmnTracker.initializeProgress(id, startingSubprocess);

    reply.status(201);
    return progress;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to initialize BPMN progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Update client BPMN progress
fastify.put('/api/clients/:id/bpmn-progress', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const updates = request.body as any;

    const progress = await bpmnTracker.updateProgress(id, updates);

    return progress;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to update BPMN progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get all clients in a specific subprocess
fastify.get('/api/bpmn/subprocess/:id/clients', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const clients = await bpmnTracker.getClientsInSubprocess(id);

    return clients;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch clients in subprocess',
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
