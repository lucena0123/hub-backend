import { FastifyPluginAsync } from 'fastify';
import { validateClientCreate, validateClientUpdate } from '../validators/client';
import { authenticate } from '../middleware/auth';

const clientRoutes: FastifyPluginAsync = async (fastify) => {
  const { clients: clientService } = fastify.services;

  // Apply global protection to this plugin scope? Or individual routes?
  // Fastify plugin encapsulation means we can add a hook here for all routes in this file.
  fastify.addHook('preHandler', authenticate);

  // List clients
  fastify.get('/api/clients', async (_request, reply) => {
    try {
      const clients = await clientService.listClients();
      return clients;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch clients',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get client details
  fastify.get('/api/clients/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const client = await clientService.getClientById(id);

      if (!client) {
        reply.status(404);
        return { error: 'Client not found' };
      }

      return client;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch client details',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Create client
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

      const client = await clientService.createClient(request.body as any);
      reply.status(201);
      return client;
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error && error.message === 'Email already exists') {
        reply.status(409);
        return { error: 'Email already exists', message: 'A client with this email already exists' };
      }
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

      const updatedClient = await clientService.updateClient(id, request.body as any);
      return updatedClient;
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        if (error.message === 'Client not found') {
          reply.status(404);
          return { error: 'Client not found' };
        }
        if (error.message === 'Email already exists') {
          reply.status(409);
          return { error: 'Email already exists', message: 'Another client with this email already exists' };
        }
      }
      reply.status(500);
      return {
        error: 'Failed to update client',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Delete client
  fastify.delete('/api/clients/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await clientService.deleteClient(id);
      return {
        message: 'Client deleted successfully',
        client: result,
      };
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        if (error.message === 'Client not found') {
          reply.status(404);
          return { error: 'Client not found' };
        }
        if (error.message.includes('Cannot delete client')) {
          reply.status(409);
          return { error: 'Cannot delete client', message: error.message };
        }
      }
      reply.status(500);
      return {
        error: 'Failed to delete client',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Performance summary (Delegates to metrics service, but kept under client route path)
  // Re-using the logic from the old file, but using dependency injected metrics service
  // Or... wait. clientPerformanceSummaryRoutes used metricsService.
  // The new ClientService doesn't have getClientPerformanceSummary.
  // We should keep this route here or delegate it to MetricsService?
  // The route path is /api/clients/:id/performance-summary

  fastify.get('/api/clients/:id/performance-summary', async (request, reply) => {
    const { metrics: metricsService } = fastify.services;
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
