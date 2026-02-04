import { FastifyPluginAsync } from 'fastify';
import { validateClientCreate, validateClientUpdate, prepareClientData } from '../validators/client';
import { v4 as uuidv4 } from 'uuid';

const clientRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
  const { clientAudit, metrics: metricsService } = fastify.services;

  // Get all clients
  fastify.get('/api/clients', async (_request, reply) => {
    try {
      const result = await pool.query(`
        SELECT
          id, name, email, tier, status,
          budget, "contractStart", "contractEnd",
          "metaAdAccountId",
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
      const validation = validateClientCreate(request.body);

      if (!validation.valid) {
        reply.status(400);
        return {
          error: 'Validation failed',
          details: validation.errors,
        };
      }

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

      const clientData = prepareClientData(request.body as any);
      const clientId = uuidv4();

      const result = await pool.query(
        `INSERT INTO clients
         (id, name, email, tier, status, budget, "contractStart", "contractEnd", "metaAdAccountId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
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
          clientData.metaAdAccountId,
        ]
      );

      const newClient = result.rows[0];

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

      const validation = validateClientUpdate(request.body);

      if (!validation.valid) {
        reply.status(400);
        return {
          error: 'Validation failed',
          details: validation.errors,
        };
      }

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

        if (updateData.tier === undefined) {
          const { calculateTier } = await import('../utils/validators');
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
      if (updateData.metaAdAccountId !== undefined) {
        updates.push(`"metaAdAccountId" = $${paramIndex++}`);
        const normalized =
          typeof updateData.metaAdAccountId === 'string'
            ? updateData.metaAdAccountId.trim().replace(/^act_/i, '')
            : updateData.metaAdAccountId;
        values.push(normalized && typeof normalized === 'string' ? normalized : null);
      }

      if (updates.length === 0) {
        reply.status(400);
        return { error: 'No valid fields to update' };
      }

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

      const clientResult = await pool.query(
        'SELECT * FROM clients WHERE id = $1',
        [id]
      );

      if (clientResult.rows.length === 0) {
        reply.status(404);
        return { error: 'Client not found' };
      }

      const client = clientResult.rows[0];

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

      const result = await pool.query(
        `UPDATE clients
         SET status = 'inactive', "updatedAt" = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      const deletedClient = result.rows[0];

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
};

export default clientRoutes;
