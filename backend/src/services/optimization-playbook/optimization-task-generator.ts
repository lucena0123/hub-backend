import { PrismaClient } from '@prisma/client';
import type { OptimizationItem } from './optimization-center/engine/types';

export class OptimizationTaskGenerator {
    constructor(private prisma: PrismaClient) { }

    /**
     * Generates tasks for all insights that have an autoAction.
     * Deduplicates based on the unique combination of ruleId, entityId and actionType.
     */
    async generateTasksFromInsights(
        clientId: string,
        insights: OptimizationItem[]
    ): Promise<{ created: number; skipped: number; errors: number }> {
        let created = 0;
        let skipped = 0;
        let errors = 0;

        // Filter only actionable insights
        const actionableInsights = insights.filter((i) => i.autoAction);

        if (actionableInsights.length === 0) {
            return { created, skipped, errors };
        }

        // Ensure there is an active ProcessInstance for interventions
        // We group these under a "Continuous Optimization" process
        const processInstance = await this.getOrCreateInterventionProcess(clientId);

        for (const insight of actionableInsights) {
            try {
                const autoAction = insight.autoAction!;
                const uniqueKey = `${insight.ruleId}:${autoAction.entityId}:${autoAction.type}`;

                // Check if a pending task already exists for this specific insight
                // We use the uniqueKey stored in the input JSON to look it up
                const existingTask = await this.prisma.task.findFirst({
                    where: {
                        processInstanceId: processInstance.id,
                        status: { in: ['pending', 'in_progress'] },
                        input: {
                            path: ['uniqueKey'],
                            equals: uniqueKey,
                        },
                    },
                });

                if (existingTask) {
                    skipped++;
                    continue;
                }

                // Create the task
                await this.prisma.task.create({
                    data: {
                        processInstanceId: processInstance.id,
                        taskId: `opt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                        name: insight.title, // e.g., "Creative Fatigue: Ad Image 1"
                        lane: 'gestor_trafego', // Assigned to the traffic manager
                        status: 'pending',
                        priority: insight.severity === 'critical' ? 10 : 5,
                        input: {
                            uniqueKey,
                            insightId: insight.id,
                            ruleId: insight.ruleId,
                            severity: insight.severity,
                            description: insight.description,
                            entityId: insight.entity?.id,
                            entityName: insight.entity?.name,
                            autoAction: autoAction, // The payload for the frontend button
                        },
                    },
                });

                created++;
            } catch (error) {
                console.error('Failed to create optimization task:', error);
                errors++;
            }
        }

        return { created, skipped, errors };
    }

    private async getOrCreateInterventionProcess(clientId: string) {
        // Try to find an open "optimization_intervention" process
        let process = await this.prisma.processInstance.findFirst({
            where: {
                clientId,
                processId: 'optimization_intervention',
                status: 'running',
            },
            orderBy: { startedAt: 'desc' },
        });

        if (!process) {
            process = await this.prisma.processInstance.create({
                data: {
                    clientId,
                    processId: 'optimization_intervention',
                    version: '1.0.0',
                    status: 'running',
                    state: { type: 'continuous_optimization' },
                    expectedSla: '24h', // Default SLA for optimization tasks
                },
            });
        }

        return process;
    }
}
