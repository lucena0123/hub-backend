import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CampaignService } from '../services/campaign.service';
import { PrismaClient } from '@prisma/client';

const prismaMock = {
    campaign: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    client: {
        findUnique: vi.fn(),
    },
} as unknown as PrismaClient;

describe('CampaignService', () => {
    let campaignService: CampaignService;

    beforeEach(() => {
        vi.clearAllMocks();
        campaignService = new CampaignService(prismaMock);
    });

    describe('findAll', () => {
        it('should return list of campaigns', async () => {
            const mockCampaigns = [{ id: '1', name: 'C1' }];
            vi.spyOn(prismaMock.campaign, 'findMany').mockResolvedValue(mockCampaigns as any);

            const result = await campaignService.findAll({});
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('C1');
        });

        it('should apply filters', async () => {
            await campaignService.findAll({ platform: 'meta' });
            expect(prismaMock.campaign.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ platform: 'meta' })
            }));
        });
    });

    describe('create', () => {
        it('should create campaign', async () => {
            const input = {
                name: 'New C',
                platform: 'meta',
                clientId: 'client-1',
                budget: 1000,
                status: 'active'
            };

            vi.spyOn(prismaMock.client, 'findUnique').mockResolvedValue({ id: 'client-1' } as any);
            vi.spyOn(prismaMock.campaign, 'create').mockResolvedValue({ id: '1', ...input } as any);

            const result = await campaignService.create(input as any);
            expect(result.name).toBe('New C');
        });
    });
});
