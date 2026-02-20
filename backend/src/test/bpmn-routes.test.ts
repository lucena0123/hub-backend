import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import bpmnRoutes from '../routes/bpmn.routes';

// Mock Auth Middleware to ALWAYS authenticate
vi.mock('../middleware/auth', () => ({
  authenticate: async (req: any, _reply: any) => {
    req.user = { id: 'user-1', role: 'admin' };
  },
}));

describe('BPMN Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();

    const mockBpmn = {
      getProgress: vi.fn(),
      initializeProgress: vi.fn(),
      updateProgress: vi.fn(),
      getClientsInSubprocess: vi.fn(),
    };

    const mockServicesPlugin = fp(async (fastify: any) => {
      fastify.decorate('services', {
        bpmn: mockBpmn,
        bpmnDefinitions: { getSubprocessDefinition: vi.fn() },
      });

      fastify.decorate('prisma', {
        client: { findUnique: vi.fn() },
      });
    });

    app.register(mockServicesPlugin);
    app.register(bpmnRoutes);

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/clients/:id/bpmn-progress should return existing progress', async () => {
    const progress = {
      id: 'progress-1',
      clientId: 'client-1',
      currentSubprocess: '4.1',
      status: 'in_progress',
      progressPercentage: 0,
      completedTasks: [],
      pendingTasks: [],
      blockedTasks: [],
      createdAt: '2026-02-09T00:00:00.000Z',
      updatedAt: '2026-02-09T00:00:00.000Z',
    };

    (app as any).services.bpmn.getProgress.mockResolvedValue(progress);

    const response = await app.inject({
      method: 'GET',
      url: '/api/clients/client-1/bpmn-progress',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual(progress);
    expect((app as any).prisma.client.findUnique).not.toHaveBeenCalled();
    expect((app as any).services.bpmn.initializeProgress).not.toHaveBeenCalled();
  });

  it('GET /api/clients/:id/bpmn-progress should initialize progress when missing', async () => {
    const createdProgress = {
      id: 'progress-2',
      clientId: 'client-2',
      currentSubprocess: '4.1',
      status: 'in_progress',
      progressPercentage: 0,
      completedTasks: [],
      pendingTasks: [],
      blockedTasks: [],
      createdAt: '2026-02-09T00:00:00.000Z',
      updatedAt: '2026-02-09T00:00:00.000Z',
    };

    (app as any).services.bpmn.getProgress.mockResolvedValue(null);
    (app as any).prisma.client.findUnique.mockResolvedValue({ id: 'client-2' });
    (app as any).services.bpmn.initializeProgress.mockResolvedValue(createdProgress);

    const response = await app.inject({
      method: 'GET',
      url: '/api/clients/client-2/bpmn-progress',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual(createdProgress);
    expect((app as any).services.bpmn.initializeProgress).toHaveBeenCalledWith('client-2', '4.1');
  });

  it('GET /api/clients/:id/bpmn-progress should return 404 when client does not exist', async () => {
    (app as any).services.bpmn.getProgress.mockResolvedValue(null);
    (app as any).prisma.client.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/clients/missing-client/bpmn-progress',
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.payload)).toEqual({ error: 'Client not found' });
    expect((app as any).services.bpmn.initializeProgress).not.toHaveBeenCalled();
  });
});

