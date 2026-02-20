import type { Pool } from 'pg';

import { getDateRange } from './metrics/date-range';
import { validateCreativeCopy, type CopyValidationIssue } from './creative-linter';

export type ComplianceRiskSeverity = 'low' | 'warning' | 'critical';

export type ComplianceRiskCreative = {
  snapshotId: string;
  headline: string | null;
  ctaType: string | null;
  score: number;
  severity: ComplianceRiskSeverity;
  issues: CopyValidationIssue[];
  campaignIds: string[];
};

export type ComplianceRiskCampaign = {
  campaignId: string;
  total: number;
  critical: number;
  warning: number;
  low: number;
};

export type ComplianceRiskResponse = {
  clientId: string;
  period: { start: string; end: string };
  creatives: ComplianceRiskCreative[];
  campaigns: ComplianceRiskCampaign[];
  summary: { total: number; critical: number; warning: number; low: number };
};

const resolveSeverity = (score: number, summary: { errors: number; warnings: number }) => {
  if (summary.errors > 0 || score < 60) return 'critical';
  if (summary.warnings > 0 || score < 80) return 'warning';
  return 'low';
};

export class ComplianceRiskService {
  constructor(private pool: Pool) {}

  async getComplianceRisk(params: {
    clientId: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    campaignId?: string | null;
  }): Promise<ComplianceRiskResponse> {
    const { clientId, campaignId } = params;
    const period = getDateRange(params.period || '30d', params.startDate, params.endDate);

    const rows = await this.pool.query(
      `SELECT
        s.id as snapshot_id,
        s.headline,
        s.primary_text,
        s.description,
        s.cta_type,
        array_agg(DISTINCT m.campaign_id) as campaign_ids
      FROM ad_creative_metrics m
      JOIN campaigns c ON c.id = m.campaign_id
      JOIN ad_creative_snapshots s ON s.id = m.creative_snapshot_id
      WHERE c."clientId" = $1
        AND m.date >= $2
        AND m.date <= $3
        AND m.creative_snapshot_id IS NOT NULL
        AND ($4::text IS NULL OR m.campaign_id = $4)
      GROUP BY s.id, s.headline, s.primary_text, s.description, s.cta_type`,
      [clientId, period.start, period.end, campaignId ?? null]
    );

    const campaignAgg = new Map<string, ComplianceRiskCampaign>();
    const creatives: ComplianceRiskCreative[] = [];
    const summary = { total: 0, critical: 0, warning: 0, low: 0 };

    for (const row of rows.rows) {
      const validation = validateCreativeCopy({
        headline: row.headline ?? undefined,
        primaryText: row.primary_text ?? undefined,
        description: row.description ?? undefined,
        ctaType: row.cta_type ?? undefined,
      });
      const severity = resolveSeverity(validation.score, validation.summary);

      summary.total += 1;
      summary[severity] += 1;

      const campaignIds = Array.isArray(row.campaign_ids)
        ? row.campaign_ids.map((id: any) => String(id))
        : [];

      creatives.push({
        snapshotId: row.snapshot_id,
        headline: row.headline ?? null,
        ctaType: row.cta_type ?? null,
        score: validation.score,
        severity,
        issues: validation.issues,
        campaignIds,
      });

      for (const id of campaignIds) {
        const current =
          campaignAgg.get(id) ?? { campaignId: id, total: 0, critical: 0, warning: 0, low: 0 };
        current.total += 1;
        current[severity] += 1;
        campaignAgg.set(id, current);
      }
    }

    return {
      clientId,
      period,
      creatives,
      campaigns: Array.from(campaignAgg.values()),
      summary,
    };
  }
}
