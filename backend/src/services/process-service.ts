import { PrismaClient } from '@prisma/client';

export class ProcessService {
    constructor(private prisma: PrismaClient) { }

    async listProcesses(limit = 50) {
        return this.prisma.processInstance.findMany({
            take: limit,
            orderBy: { startedAt: 'desc' },
            include: {
                client: {
                    select: {
                        name: true,
                        tier: true
                    }
                }
            }
        });
    }

    async getProcessById(id: string) {
        return this.prisma.processInstance.findUnique({
            where: { id },
            include: {
                client: {
                    select: {
                        name: true
                    }
                },
                tasks: {
                    orderBy: { startedAt: 'asc' }
                }
            }
        });
    }

    async listTasks(status?: string, limit = 100) {
        const where: any = {};

        if (status) {
            where.status = status;
        }

        return this.prisma.task.findMany({
            where,
            take: limit,
            orderBy: [
                { priority: 'desc' },
                { startedAt: 'desc' }
            ],
            include: {
                processInstance: {
                    select: {
                        processId: true,
                        client: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
    }
}
