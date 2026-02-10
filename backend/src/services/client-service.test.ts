import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientService } from '../services/client-service';
import { PrismaClient } from '@prisma/client';

const prismaMock = {
    client: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
} as unknown as PrismaClient;

describe('ClientService', () => {
    let clientService: ClientService;

    const clientAuditMock = {
        logCreate: vi.fn(),
        logUpdate: vi.fn(),
        logDelete: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        clientService = new ClientService(prismaMock, clientAuditMock as any);
    });

    describe('createClient', () => {
        it('should throw if email exists', async () => {
            // Mock getClientByEmail to return an existing client
            vi.spyOn(prismaMock.client, 'findUnique').mockResolvedValue({ id: '2', email: 'c@example.com' } as any);

            await expect(clientService.createClient({
                name: 'Client',
                email: 'c@example.com',
                status: 'active',
                budget: 1000,
                contractStart: '2023-01-01',
                contractEnd: '2023-12-31',
                metaAdAccountId: 'act_123'
            })).rejects.toThrow('Email already exists');
        });

        it('should create a client', async () => {
            // Mock getClientByEmail to return null (no duplicate)
            vi.spyOn(prismaMock.client, 'findUnique').mockResolvedValue(null);

            vi.spyOn(prismaMock.client, 'create').mockResolvedValue({
                id: '1',
                name: 'Client',
                email: 'c@example.com',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            } as any);

            const result = await clientService.createClient({
                name: 'Client',
                email: 'c@example.com',
                status: 'active',
                budget: 1000,
                contractStart: '2023-01-01',
                contractEnd: '2023-12-31',
                metaAdAccountId: 'act_123'
            });

            expect(result).toHaveProperty('id', '1');
        });
    });

    describe('getClientById', () => {
        it('should return client if found', async () => {
            vi.spyOn(prismaMock.client, 'findUnique').mockResolvedValue({
                id: '1',
                name: 'Test'
            } as any);

            const result = await clientService.getClientById('1');
            expect(result).toHaveProperty('id', '1');
        });

        it('should return null if not found', async () => {
            vi.spyOn(prismaMock.client, 'findUnique').mockResolvedValue(null);
            const result = await clientService.getClientById('999');
            expect(result).toBeNull();
        });
    });
});
