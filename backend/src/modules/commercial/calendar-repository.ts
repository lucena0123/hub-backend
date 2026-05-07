import type { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type {
  CommercialCalendarConfigRecord,
  CommercialCalendarReconciliationItem,
  ResolveCommercialCalendarReconciliationInput,
  UpsertCommercialCalendarConfigInput,
} from './types';
import { mapCalendarConfigRow, mapCalendarReconciliationRow } from './mappers';
import type {
  CommercialCalendarReconciliationListFilters,
  EnqueueCalendarReconciliationInput,
} from './repository-types';

export class CommercialCalendarRepository {
  constructor(private readonly pool: Pool) {}

  async listCalendarConfigs(): Promise<CommercialCalendarConfigRecord[]> {
    const result = await this.pool.query(
      `SELECT id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at
       FROM commercial_calendar_configs
       ORDER BY responsavel_key ASC`,
    );

    return result.rows.map((row) => mapCalendarConfigRow(row));
  }

  async listActiveCalendarConfigs(): Promise<CommercialCalendarConfigRecord[]> {
    const result = await this.pool.query(
      `SELECT id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at
       FROM commercial_calendar_configs
       WHERE is_active = TRUE
       ORDER BY responsavel_key ASC`,
    );

    return result.rows.map((row) => mapCalendarConfigRow(row));
  }

  async createCalendarConfig(input: UpsertCommercialCalendarConfigInput): Promise<CommercialCalendarConfigRecord> {
    const inserted = await this.pool.query(
      `INSERT INTO commercial_calendar_configs
        (id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
       RETURNING id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at`,
      [
        uuidv4(),
        input.responsavelKey,
        input.calendarId,
        input.bookingUrl,
        input.ownerEmail,
        input.timezone || 'America/Sao_Paulo',
        input.isActive !== false,
      ],
    );

    return mapCalendarConfigRow(inserted.rows[0]);
  }

  async updateCalendarConfig(
    id: string,
    input: Partial<UpsertCommercialCalendarConfigInput>,
  ): Promise<CommercialCalendarConfigRecord | null> {
    const updated = await this.pool.query(
      `UPDATE commercial_calendar_configs
       SET responsavel_key = COALESCE($2, responsavel_key),
           calendar_id = COALESCE($3, calendar_id),
           booking_url = COALESCE($4, booking_url),
           owner_email = COALESCE($5, owner_email),
           timezone = COALESCE($6, timezone),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at`,
      [
        id,
        input.responsavelKey?.trim() || null,
        input.calendarId?.trim() || null,
        input.bookingUrl?.trim() || null,
        input.ownerEmail?.trim().toLowerCase() || null,
        input.timezone?.trim() || null,
        input.isActive ?? null,
      ],
    );

    return updated.rows[0] ? mapCalendarConfigRow(updated.rows[0]) : null;
  }

  async findActiveCalendarConfigByResponsavel(responsavel: string): Promise<CommercialCalendarConfigRecord | null> {
    const key = responsavel.trim();
    if (!key) return null;

    const result = await this.pool.query(
      `SELECT id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at
       FROM commercial_calendar_configs
       WHERE is_active = TRUE
         AND (
           responsavel_key = $1
           OR LOWER(responsavel_key) = LOWER($1)
         )
       ORDER BY updated_at DESC
       LIMIT 1`,
      [key],
    );

    return result.rows[0] ? mapCalendarConfigRow(result.rows[0]) : null;
  }

  async listCalendarReconciliationQueue(
    filters?: CommercialCalendarReconciliationListFilters,
  ): Promise<CommercialCalendarReconciliationItem[]> {
    const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 250);
    const params: unknown[] = [];
    const where: string[] = [];

    if (filters?.status) {
      params.push(filters.status);
      where.push(`status = $${params.length}`);
    }

    params.push(limit);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await this.pool.query(
      `SELECT id, calendar_config_id, google_event_id, attendee_email, event_start, event_end, payload_json,
              reason_code, status, lead_id, resolved_by, resolved_at, created_at, updated_at
       FROM commercial_scheduling_reconciliation_queue
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => mapCalendarReconciliationRow(row));
  }

  async findCalendarReconciliationPayload(id: string): Promise<Record<string, unknown> | null> {
    const current = await this.pool.query(
      `SELECT id, payload_json
       FROM commercial_scheduling_reconciliation_queue
       WHERE id = $1
       LIMIT 1`,
      [id],
    );

    const row = current.rows[0];
    return row ? ((row.payload_json || {}) as Record<string, unknown>) : null;
  }

  async updateCalendarReconciliation(
    id: string,
    input: ResolveCommercialCalendarReconciliationInput,
  ): Promise<CommercialCalendarReconciliationItem> {
    const updated = await this.pool.query(
      `UPDATE commercial_scheduling_reconciliation_queue
       SET status = $2,
           lead_id = COALESCE($3, lead_id),
           resolved_by = $4,
           resolved_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, calendar_config_id, google_event_id, attendee_email, event_start, event_end, payload_json,
                 reason_code, status, lead_id, resolved_by, resolved_at, created_at, updated_at`,
      [id, input.status, input.leadId || null, input.resolvedBy || null],
    );

    return mapCalendarReconciliationRow(updated.rows[0]);
  }

  async enqueueCalendarReconciliation(input: EnqueueCalendarReconciliationInput): Promise<number> {
    const existing = await this.pool.query(
      `SELECT id
       FROM commercial_scheduling_reconciliation_queue
       WHERE calendar_config_id = $1
         AND google_event_id = $2
         AND reason_code = $3
         AND status = 'pending'
       LIMIT 1`,
      [input.calendarConfigId, input.googleEventId, input.reasonCode],
    );

    if (existing.rows[0]) {
      await this.pool.query(
        `UPDATE commercial_scheduling_reconciliation_queue
         SET attendee_email = COALESCE($2, attendee_email),
             event_start = COALESCE($3::timestamptz, event_start),
             event_end = COALESCE($4::timestamptz, event_end),
             payload_json = $5::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [
          existing.rows[0].id,
          input.attendeeEmail,
          input.eventStart,
          input.eventEnd,
          JSON.stringify(input.payload),
        ],
      );
      return 0;
    }

    await this.pool.query(
      `INSERT INTO commercial_scheduling_reconciliation_queue
        (id, calendar_config_id, google_event_id, attendee_email, event_start, event_end, payload_json, reason_code, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,'pending',NOW(),NOW())`,
      [
        uuidv4(),
        input.calendarConfigId,
        input.googleEventId,
        input.attendeeEmail,
        input.eventStart,
        input.eventEnd,
        JSON.stringify(input.payload),
        input.reasonCode,
      ],
    );

    return 1;
  }
}
