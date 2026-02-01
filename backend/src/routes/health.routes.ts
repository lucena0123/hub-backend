import { FastifyPluginAsync } from 'fastify';
import { redis } from '../config/redis';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  const { pool } = fastify;

  fastify.get('/health', async (_request, reply) => {
    try {
      const dbResult = await pool.query('SELECT 1 as test');
      const dbConnected = dbResult.rows[0].test === 1;

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
};

export default healthRoutes;
