import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientService } from '../services/client-service';
import { Prisma, PrismaClient } from '@prisma/client';

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

    const makeMissingColumnError = (column: string) =>
        new Prisma.PrismaClientKnownRequestError(
            `The column \`${column}\` does not exist in the current database.`,
            { code: 'P2022', clientVersion: 'test', meta: { column } }
        );

    describe('createClient', () => {
        it('should throw if email exists', async () => {
            // Mock getClientByEmail to return an existing client
            vi.spyOn(prismaMock.client, 'findUnique').mockResolvedValue({ id: '2', email: 'c@example.com' } as any);

            await expect(clientService.createClient({
                name: 'Client',
                email: 'c@example.com',
                businessNicheKey: 'legal',
                defaultChannelKey: 'meta',
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
                businessNicheKey: 'legal',
                defaultChannelKey: 'meta',
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

        it('should fallback to legacy client query when classification columns are missing', async () => {
            vi.spyOn(prismaMock.client, 'findUnique')
                .mockRejectedValueOnce(makeMissingColumnError('clients.business_niche_key'))
                .mockResolvedValueOnce({
                    id: '1',
                    name: 'Legacy client',
                    email: 'legacy@example.com',
                    tier: 'starter',
                    status: 'active',
                    budget: 1000,
                    contractStart: new Date('2024-01-01'),
                    contractEnd: null,
                    metaAdAccountId: null,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    campaigns: [{
                        id: 'campaign-1',
                        name: 'Legacy campaign',
                        status: 'active',
                        platform: 'meta_ads',
                        budget: 100,
                        spent: 50,
                        externalId: null,
                        optimizationThemeKey: null,
                        optimizationSubthemeKey: null,
                    }],
                    processes: [],
                    _count: { processes: 0, campaigns: 1, metrics: 0 },
                } as any);

            const result = await clientService.getClientById('1');
            expect(result).toBeTruthy();
            expect(result).toMatchObject({
                id: '1',
                businessNicheKey: null,
                defaultChannelKey: null,
            });
            expect(result?.campaigns[0]).toMatchObject({
                id: 'campaign-1',
                objectiveClassKey: null,
                channelClassKey: null,
                ruleProfileId: null,
            });
        });
    });

    describe('listClients', () => {
        it('should fallback to legacy list when classification columns are missing', async () => {
            vi.spyOn(prismaMock.client, 'findMany')
                .mockRejectedValueOnce(makeMissingColumnError('clients.business_niche_key'))
                .mockResolvedValueOnce([{
                    id: '1',
                    name: 'Legacy client',
                    email: 'legacy@example.com',
                    tier: 'starter',
                    status: 'active',
                    budget: 1000,
                    contractStart: new Date('2024-01-01'),
                    contractEnd: null,
                    metaAdAccountId: null,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                }] as any);

            const result = await clientService.listClients();
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: '1',
                businessNicheKey: null,
                defaultChannelKey: null,
            });
        });

        it('should fallback when P2022 comes as generic object (without Prisma instanceof)', async () => {
            vi.spyOn(prismaMock.client, 'findMany')
                .mockRejectedValueOnce({
                    code: 'P2022',
                    meta: { column: 'clients.business_niche_key' },
                    message: 'The column `clients.business_niche_key` does not exist in the current database.',
                } as any)
                .mockResolvedValueOnce([{
                    id: '2',
                    name: 'Legacy client 2',
                    email: 'legacy2@example.com',
                    tier: 'starter',
                    status: 'active',
                    budget: 900,
                    contractStart: new Date('2024-01-01'),
                    contractEnd: null,
                    metaAdAccountId: null,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                }] as any);

            const result = await clientService.listClients();
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: '2',
                businessNicheKey: null,
                defaultChannelKey: null,
            });
        });
    });
});
