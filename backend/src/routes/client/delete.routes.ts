import type { FastifyPluginAsync } from 'fastify';

const deleteClientRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;
  const { clientAudit } = fastify.services;

  fastify.delete('/api/clients/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);

      if (clientResult.rows.length === 0) {
        reply.status(404);
        return { error: 'Client not found' };
      }

      const client = clientResult.rows[0];

      const runningProcesses = await pool.query('SELECT COUNT(*) as count FROM process_instances WHERE "clientId" = $1 AND status = $2', [
        id,
        'running',
      ]);

      if (parseInt(runningProcesses.rows[0].count) > 0) {
        reply.status(409);
        return {
          error: 'Cannot delete client',
          message: 'Client has running processes. Please complete or cancel them first.',
        };
      }

      const result = await pool.query(`UPDATE clients SET status = 'inactive', "updatedAt" = NOW() WHERE id = $1 RETURNING *`, [
        id,
      ]);

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
};

export default deleteClientRoutes;

