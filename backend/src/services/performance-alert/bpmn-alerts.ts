import type { Pool } from 'pg';

import type { PerformanceAlert } from './types';

export const buildBpmnAlerts = async (pool: Pool): Promise<PerformanceAlert[]> => {
  const alerts: PerformanceAlert[] = [];

  const blocked = await pool.query(`
    SELECT cbp.client_id, c.name as client_name, cbp.current_subprocess, cbp.blockers
    FROM client_bpmn_progress cbp
    JOIN clients c ON cbp.client_id = c.id
    WHERE cbp.status = 'blocked'
  `);

  for (const b of blocked.rows) {
    alerts.push({
      id: `bpmn-blocked-${b.client_id}`,
      clientId: b.client_id,
      clientName: b.client_name,
      type: 'critical',
      category: 'bpmn',
      message: `Cliente bloqueado no subprocesso ${b.current_subprocess}. Ação necessária.`,
      metric: 'BPMN',
      currentValue: 0,
      threshold: 0,
      createdAt: new Date().toISOString(),
    });
  }

  return alerts.map((alert) => ({
    ...alert,
    analysisWindow: alert.analysisWindow ?? 'Operacional BPMN (estado atual do fluxo e bloqueios)',
    learningWindow: alert.learningWindow ?? 'Sem janela de aprendizado aplicável para BPMN',
    learningWindowBasis: alert.learningWindowBasis ?? 'unknown',
  }));
};

