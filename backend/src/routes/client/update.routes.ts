import type { FastifyPluginAsync } from 'fastify';

import { validateClientUpdate } from '../../validators/client';

const updateClientRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
  const { clientAudit } = fastify.services;

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

      const existingResult = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);

      if (existingResult.rows.length === 0) {
        reply.status(404);
        return { error: 'Client not found' };
      }

      const existingClient = existingResult.rows[0];
      const updateData = request.body as any;

      if (updateData.email && updateData.email !== existingClient.email) {
        const emailCheck = await pool.query('SELECT id FROM clients WHERE email = $1 AND id != $2', [
          updateData.email.toLowerCase().trim(),
          id,
        ]);

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
          const { calculateTier } = await import('../../utils/validators');
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
          typeof updateData.metaAdAccountId === 'string' ? updateData.metaAdAccountId.trim().replace(/^act_/i, '') : updateData.metaAdAccountId;
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
};

export default updateClientRoutes;

