import type { Pool } from 'pg';
import type { NotificationService } from './notification-service';

export type AnomalyType =
  | 'anomaly_cpl_spike'
  | 'anomaly_conversations_drop'
  | 'anomaly_overspend'
  | 'anomaly_ctr_drop';

export type AnomalyDetection = {
  id?: string;
  clientId: string;
  campaignId: string;
  campaignName: string;
  anomalyType: AnomalyType;
  severity: 'warning' | 'critical';
  metricCurrent: number;
  metricBaseline: number;
  changePct: number;
  description: string;
  acknowledged: boolean;
  createdAt?: string;
};

const THRESHOLDS = {
  cpl_spike_warning: 40,     // CPL up 40%+
  cpl_spike_critical: 80,    // CPL up 80%+
  conversations_drop_warning: 50,  // Conversations down 50%+
  conversations_drop_critical: 75, // Conversations down 75%+
  overspend_warning: 120,    // 120% of expected daily spend
  overspend_critical: 150,   // 150% of expected daily spend
  ctr_drop_warning: 30,      // CTR down 30%+
  ctr_drop_critical: 50,     // CTR down 50%+
};

export class AnomalyDetectionService {
  constructor(
    private pool: Pool,
    private notifications: NotificationService
  ) { }

  async detectAnomalies(clientId: string): Promise<AnomalyDetection[]> {
    // Get campaign metrics: last 3 days vs previous 7 days
    const result = await this.pool.query(
      `WITH recent AS (
        SELECT
          cm.campaign_id,
          c.name as campaign_name,
          COALESCE(SUM(cm.spend), 0)::float as spend,
          COALESCE(SUM(cm.messaging_conversations), 0)::int as conversations,
          COALESCE(SUM(cm.impressions), 0)::int as impressions,
          COALESCE(SUM(cm.clicks), 0)::int as clicks,
          COUNT(DISTINCT cm.date)::int as days
        FROM campaign_metrics cm
        JOIN campaigns c ON c.id = cm.campaign_id
        WHERE c."clientId" = $1
          AND cm.date >= CURRENT_DATE - INTERVAL '3 days'
          AND cm.date < CURRENT_DATE
        GROUP BY cm.campaign_id, c.name
      ),
      baseline AS (
        SELECT
          cm.campaign_id,
          COALESCE(SUM(cm.spend), 0)::float as spend,
          COALESCE(SUM(cm.messaging_conversations), 0)::int as conversations,
          COALESCE(SUM(cm.impressions), 0)::int as impressions,
          COALESCE(SUM(cm.clicks), 0)::int as clicks,
          COUNT(DISTINCT cm.date)::int as days
        FROM campaign_metrics cm
        JOIN campaigns c ON c.id = cm.campaign_id
        WHERE c."clientId" = $1
          AND cm.date >= CURRENT_DATE - INTERVAL '10 days'
          AND cm.date < CURRENT_DATE - INTERVAL '3 days'
        GROUP BY cm.campaign_id
      )
      SELECT
        r.campaign_id,
        r.campaign_name,
        r.spend as recent_spend,
        r.conversations as recent_conversations,
        r.impressions as recent_impressions,
        r.clicks as recent_clicks,
        r.days as recent_days,
        COALESCE(b.spend, 0) as baseline_spend,
        COALESCE(b.conversations, 0) as baseline_conversations,
        COALESCE(b.impressions, 0) as baseline_impressions,
        COALESCE(b.clicks, 0) as baseline_clicks,
        COALESCE(b.days, 1) as baseline_days
      FROM recent r
      LEFT JOIN baseline b ON r.campaign_id = b.campaign_id
      WHERE r.spend > 10`,
      [clientId]
    );

    const anomalies: AnomalyDetection[] = [];

    for (const row of result.rows) {
      const recentDays = row.recent_days || 1;
      const baselineDays = row.baseline_days || 1;

      // Normalize to daily averages
      const recentDailySpend = row.recent_spend / recentDays;
      const baselineDailySpend = row.baseline_spend / baselineDays;
      const recentDailyConv = row.recent_conversations / recentDays;
      const baselineDailyConv = row.baseline_conversations / baselineDays;
      const recentCtr = row.recent_impressions > 0 ? (row.recent_clicks / row.recent_impressions) * 100 : 0;
      const baselineCtr = row.baseline_impressions > 0 ? (row.baseline_clicks / row.baseline_impressions) * 100 : 0;
      const recentCpl = row.recent_conversations > 0 ? row.recent_spend / row.recent_conversations : null;
      const baselineCpl = row.baseline_conversations > 0 ? row.baseline_spend / row.baseline_conversations : null;

      // CPL Spike
      if (recentCpl != null && baselineCpl != null && baselineCpl > 0) {
        const changePct = ((recentCpl - baselineCpl) / baselineCpl) * 100;
        if (changePct >= THRESHOLDS.cpl_spike_warning) {
          const severity = changePct >= THRESHOLDS.cpl_spike_critical ? 'critical' : 'warning';
          anomalies.push({
            clientId,
            campaignId: row.campaign_id,
            campaignName: row.campaign_name,
            anomalyType: 'anomaly_cpl_spike',
            severity,
            metricCurrent: recentCpl,
            metricBaseline: baselineCpl,
            changePct,
            description: `CPL subiu ${changePct.toFixed(0)}% (R$ ${baselineCpl.toFixed(2)} → R$ ${recentCpl.toFixed(2)}) em "${row.campaign_name}"`,
            acknowledged: false,
          });
        }
      }

      // Conversations Drop
      if (baselineDailyConv >= 1) {
        const changePct = ((baselineDailyConv - recentDailyConv) / baselineDailyConv) * 100;
        if (changePct >= THRESHOLDS.conversations_drop_warning) {
          const severity = changePct >= THRESHOLDS.conversations_drop_critical ? 'critical' : 'warning';
          anomalies.push({
            clientId,
            campaignId: row.campaign_id,
            campaignName: row.campaign_name,
            anomalyType: 'anomaly_conversations_drop',
            severity,
            metricCurrent: recentDailyConv,
            metricBaseline: baselineDailyConv,
            changePct: -changePct,
            description: `Conversas caíram ${changePct.toFixed(0)}% (${baselineDailyConv.toFixed(1)}/dia → ${recentDailyConv.toFixed(1)}/dia) em "${row.campaign_name}"`,
            acknowledged: false,
          });
        }
      }

      // Overspend
      if (baselineDailySpend > 5) {
        const spendRatio = (recentDailySpend / baselineDailySpend) * 100;
        if (spendRatio >= THRESHOLDS.overspend_warning) {
          const severity = spendRatio >= THRESHOLDS.overspend_critical ? 'critical' : 'warning';
          anomalies.push({
            clientId,
            campaignId: row.campaign_id,
            campaignName: row.campaign_name,
            anomalyType: 'anomaly_overspend',
            severity,
            metricCurrent: recentDailySpend,
            metricBaseline: baselineDailySpend,
            changePct: spendRatio - 100,
            description: `Spend ${(spendRatio - 100).toFixed(0)}% acima do ritmo normal (R$ ${baselineDailySpend.toFixed(2)}/dia → R$ ${recentDailySpend.toFixed(2)}/dia) em "${row.campaign_name}"`,
            acknowledged: false,
          });
        }
      }

      // CTR Drop
      if (baselineCtr > 0.3) {
        const changePct = ((baselineCtr - recentCtr) / baselineCtr) * 100;
        if (changePct >= THRESHOLDS.ctr_drop_warning) {
          const severity = changePct >= THRESHOLDS.ctr_drop_critical ? 'critical' : 'warning';
          anomalies.push({
            clientId,
            campaignId: row.campaign_id,
            campaignName: row.campaign_name,
            anomalyType: 'anomaly_ctr_drop',
            severity,
            metricCurrent: recentCtr,
            metricBaseline: baselineCtr,
            changePct: -changePct,
            description: `CTR caiu ${changePct.toFixed(0)}% (${baselineCtr.toFixed(2)}% → ${recentCtr.toFixed(2)}%) em "${row.campaign_name}"`,
            acknowledged: false,
          });
        }
      }
    }

    // Save anomalies and create notifications
    for (const anomaly of anomalies) {
      try {
        const saveResult = await this.pool.query(
          `INSERT INTO anomaly_detections (client_id, campaign_id, campaign_name, anomaly_type, severity, metric_current, metric_baseline, change_pct, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [anomaly.clientId, anomaly.campaignId, anomaly.campaignName, anomaly.anomalyType, anomaly.severity, anomaly.metricCurrent, anomaly.metricBaseline, anomaly.changePct, anomaly.description]
        );
        anomaly.id = saveResult.rows[0]?.id;

        await this.notifications.create({
          clientId: anomaly.clientId,
          type: anomaly.anomalyType as any,
          severity: anomaly.severity,
          title: this.getAnomalyTitle(anomaly.anomalyType),
          message: anomaly.description,
          metadata: {
            campaignId: anomaly.campaignId,
            campaignName: anomaly.campaignName,
            metricCurrent: anomaly.metricCurrent,
            metricBaseline: anomaly.metricBaseline,
            changePct: anomaly.changePct,
          },
          expiresInHours: 72,
        });
      } catch (err) {
        // Non-fatal: continue with other anomalies
      }
    }

    return anomalies;
  }

  async getRecentAnomalies(clientId: string, days: number = 7): Promise<AnomalyDetection[]> {
    const result = await this.pool.query(
      `SELECT id, client_id, campaign_id, campaign_name, anomaly_type, severity,
              metric_current, metric_baseline, change_pct, description, acknowledged, created_at
       FROM anomaly_detections
       WHERE client_id = $1 AND created_at >= NOW() - ($2 || ' days')::interval
       ORDER BY created_at DESC
       LIMIT 50`,
      [clientId, days]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      clientId: row.client_id,
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      anomalyType: row.anomaly_type,
      severity: row.severity,
      metricCurrent: parseFloat(row.metric_current) || 0,
      metricBaseline: parseFloat(row.metric_baseline) || 0,
      changePct: parseFloat(row.change_pct) || 0,
      description: row.description,
      acknowledged: row.acknowledged,
      createdAt: row.created_at,
    }));
  }

  async acknowledgeAnomaly(anomalyId: string): Promise<void> {
    await this.pool.query(
      'UPDATE anomaly_detections SET acknowledged = true WHERE id = $1',
      [anomalyId]
    );
  }

  async getGlobalAnomalies(limit: number = 20): Promise<AnomalyDetection[]> {
    const result = await this.pool.query(
      `SELECT ad.id, ad.client_id, c.name as client_name, ad.campaign_id, ad.campaign_name, ad.anomaly_type, ad.severity,
              ad.metric_current, ad.metric_baseline, ad.change_pct, ad.description, ad.acknowledged, ad.created_at
       FROM anomaly_detections ad
       JOIN clients c ON c.id = ad.client_id
       WHERE ad.created_at >= NOW() - INTERVAL '24 hours'
         AND ad.severity = 'critical'
         AND ad.acknowledged = false
       ORDER BY ad.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name, // Extended field
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      anomalyType: row.anomaly_type,
      severity: row.severity,
      metricCurrent: parseFloat(row.metric_current) || 0,
      metricBaseline: parseFloat(row.metric_baseline) || 0,
      changePct: parseFloat(row.change_pct) || 0,
      description: row.description,
      acknowledged: row.acknowledged,
      createdAt: row.created_at,
    }));
  }

  async getUnacknowledgedCount(clientId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int as count FROM anomaly_detections
       WHERE client_id = $1 AND acknowledged = false AND created_at >= NOW() - INTERVAL '7 days'`,
      [clientId]
    );
    return result.rows[0]?.count || 0;
  }

  private getAnomalyTitle(type: AnomalyType): string {
    const titles: Record<AnomalyType, string> = {
      anomaly_cpl_spike: 'CPL em alta',
      anomaly_conversations_drop: 'Queda de conversas',
      anomaly_overspend: 'Gasto acima do esperado',
      anomaly_ctr_drop: 'Queda de CTR',
    };
    return titles[type] || 'Anomalia detectada';
  }
}
