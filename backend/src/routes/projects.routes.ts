import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const { projects } = fastify.services;

  fastify.get('/api/projects', async (request, reply) => {
    try {
      const { clientId, status } = request.query as { clientId?: string; status?: string };
      return await projects.listProjects({ clientId, status });
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch projects',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get('/api/projects/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const project = await projects.getProjectById(id);
      if (!project) {
        reply.status(404);
        return { error: 'Project not found' };
      }
      return project;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch project',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.post('/api/projects', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      const project = await projects.createProject(request.body as any);
      reply.status(201);
      return project;
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to create project',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.post('/api/projects/:id/milestones', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const milestone = await projects.createMilestone(id, request.body as any);
      reply.status(201);
      return milestone;
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to create milestone',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.get('/api/deliverables', async (request, reply) => {
    try {
      const { projectId, status } = request.query as { projectId?: string; status?: string };
      return await projects.listDeliverables(projectId, status);
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch deliverables',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.post('/api/deliverables', { preHandler: [requireRoles(['admin', 'manager'])] }, async (request, reply) => {
    try {
      const deliverable = await projects.createDeliverable(request.body as any);
      reply.status(201);
      return deliverable;
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to create deliverable',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  fastify.patch('/api/deliverables/:id', { preHandler: [requireRoles(['admin', 'manager', 'analyst'])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return await projects.updateDeliverable(id, request.body as any);
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to update deliverable',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default projectRoutes;
