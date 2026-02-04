import type { FastifyPluginAsync } from 'fastify';

const clientDetailRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  fastify.get('/api/clients/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);

      if (clientResult.rows.length === 0) {
        reply.status(404);
        return { error: 'Client not found' };
      }

      const client = clientResult.rows[0];

      const [campaignsResult, processesResult] = await Promise.all([
        pool.query('SELECT * FROM campaigns WHERE "clientId" = $1', [id]),
        pool.query('SELECT * FROM process_instances WHERE "clientId" = $1 ORDER BY "startedAt" DESC LIMIT 10', [id]),
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
};

export default clientDetailRoutes;

