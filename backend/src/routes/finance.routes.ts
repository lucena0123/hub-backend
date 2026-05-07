import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const financeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const { finance, projects, customerSuccess } = fastify.services;

  fastify.get('/api/contracts', async (request, reply) => {
    try {
      const { clientId, status } = request.query as { clientId?: string; status?: string };
      return await finance.listContracts({ clientId, status });
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch contracts',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get('/api/contracts/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const contract = await finance.getContractById(id);
      if (!contract) {
        reply.status(404);
        return { error: 'Contract not found' };
      }
      return contract;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch contract',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.post('/api/contracts', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      const contract = await finance.createContract(request.body as any);
      reply.status(201);
      return contract;
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to create contract',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.patch('/api/contracts/:id', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return await finance.updateContract(id, request.body as any);
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to update contract',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.post('/api/contracts/backfill', { preHandler: [requireRoles(['admin', 'manager'])] }, async (_request, reply) => {
    try {
      const result = await finance.backfillContracts();
      reply.status(202);
      return { success: true, ...result };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to backfill contracts',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.post('/api/contracts/:id/activate', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const contract = await finance.activateContract(id);
      await projects.ensureProjectForContract(id);
      await customerSuccess.ensureOnboardingPlanForContract(id);
      reply.status(202);
      return contract;
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to activate contract',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get('/api/receivables', async (request, reply) => {
    try {
      const { clientId, status } = request.query as { clientId?: string; status?: string };
      return await finance.listReceivables({ clientId, status });
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch receivables',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.post('/api/receivables/:id/payments', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return await finance.recordPayment(id, request.body as any);
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to record payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get('/api/renewals', async (request, reply) => {
    try {
      const { clientId, status } = request.query as { clientId?: string; status?: string };
      return await finance.listRenewalOpportunities({ clientId, status });
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch renewals',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default financeRoutes;
