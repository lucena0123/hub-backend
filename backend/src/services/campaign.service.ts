import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError } from '../middleware/error-handler';
import { CampaignCreateInput, CampaignUpdateInput } from '../validators/campaign';
import { inferOptimizationTheme } from './optimization-playbook';

export class CampaignService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Find all campaigns with optional filters
     */
    async findAll(filters: {
        clientId?: string;
        platform?: string;
        status?: string;
    }) {
        const where: Prisma.CampaignWhereInput = {};

        if (filters.clientId) where.clientId = filters.clientId;
        if (filters.platform) where.platform = filters.platform;
        if (filters.status) where.status = filters.status;

        return this.prisma.campaign.findMany({
            where,
            include: {
                client: {
                    select: { name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Find campaign by ID
     */
    async findById(id: string) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
            include: {
                client: {
                    select: { name: true },
                },
            },
        });

        if (!campaign) {
            throw new NotFoundError('Campaign not found');
        }

        return campaign;
    }

    /**
     * Create new campaign
     */
    async create(data: CampaignCreateInput) {
        // Verify client exists
        const client = await this.prisma.client.findUnique({
            where: { id: data.clientId },
        });

        if (!client) {
            throw new NotFoundError('Client not found');
        }

        const externalId = data.externalId || `manual-${Date.now()}`;
        const inferredTheme = !data.optimizationThemeKey
            ? inferOptimizationTheme(data.name)
            : null;

        return this.prisma.campaign.create({
            data: {
                ...data,
                externalId,
                spent: 0,
                status: data.status || 'active',
                optimizationThemeKey: data.optimizationThemeKey ?? inferredTheme?.themeKey ?? null,
                optimizationSubthemeKey: data.optimizationSubthemeKey ?? null,
            },
        });
    }

    /**
     * Update campaign
     */
    async update(id: string, data: CampaignUpdateInput) {
        // Verify campaign exists
        const existing = await this.prisma.campaign.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundError('Campaign not found');
        }

        return this.prisma.campaign.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete campaign
     */
    async delete(id: string) {
        // Verify campaign exists
        const existing = await this.prisma.campaign.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundError('Campaign not found');
        }

        return this.prisma.campaign.delete({
            where: { id },
        });
    }
}
