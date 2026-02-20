/**
 * Performance Alert Service
 * Generates performance alerts based on campaign metrics and BPMN status
 */

import type { Pool } from 'pg';

import { buildBpmnAlerts } from './performance-alert/bpmn-alerts';
import { buildCampaignPerformanceAlerts } from './performance-alert/campaign-alerts';
import { buildCreativeAlerts } from './performance-alert/creative-alerts';
import { buildSyncAlerts } from './performance-alert/sync-alerts';
import type { PerformanceAlert } from './performance-alert/types';

export type { PerformanceAlert } from './performance-alert/types';

export class PerformanceAlertService {
  constructor(private pool: Pool) {}

  async getPerformanceAlerts(): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [
      ...(await buildCampaignPerformanceAlerts(this.pool)),
      ...(await buildCreativeAlerts(this.pool)),
      ...(await buildBpmnAlerts(this.pool)),
      ...(await buildSyncAlerts(this.pool)),
    ];

    alerts.sort((a, b) => {
      const scoreA = this.getAlertPriorityScore(a);
      const scoreB = this.getAlertPriorityScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;

      const createdAtA = new Date(a.createdAt).getTime();
      const createdAtB = new Date(b.createdAt).getTime();
      if (Number.isFinite(createdAtA) && Number.isFinite(createdAtB) && createdAtA !== createdAtB) {
        return createdAtB - createdAtA;
      }

      return a.id.localeCompare(b.id);
    });

    return alerts;
  }

  private getAlertPriorityScore(alert: PerformanceAlert): number {
    const severityWeight: Record<PerformanceAlert['type'], number> = {
      critical: 10_000,
      warning: 5_000,
      info: 1_000,
    };

    const categoryBoost: Record<string, number> = {
      bpmn: 900,
      sync: 700,
      contacts: 600,
      qualification: 500,
      roas: 450,
      budget: 350,
      trend: 300,
      'creative-fatigue': 250,
      creative: 200,
      ctr: 180,
      'creative-video': 120,
      'creative-winner': 10,
    };

    const threshold = Number.isFinite(alert.threshold) ? alert.threshold : 0;
    const current = Number.isFinite(alert.currentValue) ? alert.currentValue : 0;

    // Impact delta: for most alerts higher currentValue than threshold is worse.
    // For alerts where zero/low is bad (threshold > current), this still captures severity by absolute gap.
    const relativeGap = threshold !== 0 ? Math.abs((current - threshold) / Math.abs(threshold)) : Math.abs(current - threshold);
    const boundedImpact = Math.min(1_500, Math.round(relativeGap * 1_000));

    return (
      severityWeight[alert.type] +
      (categoryBoost[alert.category] ?? 100) +
      boundedImpact
    );
  }
}
