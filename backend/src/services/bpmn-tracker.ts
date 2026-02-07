import { PrismaClient } from '@prisma/client';
import type { BPMNProgress } from '../types/metrics';

// BPMN Subprocess definitions based on the architecture
const BPMN_SUBPROCESSES = {
  '4.1': { name: 'Criação de Anúncios', stage: 'execution' },
  '4.2': { name: 'Configuração de Campanha', stage: 'execution' },
  '4.3': { name: 'Landing Page', stage: 'execution' },
  '5.1': { name: 'Monitoramento', stage: 'monitoring' },
  '5.2': { name: 'Otimização', stage: 'monitoring' },
  '5.3': { name: 'Testes A/B', stage: 'monitoring' },
};

export class BPMNTracker {
  constructor(private prisma: PrismaClient) { }

  /**
   * Get current BPMN progress for a client
   */
  async getProgress(clientId: string): Promise<BPMNProgress | null> {
    const row = await this.prisma.clientBPMNProgress.findFirst({
      where: { clientId },
      orderBy: { updatedAt: 'desc' }
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      clientId: row.clientId,
      currentSubprocess: row.currentSubprocess,
      status: row.status as any,
      progressPercentage: row.progressPercentage,
      completedTasks: row.completedTasks,
      pendingTasks: row.pendingTasks,
      blockedTasks: row.blockedTasks,
      startedAt: row.startedAt?.toISOString(),
      estimatedCompletion: row.estimatedCompletion?.toISOString(),
      completedAt: row.completedAt?.toISOString(),
      notes: row.notes || undefined,
      blockers: row.blockers as any[],
      subprocessHistory: row.subprocessHistory as any[],
      metadata: row.metadata as any,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * Initialize BPMN tracking for a new client
   */
  async initializeProgress(
    clientId: string,
    startingSubprocess: string = '4.1'
  ): Promise<BPMNProgress> {
    // Check if exists
    const existing = await this.getProgress(clientId);
    if (existing) return existing;

    const row = await this.prisma.clientBPMNProgress.create({
      data: {
        clientId,
        currentSubprocess: startingSubprocess,
        status: 'in_progress',
        progressPercentage: 0,
        startedAt: new Date(),
      }
    });

    // Return in correct format
    return {
      id: row.id,
      clientId: row.clientId,
      currentSubprocess: row.currentSubprocess,
      status: row.status as any,
      progressPercentage: row.progressPercentage,
      completedTasks: row.completedTasks,
      pendingTasks: row.pendingTasks,
      blockedTasks: row.blockedTasks,
      startedAt: row.startedAt?.toISOString(),
      estimatedCompletion: row.estimatedCompletion?.toISOString(),
      completedAt: row.completedAt?.toISOString(),
      notes: row.notes || undefined,
      blockers: row.blockers as any[],
      subprocessHistory: row.subprocessHistory as any[],
      metadata: row.metadata as any,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * Update progress for a client
   */
  async updateProgress(
    clientId: string,
    updates: {
      currentSubprocess?: string;
      status?: 'not_started' | 'in_progress' | 'completed' | 'blocked';
      progressPercentage?: number;
      completedTasks?: string[];
      pendingTasks?: string[];
      blockedTasks?: string[];
      notes?: string;
      blockers?: any[];
    }
  ): Promise<BPMNProgress> {
    const current = await this.getProgress(clientId);

    if (!current) {
      throw new Error('Progress not found. Initialize first.');
    }

    const data: any = {};

    if (updates.currentSubprocess !== undefined) {
      data.currentSubprocess = updates.currentSubprocess;

      // If moving to new subprocess, add to history
      if (updates.currentSubprocess !== current.currentSubprocess) {
        const history = (current.subprocessHistory || []) as any[];
        history.push({
          subprocess: current.currentSubprocess,
          startedAt: current.startedAt || new Date().toISOString(),
          completedAt: new Date().toISOString(),
          duration: this.calculateDuration(current.startedAt, new Date().toISOString()),
        });

        data.subprocessHistory = history;
        data.startedAt = new Date();
      }
    }

    if (updates.status !== undefined) {
      data.status = updates.status;
      if (updates.status === 'completed') {
        data.completedAt = new Date();
      }
    }

    if (updates.progressPercentage !== undefined) data.progressPercentage = updates.progressPercentage;
    if (updates.completedTasks !== undefined) data.completedTasks = updates.completedTasks;
    if (updates.pendingTasks !== undefined) data.pendingTasks = updates.pendingTasks;
    if (updates.blockedTasks !== undefined) data.blockedTasks = updates.blockedTasks;
    if (updates.notes !== undefined) data.notes = updates.notes;
    if (updates.blockers !== undefined) data.blockers = updates.blockers;

    await this.prisma.clientBPMNProgress.updateMany({
      where: { clientId },
      data
    });

    const updated = await this.getProgress(clientId);
    if (!updated) throw new Error('Failed to retrieve updated progress');
    return updated;
  }

  /**
   * Get all clients in a specific subprocess
   */
  async getClientsInSubprocess(subprocess: string): Promise<BPMNProgress[]> {
    const rows = await this.prisma.clientBPMNProgress.findMany({
      where: { currentSubprocess: subprocess },
      orderBy: { updatedAt: 'desc' }
    });

    return rows.map(row => ({
      id: row.id,
      clientId: row.clientId,
      currentSubprocess: row.currentSubprocess,
      status: row.status as any,
      progressPercentage: row.progressPercentage,
      completedTasks: row.completedTasks,
      pendingTasks: row.pendingTasks,
      blockedTasks: row.blockedTasks,
      startedAt: row.startedAt?.toISOString(),
      estimatedCompletion: row.estimatedCompletion?.toISOString(),
      completedAt: row.completedAt?.toISOString(),
      notes: row.notes || undefined,
      blockers: row.blockers as any[],
      subprocessHistory: row.subprocessHistory as any[],
      metadata: row.metadata as any,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  /**
   * Get subprocess info
   */
  getSubprocessInfo(subprocess: string) {
    return BPMN_SUBPROCESSES[subprocess as keyof typeof BPMN_SUBPROCESSES];
  }

  /**
   * Calculate duration in days
   */
  private calculateDuration(startDate?: string, endDate?: string): number {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
