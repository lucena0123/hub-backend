/**
 * BPMN Progress Tracker Service
 * Tracks client progress through BPMN subprocesses (4.x, 5.x, etc)
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
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
  constructor(private pool: Pool) {}

  /**
   * Get current BPMN progress for a client
   */
  async getProgress(clientId: string): Promise<BPMNProgress | null> {
    const result = await this.pool.query(
      `SELECT * FROM client_bpmn_progress
       WHERE client_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [clientId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      clientId: row.client_id,
      currentSubprocess: row.current_subprocess,
      status: row.status,
      progressPercentage: row.progress_percentage,
      completedTasks: row.completed_tasks || [],
      pendingTasks: row.pending_tasks || [],
      blockedTasks: row.blocked_tasks || [],
      startedAt: row.started_at?.toISOString(),
      estimatedCompletion: row.estimated_completion?.toISOString(),
      completedAt: row.completed_at?.toISOString(),
      notes: row.notes,
      blockers: row.blockers,
      subprocessHistory: row.subprocess_history,
      metadata: row.metadata,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  /**
   * Initialize BPMN tracking for a new client
   */
  async initializeProgress(
    clientId: string,
    startingSubprocess: string = '4.1'
  ): Promise<BPMNProgress> {
    const id = uuidv4();

    await this.pool.query(
      `INSERT INTO client_bpmn_progress
       (id, client_id, current_subprocess, status, progress_percentage, started_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
      [id, clientId, startingSubprocess, 'in_progress', 0]
    );

    const progress = await this.getProgress(clientId);
    if (!progress) {
      throw new Error('Failed to initialize progress');
    }

    return progress;
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

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.currentSubprocess !== undefined) {
      updateFields.push(`current_subprocess = $${paramIndex++}`);
      values.push(updates.currentSubprocess);

      // If moving to new subprocess, add to history
      if (updates.currentSubprocess !== current.currentSubprocess) {
        const history = current.subprocessHistory || [];
        history.push({
          subprocess: current.currentSubprocess,
          startedAt: current.startedAt || new Date().toISOString(),
          completedAt: new Date().toISOString(),
          duration: this.calculateDuration(current.startedAt, new Date().toISOString()),
        });

        updateFields.push(`subprocess_history = $${paramIndex++}`);
        values.push(JSON.stringify(history));

        updateFields.push(`started_at = NOW()`);
      }
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(updates.status);

      if (updates.status === 'completed') {
        updateFields.push(`completed_at = NOW()`);
      }
    }

    if (updates.progressPercentage !== undefined) {
      updateFields.push(`progress_percentage = $${paramIndex++}`);
      values.push(updates.progressPercentage);
    }

    if (updates.completedTasks !== undefined) {
      updateFields.push(`completed_tasks = $${paramIndex++}`);
      values.push(updates.completedTasks);
    }

    if (updates.pendingTasks !== undefined) {
      updateFields.push(`pending_tasks = $${paramIndex++}`);
      values.push(updates.pendingTasks);
    }

    if (updates.blockedTasks !== undefined) {
      updateFields.push(`blocked_tasks = $${paramIndex++}`);
      values.push(updates.blockedTasks);
    }

    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }

    if (updates.blockers !== undefined) {
      updateFields.push(`blockers = $${paramIndex++}`);
      values.push(JSON.stringify(updates.blockers));
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(clientId);

    const query = `
      UPDATE client_bpmn_progress
      SET ${updateFields.join(', ')}
      WHERE client_id = $${paramIndex}
    `;

    await this.pool.query(query, values);

    const updated = await this.getProgress(clientId);
    if (!updated) {
      throw new Error('Failed to get updated progress');
    }

    return updated;
  }

  /**
   * Get all clients in a specific subprocess
   */
  async getClientsInSubprocess(subprocess: string): Promise<BPMNProgress[]> {
    const result = await this.pool.query(
      `SELECT * FROM client_bpmn_progress
       WHERE current_subprocess = $1
       ORDER BY updated_at DESC`,
      [subprocess]
    );

    return result.rows.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      currentSubprocess: row.current_subprocess,
      status: row.status,
      progressPercentage: row.progress_percentage,
      completedTasks: row.completed_tasks || [],
      pendingTasks: row.pending_tasks || [],
      blockedTasks: row.blocked_tasks || [],
      startedAt: row.started_at?.toISOString(),
      estimatedCompletion: row.estimated_completion?.toISOString(),
      completedAt: row.completed_at?.toISOString(),
      notes: row.notes,
      blockers: row.blockers,
      subprocessHistory: row.subprocess_history,
      metadata: row.metadata,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
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
