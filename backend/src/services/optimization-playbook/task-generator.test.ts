import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OptimizationTaskGenerator } from './optimization-task-generator';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const prismaMock = {
    task: {
        findFirst: vi.fn(),
        create: vi.fn(),
    },
    processInstance: {
        findFirst: vi.fn(),
        create: vi.fn(),
    }
} as unknown as PrismaClient;

describe('OptimizationTaskGenerator', () => {
    let generator: OptimizationTaskGenerator;

    beforeEach(() => {
        vi.clearAllMocks();
        generator = new OptimizationTaskGenerator(prismaMock);
    });

    it('should generate tasks from actionable insights', async () => {
        const insights: any[] = [{
            id: 'insight-1',
            ruleId: 'creative-fatigue',
            title: 'Creative Fatigue Detected',
            severity: 'high', // mapped to priority 5 or 10
            entity: { id: '123', name: 'Ad 1' },
            autoAction: {
                type: 'pause_ad',
                entityId: '123',
                entityName: 'Ad 1'
            }
        }];

        // Mock process instance found
        (prismaMock.processInstance.findFirst as any).mockResolvedValue({ id: 'proc-1' });
        // Mock no existing task
        (prismaMock.task.findFirst as any).mockResolvedValue(null);
        // Mock task creation
        (prismaMock.task.create as any).mockResolvedValue({ id: 'task-1' });

        const result = await generator.generateTasksFromInsights('client-1', insights);

        expect(result.created).toBe(1);
        expect(result.skipped).toBe(0);
        expect(prismaMock.task.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                name: 'Creative Fatigue Detected',
                processInstanceId: 'proc-1',
                input: expect.objectContaining({
                    ruleId: 'creative-fatigue',
                    entityId: '123'
                })
            })
        }));
    });

    it('should skip existing tasks', async () => {
        const insights: any[] = [{
            id: 'insight-1',
            ruleId: 'creative-fatigue',
            title: 'Creative Fatigue Detected',
            autoAction: {
                type: 'pause_ad',
                entityId: '123'
            }
        }];

        (prismaMock.processInstance.findFirst as any).mockResolvedValue({ id: 'proc-1' });
        // Mock existing task found
        (prismaMock.task.findFirst as any).mockResolvedValue({ id: 'existing-task' });

        const result = await generator.generateTasksFromInsights('client-1', insights);

        expect(result.created).toBe(0);
        expect(result.skipped).toBe(1);
        expect(prismaMock.task.create).not.toHaveBeenCalled();
    });
});
