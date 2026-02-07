import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';

const processRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const { processes: processService } = fastify.services;

  // Get all processes
  fastify.get('/api/processes', async (_request, reply) => {
    try {
      const processes = await processService.listProcesses();

      // Transform result to match old API response structure if needed
      // Old API returned: p.*, clientName, clientTier
      // Prisma returns: ...processFields, client: { name, tier }
      // We can map it to flatten the structure for backward compatibility

      return processes.map((p: any) => ({
        ...p,
        clientName: p.client.name,
        clientTier: p.client.tier,
        client: undefined // Remove nested object
      }));
    } catch (error) {
      fastify.log.error(error);
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
      const process = await processService.getProcessById(id);

      if (!process) {
        reply.status(404);
        return { error: 'Process not found' };
      }

      // Flatten client name for backward compatibility
      return {
        ...process,
        clientName: process.client.name,
        client: undefined
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
      const tasks = await processService.listTasks(status);

      // Flatten structure
      return tasks.map((t: any) => ({
        ...t,
        processId: t.processInstance.processId,
        clientName: t.processInstance.client.name,
        processInstance: undefined
      }));

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
