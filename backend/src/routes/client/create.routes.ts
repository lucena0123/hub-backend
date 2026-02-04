import type { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

import { prepareClientData, validateClientCreate } from '../../validators/client';

const createClientRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
  const { clientAudit } = fastify.services;

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

      const existingClient = await pool.query('SELECT id FROM clients WHERE email = $1', [
        (request.body as any).email.toLowerCase().trim(),
      ]);

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
};

export default createClientRoutes;

