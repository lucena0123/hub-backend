import { FastifyPluginAsync } from 'fastify';

const processRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  // Get all processes
  fastify.get('/api/processes', async (_request, reply) => {
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
};

export default processRoutes;
