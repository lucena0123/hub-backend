import { PrismaClient, Prisma } from '@prisma/client';
import type { ClientCreateData, ClientUpdateData } from '../validators/client';
import { ClientAudit } from '../middleware/audit';
import { prepareClientData } from '../validators/client';
import { v4 as uuidv4 } from 'uuid';

export class ClientService {
    constructor(
        private prisma: PrismaClient,
        private clientAudit: ClientAudit
    ) { }

    async listClients() {
        return this.prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                tier: true,
                status: true,
                budget: true,
                contractStart: true,
                contractEnd: true,
                metaAdAccountId: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    }

    async getClientById(id: string) {
        return this.prisma.client.findUnique({
            where: { id },
            include: {
                campaigns: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        platform: true,
                        budget: true,
                        spent: true,
                        externalId: true,
                        optimizationThemeKey: true,
                        optimizationSubthemeKey: true,
                    },
                },
                processes: {
                    select: {
                        id: true,
                        processId: true,
                        status: true,
                        priority: true,
                        startedAt: true,
                        completedAt: true,
                        currentPhase: true,
                        currentTask: true,
                    },
                },
                _count: {
                    select: {
                        processes: true,
                        campaigns: true,
                        metrics: true,
                    },
                },
            },
        });
    }

    async getClientByEmail(email: string) {
        return this.prisma.client.findUnique({
            where: { email: email.toLowerCase().trim() }
        });
    }

    async createClient(data: ClientCreateData) {
        const existing = await this.getClientByEmail(data.email);
        if (existing) {
            throw new Error('Email already exists');
        }

        const clientData = prepareClientData(data);

        // prepareClientData returns object with fields. 
        // We need to match Prisma.ClientCreateInput.
        // However, prepareClientData might return nulls where Prisma expects optional or nullable.

        const newClient = await this.prisma.client.create({
            data: {
                id: uuidv4(),
                name: clientData.name,
                email: clientData.email,
                tier: clientData.tier,
                status: clientData.status,
                budget: clientData.budget,
                contractStart: new Date(clientData.contractStart),
                contractEnd: clientData.contractEnd ? new Date(clientData.contractEnd) : null,
                metaAdAccountId: clientData.metaAdAccountId,
            }
        });

        await this.clientAudit.logCreate(newClient.id, newClient);

        return newClient;
    }

    async updateClient(id: string, data: ClientUpdateData) {
        const existingClient = await this.getClientById(id);
        if (!existingClient) {
            throw new Error('Client not found');
        }

        if (data.email && data.email !== existingClient.email) {
            const emailCheck = await this.getClientByEmail(data.email);
            if (emailCheck && emailCheck.id !== id) {
                throw new Error('Email already exists');
            }
        }

        // Logic from update.routes.ts regarding tier calculation
        let tier = data.tier;
        if (data.budget !== undefined && data.tier === undefined) {
            const { calculateTier } = await import('../utils/validators');
            tier = calculateTier(data.budget) as any;
        }

        // Prepare update data
        const updateInput: Prisma.ClientUpdateInput = {};
        if (data.name !== undefined) updateInput.name = data.name.trim();
        if (data.email !== undefined) updateInput.email = data.email.toLowerCase().trim();
        if (tier !== undefined) updateInput.tier = tier;
        if (data.status !== undefined) updateInput.status = data.status;
        if (data.budget !== undefined) updateInput.budget = data.budget;
        if (data.contractStart !== undefined) updateInput.contractStart = new Date(data.contractStart);
        if (data.contractEnd !== undefined) {
            updateInput.contractEnd = data.contractEnd ? new Date(data.contractEnd) : null;
        }
        if (data.metaAdAccountId !== undefined) {
            updateInput.metaAdAccountId = typeof data.metaAdAccountId === 'string' ? data.metaAdAccountId.trim().replace(/^act_/i, '') : data.metaAdAccountId;
        }

        const updatedClient = await this.prisma.client.update({
            where: { id },
            data: updateInput,
        });

        await this.clientAudit.logUpdate(id, existingClient, updatedClient);
        return updatedClient;
    }

    async deleteClient(id: string) {
        const existingClient = await this.getClientById(id);
        if (!existingClient) {
            throw new Error('Client not found');
        }

        // Check for running processes
        const runningProcesses = await this.prisma.processInstance.count({
            where: {
                clientId: id,
                status: 'running'
            }
        });

        if (runningProcesses > 0) {
            throw new Error('Cannot delete client: Client has running processes. Please complete or cancel them first.');
        }

        try {
            // Delete dependent records then the client in a transaction.
            // Note: not all FKs are ON DELETE CASCADE (e.g. metrics.clientId, metrics.campaignId), so we cleanup explicitly.
            await this.prisma.$transaction(async (tx) => {
                // Simple metrics (table: metrics) references both clientId and campaignId (no cascade) → delete first.
                await tx.metrics.deleteMany({ where: { clientId: id } });

                // Client-scoped analytics that don't cascade.
                await tx.anomaly_detections.deleteMany({ where: { client_id: id } });
                await tx.weekly_summaries.deleteMany({ where: { client_id: id } });
                await tx.ai_copy_suggestions.deleteMany({ where: { client_id: id } });
                await tx.clientRuleConfig.deleteMany({ where: { clientId: id } });

                // Process instances → delete tasks first (FK doesn't cascade).
                await tx.task.deleteMany({ where: { processInstance: { clientId: id } } });
                await tx.processInstance.deleteMany({ where: { clientId: id } });

                // Campaigns (children like campaign_metrics, adset_metrics, ad_creative_metrics use CASCADE).
                await tx.campaign.deleteMany({ where: { clientId: id } });

                // Finally delete the client (remaining relations like reports/notifications/bpmn_progress are CASCADE).
                await tx.client.delete({ where: { id } });
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new Error('Cannot delete client: Client has related records that prevent deletion.');
                }
            }
            throw error;
        }

        await this.clientAudit.logDelete(id, existingClient);
        return existingClient;
    }
}
