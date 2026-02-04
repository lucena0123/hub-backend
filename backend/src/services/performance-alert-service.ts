/**
 * Performance Alert Service
 * Generates performance alerts based on campaign metrics and BPMN status
 */

import type { Pool } from 'pg';

import { buildBpmnAlerts } from './performance-alert/bpmn-alerts';
import { buildCampaignPerformanceAlerts } from './performance-alert/campaign-alerts';
import { buildSyncAlerts } from './performance-alert/sync-alerts';
import type { PerformanceAlert } from './performance-alert/types';

export type { PerformanceAlert } from './performance-alert/types';

export class PerformanceAlertService {
  constructor(private pool: Pool) {}

  async getPerformanceAlerts(): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [
      ...(await buildCampaignPerformanceAlerts(this.pool)),
      ...(await buildBpmnAlerts(this.pool)),
      ...(await buildSyncAlerts(this.pool)),
    ];

    const priority = { critical: 0, warning: 1, info: 2 } as const;
    alerts.sort((a, b) => priority[a.type] - priority[b.type]);

    return alerts;
  }
}

