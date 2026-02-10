import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import campaignRoutes from '../routes/campaign.routes';

// Mock Redis config to prevent interactions
vi.mock('../config/redis', () => ({
    redis: {
        ping: vi.fn().mockResolvedValue('PONG'),
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
    }
}));

// Mock Auth Middleware to ALWAYS authenticate
vi.mock('../middleware/auth', () => ({
    authenticate: async (req: any, _reply: any) => {
        // Mock user
        req.user = { id: 'user-1', role: 'admin' };
    }
}));

describe('Campaign Routes Integration', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = Fastify();

        // Create a mock services plugin wrapped with fastify-plugin
        const mockServicesPlugin = fp(async (fastify: any) => {
            fastify.decorate('services', {
                campaigns: {
                    findAll: vi.fn().mockResolvedValue([{ id: '1', name: 'Mock Campaign' }]),
                    findById: vi.fn(),
                    create: vi.fn().mockResolvedValue({ id: '2', name: 'New Campaign' }),
                    update: vi.fn(),
                    delete: vi.fn(),
                },
                cache: {
                    get: vi.fn(),
                    set: vi.fn(),
                    invalidatePattern: vi.fn(),
                },
                // We don't need other services here because we ONLY register campaignRoutes
            });

            // Mock Pool and Prisma just in case
            fastify.decorate('pool', {
                query: vi.fn().mockResolvedValue({ rows: [] }),
                end: vi.fn(),
            });

            fastify.decorate('prisma', {
                $disconnect: vi.fn(),
            });
        });

        app.register(mockServicesPlugin);
        app.register(campaignRoutes);

        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /api/campaigns should return 200 and list campaigns', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/campaigns'
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.payload)).toEqual([{ id: '1', name: 'Mock Campaign' }]);
    });

    it('POST /api/campaigns should validate input', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/campaigns',
            payload: {
                // Missing name and other required fields
                platform: 'meta'
            }
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body).toHaveProperty('error');
    });

    it('POST /api/campaigns should create campaign if valid', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/campaigns',
            payload: {
                name: 'New Campaign',
                platform: 'meta',
                clientId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
                budget: 500,
                // contractStart: '2023-01-01', // Removed as handled by validator stripping
                // contractEnd: '2023-01-31'
            }
        });

        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.payload)).toHaveProperty('id', '2');
    });
});
