import type { Pool } from 'pg';

import type { PerformanceAlert } from './types';
import { safeInt } from './utils';

export const buildSyncAlerts = async (pool: Pool): Promise<PerformanceAlert[]> => {
  const alerts: PerformanceAlert[] = [];

  // Sync health (Meta)
  const recentSync = await pool.query(`
    SELECT
      id,
      platform,
      account_id,
      status,
      date_range_start,
      date_range_end,
      started_at,
      completed_at,
      error_message,
      COALESCE(array_length(unmapped_campaigns, 1), 0) as unmapped_count
    FROM sync_history
    WHERE platform = 'meta'
    ORDER BY started_at DESC
    LIMIT 5
  `);

  if (recentSync.rows.length === 0) {
    alerts.push({
      id: 'sync-missing-meta',
      clientId: 'system',
      clientName: 'Sistema',
      type: 'warning',
      category: 'sync',
      message: 'Nenhum sync da Meta foi encontrado. Se já existem campanhas ativas, execute um sync para atualizar os dados.',
      metric: 'Sync',
      currentValue: 0,
      threshold: 1,
      createdAt: new Date().toISOString(),
    });
    return alerts;
  }

  const latest = recentSync.rows[0];
  const latestTimestamp = latest.completed_at ?? latest.started_at;
  const hoursSinceLatest = (Date.now() - new Date(latestTimestamp).getTime()) / (1000 * 60 * 60);

  if (Number.isFinite(hoursSinceLatest) && hoursSinceLatest > 24) {
    alerts.push({
      id: 'sync-stale-meta',
      clientId: 'system',
      clientName: 'Sistema',
      type: 'warning',
      category: 'sync',
      message: `Último sync da Meta ocorreu há ${Math.round(hoursSinceLatest)}h. Recomenda-se sincronizar para dados atualizados.`,
      metric: 'Sync',
      currentValue: Math.round(hoursSinceLatest),
      threshold: 24,
      createdAt: new Date().toISOString(),
    });
  }

  const stuck = recentSync.rows.find((row) => row.completed_at == null && row.started_at != null);
  if (stuck) {
    const started = new Date(stuck.started_at).getTime();
    const minutesRunning = (Date.now() - started) / (1000 * 60);
    if (Number.isFinite(minutesRunning) && minutesRunning > 30) {
      alerts.push({
        id: `sync-stuck-${stuck.id}`,
        clientId: 'system',
        clientName: 'Sistema',
        type: 'warning',
        category: 'sync',
        message: `Sync da Meta parece estar demorando (${Math.round(minutesRunning)} min). Se continuar, revise logs/credenciais.`,
        metric: 'Sync',
        currentValue: Math.round(minutesRunning),
        threshold: 30,
        createdAt: new Date().toISOString(),
      });
    }
  }

  for (const row of recentSync.rows) {
    if (row.status === 'failed') {
      alerts.push({
        id: `sync-failed-${row.id}`,
        clientId: 'system',
        clientName: 'Sistema',
        type: 'critical',
        category: 'sync',
        message: `Sync da Meta falhou (${row.date_range_start} → ${row.date_range_end}). ${row.error_message || 'Verifique logs e tente novamente.'}`,
        metric: 'Sync',
        currentValue: 0,
        threshold: 1,
        createdAt: new Date().toISOString(),
      });
    } else if (row.status === 'partial' || safeInt(row.unmapped_count) > 0) {
      const unmapped = safeInt(row.unmapped_count);
      alerts.push({
        id: `sync-partial-${row.id}`,
        clientId: 'system',
        clientName: 'Sistema',
        type: 'warning',
        category: 'sync',
        message: `Sync da Meta foi parcial (${row.date_range_start} → ${row.date_range_end}). ${unmapped > 0 ? `${unmapped} campanhas não mapeadas.` : 'Alguns dados podem ter ficado incompletos.'}`,
        metric: 'Sync',
        currentValue: unmapped,
        threshold: 0,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return alerts.map((alert) => ({
    ...alert,
    analysisWindow: alert.analysisWindow ?? 'Operacional de sincronização (janela recente de execução)',
    learningWindow: alert.learningWindow ?? 'Sem janela de aprendizado aplicável para sync',
    learningWindowBasis: alert.learningWindowBasis ?? 'unknown',
  }));
};

