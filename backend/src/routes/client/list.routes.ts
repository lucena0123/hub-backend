import type { FastifyPluginAsync } from 'fastify';

const listClientsRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

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
};

export default listClientsRoutes;

