import { FastifyPluginAsync } from 'fastify';
import { validateCampaignCreate, validateCampaignUpdate } from '../validators/campaign';
import { v4 as uuidv4 } from 'uuid';

const campaignRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
  const { cache: cacheService } = fastify.services;

  // List all campaigns (with optional filters)
  fastify.get('/api/campaigns', async (request, reply) => {
    try {
      const { clientId, platform, status } = request.query as {
        clientId?: string;
        platform?: string;
        status?: string;
      };

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
};

export default campaignRoutes;
