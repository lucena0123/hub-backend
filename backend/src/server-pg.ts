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
import { validateCampaignCreate, validateCampaignUpdate } from './validators/campaign';
import { validateBpmnInit, validateBpmnUpdate } from './validators/bpmn';
import { validateReportGenerate } from './validators/report';
import { validateMetricsImport, validateMetricUpsert } from './validators/metrics-import';
import { validateRegister, validateLogin } from './validators/auth';
import { validateMetaSync } from './validators/meta-sync';
import { ClientAudit } from './middleware/audit';
import { authenticate } from './middleware/auth';
import jwt from '@fastify/jwt';
import bcrypt from 'bcryptjs';
import { MetricsService } from './services/metrics-service';
import { BPMNTracker } from './services/bpmn-tracker';
import { ReportGenerator } from './services/report-generator';
import { DashboardService } from './services/dashboard-service';
import { CacheService } from './services/cache-service';
import { MetaAdsService } from './services/meta-ads-service';
import { SyncHistoryService } from './services/sync-history-service';
import { LeadTrackingService } from './services/lead-tracking-service';
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
const reportGenerator = new ReportGenerator(pool);
const dashboardService = new DashboardService(pool);
const syncHistoryService = new SyncHistoryService(pool);
const leadTrackingService = new LeadTrackingService(pool);
let cacheService: CacheService;

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

// JWT Authentication
const JWT_SECRET = process.env.JWT_SECRET || 'bpmn-system-dev-secret-change-in-production';
fastify.register(jwt, {
  secret: JWT_SECRET,
  sign: { expiresIn: '24h' },
});

// Type augmentation for Fastify JWT
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; name: string; role: string };
    user: { id: string; email: string; name: string; role: string };
  }
}

// ============================================================================
// AUTH ROUTES (public)
// ============================================================================

// Register new user
fastify.post('/api/auth/register', async (request, reply) => {
  try {
    const validation = validateRegister(request.body);
    if (!validation.valid) {
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const { name, email, password, role } = validation.data!;

    // Check if email exists
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

// Campaigns - see CAMPAIGNS CRUD ENDPOINTS section below

// ============================================================================
// CAMPAIGNS CRUD ENDPOINTS
// ============================================================================

// List all campaigns (with optional filters)
fastify.get('/api/campaigns', async (request, reply) => {
  try {
    const { clientId, platform, status } = request.query as {
      clientId?: string;
      platform?: string;
      status?: string;
    };

    // Try cache first
    const cacheKey = `campaigns:${clientId || 'all'}:${platform || 'all'}:${status || 'all'}`;
    if (cacheService) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    const conditions: string[] = [];
    const params: any[] = [];

    if (clientId) {
      params.push(clientId);
      conditions.push(`c."clientId" = $${params.length}`);
    }
    if (platform) {
      params.push(platform);
      conditions.push(`c.platform = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`c.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT
        c.*,
        cl.name as "clientName",
        COALESCE(
          (SELECT SUM(cm.spend) FROM campaign_metrics cm WHERE cm.campaign_id = c.id AND cm.date >= CURRENT_DATE - INTERVAL '30 days'),
          0
        ) as "recentSpend",
        COALESCE(
          (SELECT SUM(cm.conversions) FROM campaign_metrics cm WHERE cm.campaign_id = c.id AND cm.date >= CURRENT_DATE - INTERVAL '30 days'),
          0
        ) as "recentConversions",
        COALESCE(
          (SELECT ROUND(AVG(cm.roas), 2) FROM campaign_metrics cm WHERE cm.campaign_id = c.id AND cm.date >= CURRENT_DATE - INTERVAL '7 days'),
          0
        ) as "recentRoas"
      FROM campaigns c
      LEFT JOIN clients cl ON c."clientId" = cl.id
      ${whereClause}
      ORDER BY c."createdAt" DESC`,
      params
    );

    const data = result.rows;

    // Cache for 2 minutes
    if (cacheService) {
      await cacheService.set(cacheKey, data, 120);
    }

    return data;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch campaigns',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get single campaign by ID
fastify.get('/api/campaigns/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const result = await pool.query(
      `SELECT c.*, cl.name as "clientName"
       FROM campaigns c
       LEFT JOIN clients cl ON c."clientId" = cl.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      reply.status(404);
      return { error: 'Campaign not found' };
    }

    return result.rows[0];
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch campaign',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Create new campaign
fastify.post('/api/campaigns', async (request, reply) => {
  try {
    const validation = validateCampaignCreate(request.body);
    if (!validation.valid) {
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const body = validation.data!;

    // Verify client exists
    const clientCheck = await pool.query('SELECT id FROM clients WHERE id = $1', [body.clientId]);
    if (clientCheck.rows.length === 0) {
      reply.status(404);
      return { error: 'Client not found', message: 'The specified clientId does not exist' };
    }

    const id = uuidv4();
    const externalId = body.externalId || `manual-${id.slice(0, 8)}`;

    const result = await pool.query(
      `INSERT INTO campaigns (id, "clientId", name, platform, budget, spent, status, "externalId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7, NOW(), NOW())
       RETURNING *`,
      [id, body.clientId, body.name, body.platform, body.budget, body.status, externalId]
    );

    // Invalidate campaigns cache
    if (cacheService) {
      await cacheService.invalidatePattern('campaigns:*');
    }

    reply.status(201);
    return result.rows[0];
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to create campaign',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Update campaign
fastify.put('/api/campaigns/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const validation = validateCampaignUpdate(request.body);
    if (!validation.valid) {
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const body = validation.data!;

    const existing = await pool.query('SELECT id FROM campaigns WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      reply.status(404);
      return { error: 'Campaign not found' };
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(body.name);
    }
    if (body.platform !== undefined) {
      updates.push(`platform = $${paramIndex++}`);
      params.push(body.platform);
    }
    if (body.budget !== undefined) {
      updates.push(`budget = $${paramIndex++}`);
      params.push(body.budget);
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(body.status);
    }
    if (body.spent !== undefined) {
      updates.push(`spent = $${paramIndex++}`);
      params.push(body.spent);
    }

    updates.push(`"updatedAt" = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE campaigns SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (cacheService) {
      await cacheService.invalidatePattern('campaigns:*');
    }

    return result.rows[0];
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to update campaign',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Delete campaign
fastify.delete('/api/campaigns/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const existing = await pool.query('SELECT id, name FROM campaigns WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      reply.status(404);
      return { error: 'Campaign not found' };
    }

    await pool.query('DELETE FROM campaigns WHERE id = $1', [id]);

    if (cacheService) {
      await cacheService.invalidatePattern('campaigns:*');
    }

    return { success: true, message: `Campaign "${existing.rows[0].name}" deleted` };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to delete campaign',
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
// META ADS SYNC ENDPOINTS
// ============================================================================

const syncMetaAdsHandler = async (request: any, reply: any) => {
  const startTime = Date.now();
  let syncId: string | null = null;

  try {
    // Validate request body
    const validation = validateMetaSync(request.body);
    if (!validation.valid) {
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const body = validation.data!;

    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = body.accountId || process.env.META_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      reply.status(400);
      return {
        error: 'Missing Meta Ads credentials',
        message: 'Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID environment variables',
      };
    }

    // Resolve date range with defaults (last 7 days)
    const resolveDateRange = (since?: string, until?: string) => {
      if (since && until) {
        return { since, until };
      }
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      return {
        since: start.toISOString().split('T')[0],
        until: end.toISOString().split('T')[0],
      };
    };

    const { since, until } = resolveDateRange(body.since, body.until);

    // Create sync history record
    syncId = await syncHistoryService.createSyncRecord({
      platform: 'meta',
      accountId: adAccountId,
      dateRangeStart: since,
      dateRangeEnd: until,
      dryRun: body.dryRun,
      triggeredBy: 'manual',
    });

    fastify.log.info({ since, until, accountId: adAccountId, dryRun: body.dryRun, syncId }, 'Starting Meta Ads sync');

    const metaService = new MetaAdsService({
      accessToken,
      adAccountId,
      apiVersion: process.env.META_API_VERSION,
    });

    const insights = await metaService.fetchCampaignInsights({ since, until });

    fastify.log.info({ insightsCount: insights.length }, 'Fetched insights from Meta API');

    if (insights.length === 0) {
      const duration = Date.now() - startTime;
      fastify.log.info({ duration }, 'Meta sync completed - no insights found');
      return {
        success: true,
        message: 'No insights returned for the selected period',
        totalInsights: 0,
        mapped: 0,
        unmapped: 0,
        since,
        until,
        duration,
      };
    }

    const campaignsResult = await pool.query(
      'SELECT id, "externalId" FROM campaigns WHERE platform = $1',
      ['meta']
    );
    const campaignMap = new Map<string, string>(
      campaignsResult.rows.map((row) => [row.externalId, row.id])
    );

    const parseNumber = (value?: string) => (value ? Number(value) : 0);
    const sumActions = (rows: Array<{ action_type: string; value: string }> | undefined, types: string[]) => {
      if (!rows) return 0;
      return rows
        .filter((row) => types.includes(row.action_type))
        .reduce((sum, row) => sum + parseNumber(row.value), 0);
    };

    const purchaseTypes = [
      'purchase',
      'offsite_conversion.purchase',
      'omni_purchase',
      'onsite_conversion.purchase',
      'web_purchase',
      'mobile_purchase',
    ];
    const leadTypes = ['lead', 'leadgen', 'omni_lead'];
    const messagingConversationTypes = [
      'onsite_conversion.messaging_conversation_started_7d',
      'messaging_conversation_started_7d',
    ];
    const messagingReplyTypes = [
      'onsite_conversion.messaging_first_reply',
      'messaging_first_reply',
    ];
    const linkClickTypes = ['link_click'];
    const landingPageViewTypes = ['landing_page_view'];

    const mappedMetrics: Array<{
      campaignId: string;
      date: string;
      impressions: number;
      clicks: number;
      spend: number;
      conversions: number;
      revenue: number;
      leads: number;
      messagingConversations: number;
      messagingFirstReply: number;
      linkClicks: number;
      landingPageViews: number;
    }> = [];
    const unmapped = new Set<string>();

    for (const row of insights) {
      const campaignId = campaignMap.get(row.campaign_id);
      if (!campaignId) {
        unmapped.add(row.campaign_id);
        continue;
      }

      const impressions = Math.round(parseNumber(row.impressions));
      const clicks = Math.round(parseNumber(row.clicks));
      const spend = parseNumber(row.spend);
      const purchases = sumActions(row.actions, purchaseTypes);
      const leads = sumActions(row.actions, leadTypes);
      const messagingConversations = sumActions(row.actions, messagingConversationTypes);
      const messagingFirstReply = sumActions(row.actions, messagingReplyTypes);
      const linkClicks = sumActions(row.actions, linkClickTypes);
      const landingPageViews = sumActions(row.actions, landingPageViewTypes);
      const revenue = sumActions(row.action_values, purchaseTypes);

      // For lead gen campaigns, use messaging_conversations as primary conversion metric
      const conversions = purchases > 0 ? purchases : (messagingConversations > 0 ? messagingConversations : leads);

      mappedMetrics.push({
        campaignId,
        date: row.date_start,
        impressions,
        clicks,
        spend,
        conversions,
        revenue,
        leads,
        messagingConversations,
        messagingFirstReply,
        linkClicks,
        landingPageViews,
      });
    }

    if (body.dryRun) {
      const duration = Date.now() - startTime;

      // Save dry-run to sync history
      if (syncId) {
        await syncHistoryService.completeSyncSuccess(syncId, {
          totalInsights: insights.length,
          mappedCampaigns: mappedMetrics.length,
          updatedMetrics: 0, // Dry-run doesn't update
          unmappedCampaigns: Array.from(unmapped),
          durationMs: duration,
        });
      }

      fastify.log.info({
        syncId,
        totalInsights: insights.length,
        mapped: mappedMetrics.length,
        unmapped: unmapped.size,
        duration
      }, 'Meta sync dry-run completed');
      return {
        success: true,
        dryRun: true,
        syncId,
        totalInsights: insights.length,
        mapped: mappedMetrics.length,
        unmapped: Array.from(unmapped),
        since,
        until,
        duration,
      };
    }

    // Batch insert - build VALUES clause for all metrics
    let updated = 0;
    if (mappedMetrics.length > 0) {
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      for (const entry of mappedMetrics) {
        const ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0;
        const cpc = entry.clicks > 0 ? entry.spend / entry.clicks : 0;
        const cpl = entry.leads > 0 ? entry.spend / entry.leads : 0;
        const cpa = entry.conversions > 0 ? entry.spend / entry.conversions : 0;
        const roas = entry.spend > 0 ? entry.revenue / entry.spend : 0;

        const rowPlaceholders: string[] = [];
        for (let i = 0; i < 19; i++) {
          rowPlaceholders.push(`$${paramIndex++}`);
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`);

        values.push(
          uuidv4(),
          entry.campaignId,
          entry.date,
          entry.impressions,
          entry.clicks,
          entry.spend,
          entry.conversions,
          entry.revenue,
          entry.leads,
          ctr,
          cpc,
          cpl,
          cpa,
          roas,
          'meta',
          entry.messagingConversations,
          entry.messagingFirstReply,
          entry.linkClicks,
          entry.landingPageViews
        );
      }

      const result = await pool.query(
        `INSERT INTO campaign_metrics
         (id, campaign_id, date, impressions, clicks, spend, conversions, revenue, leads, ctr, cpc, cpl, cpa, roas, platform, messaging_conversations, messaging_first_reply, link_clicks, landing_page_views)
         VALUES ${placeholders.join(', ')}
         ON CONFLICT (campaign_id, date, platform)
         DO UPDATE SET
           impressions = EXCLUDED.impressions,
           clicks = EXCLUDED.clicks,
           spend = EXCLUDED.spend,
           conversions = EXCLUDED.conversions,
           revenue = EXCLUDED.revenue,
           leads = EXCLUDED.leads,
           ctr = EXCLUDED.ctr,
           cpc = EXCLUDED.cpc,
           cpl = EXCLUDED.cpl,
           cpa = EXCLUDED.cpa,
           roas = EXCLUDED.roas,
           messaging_conversations = EXCLUDED.messaging_conversations,
           messaging_first_reply = EXCLUDED.messaging_first_reply,
           link_clicks = EXCLUDED.link_clicks,
           landing_page_views = EXCLUDED.landing_page_views`,
        values
      );
      updated = result.rowCount || mappedMetrics.length;
    }

    if (cacheService) {
      await cacheService.invalidatePattern('dashboard:*');
      await cacheService.invalidatePattern('campaigns:*');
    }

    const duration = Date.now() - startTime;

    // Save sync history
    if (syncId) {
      await syncHistoryService.completeSyncSuccess(syncId, {
        totalInsights: insights.length,
        mappedCampaigns: mappedMetrics.length,
        updatedMetrics: updated,
        unmappedCampaigns: Array.from(unmapped),
        durationMs: duration,
      });
    }

    fastify.log.info({
      syncId,
      totalInsights: insights.length,
      mapped: mappedMetrics.length,
      updated,
      unmapped: unmapped.size,
      duration
    }, 'Meta sync completed successfully');

    return {
      success: true,
      syncId,
      totalInsights: insights.length,
      mapped: mappedMetrics.length,
      updated,
      unmapped: Array.from(unmapped),
      since,
      until,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Save failure to sync history
    if (syncId && error instanceof Error) {
      await syncHistoryService.completeSyncFailure(syncId, error, duration);
    }

    fastify.log.error({
      syncId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration
    }, 'Meta sync failed');

    reply.status(500);
    return {
      error: 'Failed to sync Meta Ads metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration,
    };
  }
};

fastify.post('/api/metrics/sync/meta', syncMetaAdsHandler);
fastify.post('/api/metrics/sync', syncMetaAdsHandler);

// Get sync history
fastify.get('/api/metrics/sync/history', async (request, reply) => {
  try {
    const { platform, accountId, limit, offset } = request.query as {
      platform?: string;
      accountId?: string;
      limit?: string;
      offset?: string;
    };

    const history = await syncHistoryService.getSyncHistory({
      platform: platform || 'meta',
      accountId,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });

    // Get last successful sync timestamp
    const lastSuccess = await syncHistoryService.getLastSuccessfulSync(
      platform || 'meta',
      accountId
    );

    return {
      history,
      lastSuccessfulSync: lastSuccess,
      total: history.length,
    };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch sync history',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get single sync details
fastify.get('/api/metrics/sync/history/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const result = await pool.query(
      `SELECT
         id, platform, account_id as "accountId",
         date_range_start as "dateRangeStart",
         date_range_end as "dateRangeEnd",
         status, total_insights as "totalInsights",
         mapped_campaigns as "mappedCampaigns",
         updated_metrics as "updatedMetrics",
         unmapped_campaigns as "unmappedCampaigns",
         duration_ms as "durationMs",
         started_at as "startedAt",
         completed_at as "completedAt",
         error_message as "errorMessage",
         error_stack as "errorStack",
         dry_run as "dryRun",
         triggered_by as "triggeredBy"
       FROM sync_history
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      reply.status(404);
      return { error: 'Sync record not found' };
    }

    return result.rows[0];
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch sync details',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// ============================================================================
// METRICS IMPORT ENDPOINTS
// ============================================================================

// Import metrics in batch (for manual data entry or CSV import)
fastify.post('/api/metrics/import', async (request, reply) => {
  try {
    const validation = validateMetricsImport(request.body);
    if (!validation.valid) {
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const { metrics, overwrite } = validation.data!;

    // Verify all campaign IDs exist and get their platforms
    const campaignIds = [...new Set(metrics.map(m => m.campaignId))];
    const campaignCheck = await pool.query(
      `SELECT id, platform FROM campaigns WHERE id = ANY($1)`,
      [campaignIds]
    );
    const campaignMap = new Map(campaignCheck.rows.map(r => [r.id, r.platform]));
    const missingIds = campaignIds.filter(id => !campaignMap.has(id));

    if (missingIds.length > 0) {
      reply.status(400);
      return {
        error: 'Invalid campaign IDs',
        message: `Campaign(s) not found: ${missingIds.join(', ')}`,
      };
    }

    let imported = 0;
    let skipped = 0;
    let updated = 0;

    for (const entry of metrics) {
      const platform = campaignMap.get(entry.campaignId) || 'other';

      // Calculate derived metrics
      const ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0;
      const cpc = entry.clicks > 0 ? entry.spend / entry.clicks : 0;
      const cpl = entry.leads > 0 ? entry.spend / entry.leads : 0;
      const cpa = entry.conversions > 0 ? entry.spend / entry.conversions : 0;
      const roas = entry.spend > 0 ? entry.revenue / entry.spend : 0;

      if (overwrite) {
        // Upsert: insert or update on conflict
        await pool.query(
          `INSERT INTO campaign_metrics
           (id, campaign_id, date, impressions, clicks, spend, conversions, revenue, leads, ctr, cpc, cpl, cpa, roas, platform)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (campaign_id, date, platform)
           DO UPDATE SET
             impressions = EXCLUDED.impressions,
             clicks = EXCLUDED.clicks,
             spend = EXCLUDED.spend,
             conversions = EXCLUDED.conversions,
             revenue = EXCLUDED.revenue,
             leads = EXCLUDED.leads,
             ctr = EXCLUDED.ctr,
             cpc = EXCLUDED.cpc,
             cpl = EXCLUDED.cpl,
             cpa = EXCLUDED.cpa,
             roas = EXCLUDED.roas`,
          [uuidv4(), entry.campaignId, entry.date, entry.impressions, entry.clicks,
           entry.spend, entry.conversions, entry.revenue, entry.leads,
           ctr, cpc, cpl, cpa, roas, platform]
        );
        updated++;
      } else {
        // Insert only, skip on conflict
        const result = await pool.query(
          `INSERT INTO campaign_metrics
           (id, campaign_id, date, impressions, clicks, spend, conversions, revenue, leads, ctr, cpc, cpl, cpa, roas, platform)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (campaign_id, date, platform) DO NOTHING`,
          [uuidv4(), entry.campaignId, entry.date, entry.impressions, entry.clicks,
           entry.spend, entry.conversions, entry.revenue, entry.leads,
           ctr, cpc, cpl, cpa, roas, platform]
        );
        if (result.rowCount && result.rowCount > 0) {
          imported++;
        } else {
          skipped++;
        }
      }
    }

    // Invalidate dashboard cache after import
    if (cacheService) {
      await cacheService.invalidatePattern('dashboard:*');
      await cacheService.invalidatePattern('campaigns:*');
    }

    reply.status(201);
    return {
      success: true,
      total: metrics.length,
      imported,
      updated,
      skipped,
      message: overwrite
        ? `${updated} metrics imported/updated`
        : `${imported} new metrics imported, ${skipped} duplicates skipped`,
    };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to import metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Add single metric entry
fastify.post('/api/metrics/entry', async (request, reply) => {
  try {
    const validation = validateMetricUpsert(request.body);
    if (!validation.valid) {
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const entry = validation.data!;

    // Verify campaign exists and get platform
    const campaignCheck = await pool.query('SELECT id, platform FROM campaigns WHERE id = $1', [entry.campaignId]);
    if (campaignCheck.rows.length === 0) {
      reply.status(404);
      return { error: 'Campaign not found' };
    }

    const platform = campaignCheck.rows[0].platform || 'other';
    const ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0;
    const cpc = entry.clicks > 0 ? entry.spend / entry.clicks : 0;
    const cpl = entry.leads > 0 ? entry.spend / entry.leads : 0;
    const cpa = entry.conversions > 0 ? entry.spend / entry.conversions : 0;
    const roas = entry.spend > 0 ? entry.revenue / entry.spend : 0;

    const result = await pool.query(
      `INSERT INTO campaign_metrics
       (id, campaign_id, date, impressions, clicks, spend, conversions, revenue, leads, ctr, cpc, cpl, cpa, roas, platform)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (campaign_id, date, platform)
       DO UPDATE SET
         impressions = EXCLUDED.impressions,
         clicks = EXCLUDED.clicks,
         spend = EXCLUDED.spend,
         conversions = EXCLUDED.conversions,
         revenue = EXCLUDED.revenue,
         leads = EXCLUDED.leads,
         ctr = EXCLUDED.ctr,
         cpc = EXCLUDED.cpc,
         cpl = EXCLUDED.cpl,
         cpa = EXCLUDED.cpa,
         roas = EXCLUDED.roas
       RETURNING *`,
      [uuidv4(), entry.campaignId, entry.date, entry.impressions, entry.clicks,
       entry.spend, entry.conversions, entry.revenue, entry.leads,
       ctr, cpc, cpl, cpa, roas, platform]
    );

    if (cacheService) {
      await cacheService.invalidatePattern('dashboard:*');
    }

    reply.status(201);
    return result.rows[0];
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to save metric',
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

    const validation = validateBpmnInit(request.body);
    if (!validation.valid) {
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const { startingSubprocess } = validation.data!;
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

    const validation = validateBpmnUpdate(request.body);
    if (!validation.valid) {
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const updates = validation.data!;
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

// ========================================
// DASHBOARD & ALERTS ENDPOINTS
// ========================================

// Dashboard overview - consolidated data for main page
fastify.get('/api/dashboard/overview', async (request, reply) => {
  try {
    // Cache for 60 seconds (dashboard refreshes frequently)
    if (cacheService) {
      const cached = await cacheService.get('dashboard:overview');
      if (cached) return cached;
    }

    const overview = await dashboardService.getOverview();

    if (cacheService) {
      await cacheService.set('dashboard:overview', overview, 60);
    }

    return overview;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch dashboard overview',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Performance alerts - check all campaigns for issues
fastify.get('/api/alerts', async (request, reply) => {
  try {
    const alerts = await dashboardService.getPerformanceAlerts();
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.type === 'critical').length,
      warning: alerts.filter(a => a.type === 'warning').length,
      alerts,
    };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch alerts',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// ========================================
// REPORTS ENDPOINTS
// ========================================

// Generate monthly report for a client
fastify.post('/api/reports/generate/:clientId', async (request, reply) => {
  try {
    const { clientId } = request.params as { clientId: string };

    const validation = validateReportGenerate(request.body);
    if (!validation.valid) {
      reply.status(400);
      return { error: 'Validation failed', details: validation.errors };
    }

    const { month, year } = validation.data!;

    // Verify client exists
    const clientCheck = await pool.query('SELECT id FROM clients WHERE id = $1', [clientId]);
    if (clientCheck.rows.length === 0) {
      reply.status(404);
      return { error: 'Client not found' };
    }

    const report = await reportGenerator.generateMonthlyReport(clientId, month, year);

    reply.status(201);
    return report;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to generate report',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get report history for a client
fastify.get('/api/reports/:clientId/history', async (request, reply) => {
  try {
    const { clientId } = request.params as { clientId: string };

    const reports = await reportGenerator.getReportHistory(clientId);

    return reports;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to fetch report history',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Download a specific report PDF
fastify.get('/api/reports/:reportId/download', async (request, reply) => {
  try {
    const { reportId } = request.params as { reportId: string };

    const report = await reportGenerator.getReportById(reportId);

    if (!report) {
      reply.status(404);
      return {
        error: 'Report not found',
        message: 'No report found with the given ID',
      };
    }

    if (!report.filePath) {
      reply.status(404);
      return {
        error: 'File not found',
        message: 'PDF file not available for this report',
      };
    }

    // Send PDF file
    reply.type('application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${report.title}.pdf"`);

    const fs = require('fs');
    const stream = fs.createReadStream(report.filePath);

    return reply.send(stream);
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return {
      error: 'Failed to download report',
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

// ============================================================================
// META ADS DISCOVERY ENDPOINTS
// ============================================================================

// Test Meta API connection
fastify.get('/api/meta/test', async (request, reply) => {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!accessToken) {
      reply.status(400);
      return { error: 'META_ACCESS_TOKEN not configured in .env' };
    }

    // Test with a simple "me" endpoint
    const testUrl = 'https://graph.facebook.com/v20.0/me?fields=id,name';
    const response = await fetch(testUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const data = await response.json() as any;

    if (!response.ok) {
      reply.status(response.status);
      return {
        error: 'Meta API connection failed',
        message: data.error?.message || 'Unknown error',
        code: data.error?.code,
      };
    }

    return {
      success: true,
      message: 'Meta API connection successful',
      user: data,
    };
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to test Meta API',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// List all ad accounts accessible by the user
fastify.get('/api/meta/accounts', async (request, reply) => {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!accessToken) {
      reply.status(400);
      return { error: 'META_ACCESS_TOKEN not configured in .env' };
    }

    const metaService = new MetaAdsService({
      accessToken,
      adAccountId: '0', // Not needed for this call
    });

    const accounts = await metaService.fetchAdAccounts();

    return {
      total: accounts.length,
      accounts: accounts.map(acc => ({
        id: acc.id,
        accountId: acc.account_id,
        name: acc.name,
        status: acc.account_status,
        currency: acc.currency,
        timezone: acc.timezone_name,
        businessName: acc.business_name,
        amountSpent: acc.amount_spent,
        spendCap: acc.spend_cap,
      })),
    };
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch Meta ad accounts',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get specific ad account details
fastify.get<{ Params: { accountId: string } }>(
  '/api/meta/accounts/:accountId/info',
  async (request, reply) => {
    try {
      const { accountId } = request.params;
      const accessToken = process.env.META_ACCESS_TOKEN;

      if (!accessToken) {
        reply.status(400);
        return { error: 'META_ACCESS_TOKEN not configured in .env' };
      }

      const metaService = new MetaAdsService({
        accessToken,
        adAccountId: accountId,
      });

      const accountInfo = await metaService.fetchAdAccountDetails();

      return {
        id: accountInfo.id,
        accountId: accountInfo.account_id,
        name: accountInfo.name,
        status: accountInfo.account_status,
        currency: accountInfo.currency,
        timezone: accountInfo.timezone_name,
        businessName: accountInfo.business_name,
        amountSpent: accountInfo.amount_spent,
        spendCap: accountInfo.spend_cap,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch ad account details',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

// List campaigns for a specific ad account
fastify.get<{ Params: { accountId: string } }>(
  '/api/meta/accounts/:accountId/campaigns',
  async (request, reply) => {
    try {
      const { accountId } = request.params;
      const accessToken = process.env.META_ACCESS_TOKEN;

      if (!accessToken) {
        reply.status(400);
        return { error: 'META_ACCESS_TOKEN not configured in .env' };
      }

      const metaService = new MetaAdsService({
        accessToken,
        adAccountId: accountId,
      });

      const campaigns = await metaService.fetchCampaigns();

      return {
        accountId,
        total: campaigns.length,
        campaigns: campaigns.map(camp => ({
          id: camp.id,
          name: camp.name,
          status: camp.status,
          objective: camp.objective,
          dailyBudget: camp.daily_budget,
          lifetimeBudget: camp.lifetime_budget,
          createdTime: camp.created_time,
          updatedTime: camp.updated_time,
        })),
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch campaigns',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

// ============================================================================
// LEAD TRACKING ENDPOINTS (Manual funnel data for service businesses)
// ============================================================================

// Upsert lead tracking data for a campaign
fastify.post<{
  Body: {
    campaignId: string;
    date: string;
    qualifiedLeads?: number;
    contractsClosed?: number;
    averageTicket?: number;
    revenueGenerated?: number;
    leadsResponded?: number;
    responseTimeHours?: number;
    notes?: string;
  };
}>('/api/lead-tracking', async (request, reply) => {
  try {
    const result = await leadTrackingService.upsertLeadTracking(request.body);

    // Invalidate dashboard cache
    if (cacheService) {
      await cacheService.invalidatePattern('dashboard:*');
      await cacheService.invalidatePattern(`campaigns:${request.body.campaignId}:*`);
    }

    return result;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to save lead tracking data',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get lead tracking data for a campaign
fastify.get<{
  Params: { campaignId: string };
  Querystring: {
    startDate?: string;
    endDate?: string;
    limit?: string;
    offset?: string;
  };
}>('/api/campaigns/:campaignId/lead-tracking', async (request, reply) => {
  try {
    const { campaignId } = request.params;
    const { startDate, endDate, limit, offset } = request.query;

    const result = await leadTrackingService.getLeadTracking(campaignId, {
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return result;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch lead tracking data',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get lead tracking summary for a campaign (period aggregation)
fastify.get<{
  Params: { campaignId: string };
  Querystring: {
    startDate: string;
    endDate: string;
  };
}>('/api/campaigns/:campaignId/lead-summary', async (request, reply) => {
  try {
    const { campaignId } = request.params;
    const { startDate, endDate } = request.query;

    if (!startDate || !endDate) {
      reply.status(400);
      return { error: 'startDate and endDate are required' };
    }

    const summary = await leadTrackingService.getLeadTrackingSummary(
      campaignId,
      startDate,
      endDate
    );

    return summary;
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to fetch lead summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Delete lead tracking record
fastify.delete<{
  Params: { campaignId: string };
  Querystring: { date: string };
}>('/api/campaigns/:campaignId/lead-tracking', async (request, reply) => {
  try {
    const { campaignId } = request.params;
    const { date } = request.query;

    if (!date) {
      reply.status(400);
      return { error: 'date query parameter is required' };
    }

    const deleted = await leadTrackingService.deleteLeadTracking(campaignId, date);

    if (!deleted) {
      reply.status(404);
      return { error: 'Lead tracking record not found' };
    }

    // Invalidate cache
    if (cacheService) {
      await cacheService.invalidatePattern('dashboard:*');
      await cacheService.invalidatePattern(`campaigns:${campaignId}:*`);
    }

    return { success: true, message: 'Lead tracking record deleted' };
  } catch (error) {
    reply.status(500);
    return {
      error: 'Failed to delete lead tracking record',
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
    cacheService = new CacheService(redis as any);
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
