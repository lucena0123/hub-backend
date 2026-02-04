import { FastifyPluginAsync } from 'fastify';
import { validateBpmnInit, validateBpmnUpdate } from '../validators/bpmn';
import { BpmnDefinitionInvalidError, BpmnDefinitionNotFoundError } from '../services/bpmn-definition-service';

const bpmnRoutes: FastifyPluginAsync = async (fastify) => {
  const { bpmn: bpmnTracker, bpmnDefinitions } = fastify.services;

  // Get client BPMN progress
  fastify.get('/api/clients/:id/bpmn-progress', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const progress = await bpmnTracker.getProgress(id);

      if (!progress) {
        reply.status(404);
        return { error: 'BPMN progress not found for this client' };
      }

      return progress;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch BPMN progress',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Initialize BPMN tracking for client
  fastify.post('/api/clients/:id/bpmn-progress', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const validation = validateBpmnInit(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const { startingSubprocess } = validation.data!;
      const progress = await bpmnTracker.initializeProgress(id, startingSubprocess);

      reply.status(201);
      return progress;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to initialize BPMN progress',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Update client BPMN progress
  fastify.put('/api/clients/:id/bpmn-progress', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const validation = validateBpmnUpdate(request.body);
      if (!validation.valid) {
        reply.status(400);
        return { error: 'Validation failed', details: validation.errors };
      }

      const updates = validation.data!;
      const progress = await bpmnTracker.updateProgress(id, updates);

      return progress;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to update BPMN progress',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get all clients in a specific subprocess
  fastify.get('/api/bpmn/subprocess/:id/clients', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const clients = await bpmnTracker.getClientsInSubprocess(id);

      return clients;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch clients in subprocess',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get subprocess definition (nodes/flows/metadata) from v5-data.js
  fastify.get('/api/bpmn/subprocess/:id/definition', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const definition = await bpmnDefinitions.getSubprocessDefinition(id);
      return definition;
    } catch (error) {
      if (error instanceof BpmnDefinitionInvalidError) {
        reply.status(400);
        return { error: 'Validation failed', message: error.message };
      }

      if (error instanceof BpmnDefinitionNotFoundError) {
        reply.status(404);
        return { error: 'Subprocess definition not found', message: error.message };
      }

      fastify.log.error(error);
      reply.status(500);
      return {
        error: 'Failed to fetch subprocess definition',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

export default bpmnRoutes;
