import { describe, it, expect, vi } from 'vitest';
import { buildApp } from '../app';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

// Mock Redis config
vi.mock('../config/redis', () => ({
    redis: {
        ping: vi.fn().mockResolvedValue('PONG'),
        connect: vi.fn(),
        disconnect: vi.fn(),
    }
}));

describe('Health Routes', () => {
    let app: FastifyInstance;

    it('GET /health should return 200', async () => {
        // Mock services plugin
        const mockServicesObj = {
            campaigns: {},
            auth: {},
            clients: {},
            metrics: {},
            metaSync: {},
            metaDiscovery: {},
            bpmn: {},
            dashboard: {},
            reports: {},
            process: {},
            processes: {},
            leadTracking: {},
            analytics: {},
            notification: {},
            queue: { available: false },
            bpmnDefinitions: {},
            syncHistory: {},
            clientAudit: {},
            cache: {}
        };

        const mockServicesPlugin = fp(async (fastify: any) => {
            fastify.decorate('services', mockServicesObj);

            // Mock Pool and Prisma for health check
            fastify.decorate('pool', {
                query: vi.fn().mockResolvedValue({ rows: [{ '1': 1 }] }),
                end: vi.fn(),
            });

            fastify.decorate('prisma', {
                $queryRaw: vi.fn().mockResolvedValue([{}]),
                $disconnect: vi.fn(),
            });
        });

        app = buildApp(mockServicesPlugin);
        await app.ready();

        const response = await app.inject({
            method: 'GET',
            url: '/health'
        });

        expect(response.statusCode).toBe(200);
        await app.close();
    });
});
