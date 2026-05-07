import { randomUUID } from 'crypto';
import type { Pool } from 'pg';

import type {
  MetaGovernanceIssueRecord,
  MetaGovernanceRepository,
  GovernanceRunContext,
  GovernanceCampaignRecord,
  GovernanceAdRecord,
  GovernanceAdSetRecord,
} from './service';
import type { MetaGovernanceEntityType, MetaGovernanceIssueStatus, MetaNamingOverrideRecord } from './types';

const normalizeAccountId = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.replace(/^act_/i, '');
};

const toIsoString = (value: unknown) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export class MetaGovernanceStore implements MetaGovernanceRepository {
  constructor(private pool: Pool) {}

  async loadContext(input: { clientId?: string; accountId?: string; syncId: string; dryRun: boolean }): Promise<GovernanceRunContext> {
    const resolved = await this.resolveClient(input.clientId, input.accountId);
    if (!resolved) {
      return {
        clientId: input.clientId ?? '',
        accountId: normalizeAccountId(input.accountId) ?? '',
        syncId: input.syncId,
        dryRun: input.dryRun,
        campaigns: [],
        adsets: [],
        ads: [],
      };
    }

    const campaignsResult = await this.pool.query(
      `SELECT
         c.id AS db_id,
         c."clientId" AS client_id,
         c."externalId" AS entity_external_id,
         c.name AS current_name,
         c.objective,
         c.created_time
       FROM campaigns c
       WHERE c."clientId" = $1
         AND c.platform = 'meta'
       ORDER BY c.name ASC`,
      [resolved.clientId],
    );

    const adsetsResult = await this.pool.query(
      `SELECT
         a.id AS db_id,
         a.adset_id AS entity_external_id,
         a.adset_name AS current_name,
         a.created_time,
         a.campaign_id AS campaign_db_id,
         ca."externalId" AS campaign_external_id,
         ca.name AS campaign_name,
         ca.objective AS campaign_objective,
         ROW_NUMBER() OVER (PARTITION BY a.campaign_id ORDER BY COALESCE(a.adset_name, ''), a.adset_id) AS sequence_number
       FROM adsets a
       JOIN campaigns ca ON ca.id = a.campaign_id
       WHERE ca."clientId" = $1
       ORDER BY ca.name ASC, sequence_number ASC`,
      [resolved.clientId],
    );

    const adsResult = await this.pool.query(
      `SELECT DISTINCT ON (m.ad_id)
         m.ad_id AS entity_external_id,
         m.ad_id AS db_id,
         m.ad_name AS current_name,
         m.ad_created_time AS created_time,
         m.campaign_id AS campaign_db_id,
         ca."externalId" AS campaign_external_id,
         ca.name AS campaign_name,
         m.adset_id AS adset_external_id
       FROM ad_creative_metrics m
       JOIN campaigns ca ON ca.id = m.campaign_id
       WHERE ca."clientId" = $1
       ORDER BY m.ad_id, m.date DESC`,
      [resolved.clientId],
    );

    const campaigns: GovernanceCampaignRecord[] = campaignsResult.rows.map((row) => ({
      clientId: resolved.clientId,
      entityType: 'campaign',
      entityExternalId: String(row.entity_external_id),
      dbId: String(row.db_id),
      currentName: row.current_name ? String(row.current_name) : null,
      objective: row.objective ? String(row.objective) : null,
      createdTime: toIsoString(row.created_time),
    }));

    const adsets: GovernanceAdSetRecord[] = adsetsResult.rows.map((row) => ({
      clientId: resolved.clientId,
      entityType: 'adset',
      entityExternalId: String(row.entity_external_id),
      dbId: String(row.db_id),
      currentName: row.current_name ? String(row.current_name) : null,
      createdTime: toIsoString(row.created_time),
      campaignDbId: String(row.campaign_db_id),
      campaignExternalId: String(row.campaign_external_id),
      campaignName: row.campaign_name ? String(row.campaign_name) : null,
      campaignObjective: row.campaign_objective ? String(row.campaign_objective) : null,
      sequenceNumber: Number(row.sequence_number ?? 1),
    }));

    const ads: GovernanceAdRecord[] = adsResult.rows.map((row) => ({
      clientId: resolved.clientId,
      entityType: 'ad',
      entityExternalId: String(row.entity_external_id),
      dbId: String(row.db_id),
      currentName: row.current_name ? String(row.current_name) : null,
      createdTime: toIsoString(row.created_time),
      campaignDbId: String(row.campaign_db_id),
      campaignExternalId: String(row.campaign_external_id),
      campaignName: row.campaign_name ? String(row.campaign_name) : null,
      adsetExternalId: row.adset_external_id ? String(row.adset_external_id) : null,
    }));

    return {
      clientId: resolved.clientId,
      accountId: resolved.accountId,
      syncId: input.syncId,
      dryRun: input.dryRun,
      campaigns,
      adsets,
      ads,
    };
  }

  async listOverrides(clientId: string): Promise<MetaNamingOverrideRecord[]> {
    const result = await this.pool.query(
      `SELECT
         id,
         client_id,
         entity_type,
         entity_external_id,
         product_key,
         theme_key,
         audience_key,
         override_payload,
         priority,
         active,
         created_at,
         updated_at
       FROM meta_naming_overrides
       WHERE client_id = $1
         AND active = TRUE
       ORDER BY priority DESC, created_at ASC`,
      [clientId],
    );

    return result.rows.map((row) => ({
      id: String(row.id),
      clientId: String(row.client_id),
      entityType: row.entity_type as MetaGovernanceEntityType,
      entityExternalId: row.entity_external_id ? String(row.entity_external_id) : null,
      productKey: row.product_key ? String(row.product_key) : null,
      themeKey: row.theme_key ? String(row.theme_key) : null,
      audienceKey: row.audience_key ? String(row.audience_key) : null,
      overridePayload: (row.override_payload as Record<string, unknown>) ?? {},
      priority: Number(row.priority ?? 0),
      active: Boolean(row.active),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  async upsertIssue(issue: MetaGovernanceIssueRecord): Promise<void> {
    const issueId = randomUUID();
    const issueKey = `${issue.clientId}:${issue.entityType}:${issue.entityExternalId}:${issue.issueType}:${issue.expectedName ?? ''}`;

    await this.pool.query(
      `INSERT INTO meta_governance_issues (
         id,
         issue_key,
         sync_id,
         client_id,
         account_id,
         entity_type,
         entity_external_id,
         campaign_id,
         issue_type,
         status,
         current_name,
         expected_name,
         current_created_time,
         expected_created_time,
         before_payload,
         after_payload,
         meta_error,
         db_error,
         details,
         first_seen_at,
         last_seen_at,
         resolved_at,
         auto_fixed,
         created_at,
         updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
         $11,$12,$13,$14,$15::jsonb,$16::jsonb,$17,$18,$19::jsonb,
         NOW(),NOW(),$20,$21,NOW(),NOW()
       )
       ON CONFLICT (issue_key)
       DO UPDATE SET
         sync_id = EXCLUDED.sync_id,
         account_id = EXCLUDED.account_id,
         campaign_id = EXCLUDED.campaign_id,
         status = EXCLUDED.status,
         current_name = EXCLUDED.current_name,
         expected_name = EXCLUDED.expected_name,
         current_created_time = EXCLUDED.current_created_time,
         expected_created_time = EXCLUDED.expected_created_time,
         before_payload = EXCLUDED.before_payload,
         after_payload = EXCLUDED.after_payload,
         meta_error = EXCLUDED.meta_error,
         db_error = EXCLUDED.db_error,
         details = EXCLUDED.details,
         last_seen_at = NOW(),
         resolved_at = EXCLUDED.resolved_at,
         auto_fixed = EXCLUDED.auto_fixed,
         updated_at = NOW()`,
      [
        issueId,
        issueKey,
        issue.syncId,
        issue.clientId,
        issue.accountId,
        issue.entityType,
        issue.entityExternalId,
        issue.campaignDbId,
        issue.issueType,
        issue.status,
        issue.currentName,
        issue.expectedName,
        issue.currentCreatedTime,
        issue.expectedCreatedTime,
        JSON.stringify(issue.beforePayload ?? {}),
        JSON.stringify(issue.afterPayload ?? {}),
        issue.metaError,
        issue.dbError,
        JSON.stringify(issue.details ?? {}),
        issue.resolvedAt,
        issue.autoFixed,
      ],
    );

    await this.pool.query(
      `UPDATE meta_governance_issues
       SET status = 'resolved',
           resolved_at = COALESCE(resolved_at, NOW()),
           last_seen_at = NOW(),
           updated_at = NOW()
       WHERE client_id = $1
         AND entity_type = $2
         AND entity_external_id = $3
         AND issue_key <> $4
         AND status IN ('open', 'needs_review', 'failed')`,
      [issue.clientId, issue.entityType, issue.entityExternalId, issueKey],
    );
  }

  async resolveIssuesForEntity(input: { clientId: string; entityType: MetaGovernanceEntityType; entityExternalId: string }): Promise<number> {
    const result = await this.pool.query(
      `UPDATE meta_governance_issues
       SET status = 'resolved',
           resolved_at = COALESCE(resolved_at, NOW()),
           last_seen_at = NOW(),
           updated_at = NOW()
       WHERE client_id = $1
         AND entity_type = $2
         AND entity_external_id = $3
         AND status IN ('open', 'needs_review', 'failed')
       RETURNING id`,
      [input.clientId, input.entityType, input.entityExternalId],
    );

    return result.rowCount ?? 0;
  }

  async updateCampaignCreatedTime(dbId: string, createdTime: string): Promise<void> {
    await this.pool.query(`UPDATE campaigns SET created_time = $2::timestamptz, "updatedAt" = NOW() WHERE id = $1`, [dbId, createdTime]);
  }

  async updateAdSetCreatedTime(dbId: string, createdTime: string): Promise<void> {
    await this.pool.query(`UPDATE adsets SET created_time = $2::timestamptz, updated_at = NOW() WHERE id = $1`, [dbId, createdTime]);
  }

  async updateAdCreatedTime(dbId: string, createdTime: string): Promise<void> {
    await this.pool.query(`UPDATE ad_creative_metrics SET ad_created_time = $2::timestamptz, updated_at = NOW() WHERE ad_id = $1`, [dbId, createdTime]);
  }

  async updateCampaignName(dbId: string, name: string): Promise<void> {
    await this.pool.query(`UPDATE campaigns SET name = $2, "updatedAt" = NOW() WHERE id = $1`, [dbId, name]);
  }

  async updateAdSetName(dbId: string, name: string): Promise<void> {
    await this.pool.query(`UPDATE adsets SET adset_name = $2, updated_at = NOW() WHERE id = $1`, [dbId, name]);
  }

  async updateAdName(dbId: string, name: string): Promise<void> {
    await this.pool.query(`UPDATE ad_creative_metrics SET ad_name = $2, updated_at = NOW() WHERE ad_id = $1`, [dbId, name]);
  }

  async listIssues(filters: {
    clientId?: string;
    syncId?: string;
    status?: string;
    entityType?: string;
    issueType?: string;
    limit?: number;
    offset?: number;
  }) {
    const { where, values } = this.buildIssueWhere(filters);
    const limit = Number.isFinite(filters.limit) ? Number(filters.limit) : 20;
    const offset = Number.isFinite(filters.offset) ? Number(filters.offset) : 0;
    const params = [...values, limit, offset];

    const result = await this.pool.query(
      `SELECT *
       FROM meta_governance_issues
       ${where}
       ORDER BY last_seen_at DESC, created_at DESC
       LIMIT $${values.length + 1}
       OFFSET $${values.length + 2}`,
      params,
    );

    const countResult = await this.pool.query(`SELECT COUNT(*)::int AS total FROM meta_governance_issues ${where}`, values);

    return {
      items: result.rows.map((row) => this.mapIssueRow(row)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async getIssueById(id: string) {
    const result = await this.pool.query(`SELECT * FROM meta_governance_issues WHERE id = $1 LIMIT 1`, [id]);
    if (result.rows.length === 0) return null;
    return this.mapIssueRow(result.rows[0]);
  }

  private async resolveClient(clientId?: string, accountId?: string) {
    if (clientId) {
      const result = await this.pool.query(
        `SELECT id, "metaAdAccountId" AS account_id
         FROM clients
         WHERE id = $1
         LIMIT 1`,
        [clientId],
      );

      if (result.rows.length > 0) {
        return {
          clientId: String(result.rows[0].id),
          accountId: normalizeAccountId(result.rows[0].account_id) ?? normalizeAccountId(accountId) ?? '',
        };
      }
    }

    const normalizedAccountId = normalizeAccountId(accountId);
    if (!normalizedAccountId) return null;

    const result = await this.pool.query(
      `SELECT id, "metaAdAccountId" AS account_id
       FROM clients
       WHERE regexp_replace(COALESCE("metaAdAccountId", ''), '^act_', '', 'i') = $1
       LIMIT 1`,
      [normalizedAccountId],
    );

    if (result.rows.length === 0) return null;

    return {
      clientId: String(result.rows[0].id),
      accountId: normalizeAccountId(result.rows[0].account_id) ?? normalizedAccountId,
    };
  }

  private buildIssueWhere(filters: {
    clientId?: string;
    syncId?: string;
    status?: string;
    entityType?: string;
    issueType?: string;
  }) {
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (filters.clientId) {
      values.push(filters.clientId);
      clauses.push(`client_id = $${values.length}`);
    }
    if (filters.syncId) {
      values.push(filters.syncId);
      clauses.push(`sync_id = $${values.length}`);
    }
    if (filters.status) {
      values.push(filters.status);
      clauses.push(`status = $${values.length}`);
    }
    if (filters.entityType) {
      values.push(filters.entityType);
      clauses.push(`entity_type = $${values.length}`);
    }
    if (filters.issueType) {
      values.push(filters.issueType);
      clauses.push(`issue_type = $${values.length}`);
    }

    return {
      where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      values,
    };
  }

  private mapIssueRow(row: any) {
    return {
      id: String(row.id),
      syncId: String(row.sync_id),
      clientId: String(row.client_id),
      accountId: row.account_id ? String(row.account_id) : null,
      entityType: row.entity_type as MetaGovernanceEntityType,
      entityExternalId: String(row.entity_external_id),
      campaignId: row.campaign_id ? String(row.campaign_id) : null,
      issueType: String(row.issue_type),
      status: row.status as MetaGovernanceIssueStatus,
      currentName: row.current_name ? String(row.current_name) : null,
      expectedName: row.expected_name ? String(row.expected_name) : null,
      currentCreatedTime: toIsoString(row.current_created_time),
      expectedCreatedTime: toIsoString(row.expected_created_time),
      beforePayload: row.before_payload ?? null,
      afterPayload: row.after_payload ?? null,
      metaError: row.meta_error ? String(row.meta_error) : null,
      dbError: row.db_error ? String(row.db_error) : null,
      details: row.details ?? null,
      firstSeenAt: toIsoString(row.first_seen_at),
      lastSeenAt: toIsoString(row.last_seen_at),
      resolvedAt: toIsoString(row.resolved_at),
      autoFixed: Boolean(row.auto_fixed),
      createdAt: toIsoString(row.created_at),
      updatedAt: toIsoString(row.updated_at),
    };
  }
}
