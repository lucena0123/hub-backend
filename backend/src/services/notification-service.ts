/**
 * NotificationService — CRUD for in-system notifications.
 */

import type { Pool } from 'pg';

export type NotificationType =
  | 'proposal_created'
  | 'execution_completed'
  | 'execution_failed'
  | 'sync_completed'
  | 'sync_failed'
  | 'pacing_warning'
  | 'pacing_critical'
  | 'anomaly_cpl_spike'
  | 'anomaly_conversations_drop'
  | 'anomaly_overspend'
  | 'anomaly_ctr_drop';

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface CreateNotificationParams {
  clientId?: string | null;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  expiresInHours?: number;
}

export interface NotificationRow {
  id: string;
  clientId: string | null;
  type: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export class NotificationService {
  constructor(private pool: Pool) {}

  async create(params: CreateNotificationParams): Promise<string> {
    const expiresAt = params.expiresInHours
      ? new Date(Date.now() + params.expiresInHours * 3600_000).toISOString()
      : null;

    const result = await this.pool.query(
      `INSERT INTO notifications (client_id, type, severity, title, message, metadata, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       RETURNING id`,
      [
        params.clientId ?? null,
        params.type,
        params.severity,
        params.title,
        params.message,
        JSON.stringify(params.metadata ?? {}),
        expiresAt,
      ]
    );

    return String(result.rows[0].id);
  }

  async list(params: {
    clientId?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationRow[]> {
    const { clientId, read, limit = 50, offset = 0 } = params;

    const conditions = ['(expires_at IS NULL OR expires_at > NOW())'];
    const values: unknown[] = [];
    let idx = 1;

    if (clientId) {
      conditions.push(`client_id = $${idx++}`);
      values.push(clientId);
    }

    if (typeof read === 'boolean') {
      conditions.push(`read = $${idx++}`);
      values.push(read);
    }

    values.push(limit, offset);

    const result = await this.pool.query(
      `SELECT id, client_id, type, severity, title, message, metadata, read, read_at, created_at, expires_at
       FROM notifications
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    return result.rows.map(mapRow);
  }

  async countUnread(clientId?: string): Promise<number> {
    const conditions = ['read = FALSE', '(expires_at IS NULL OR expires_at > NOW())'];
    const values: unknown[] = [];

    if (clientId) {
      conditions.push('client_id = $1');
      values.push(clientId);
    }

    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE ${conditions.join(' AND ')}`,
      values
    );

    return result.rows[0]?.count ?? 0;
  }

  async markAsRead(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE notifications SET read = TRUE, read_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  async markAllAsRead(clientId?: string): Promise<number> {
    const conditions = ['read = FALSE'];
    const values: unknown[] = [];

    if (clientId) {
      conditions.push('client_id = $1');
      values.push(clientId);
    }

    const result = await this.pool.query(
      `UPDATE notifications SET read = TRUE, read_at = NOW() WHERE ${conditions.join(' AND ')}`,
      values
    );

    return result.rowCount ?? 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < NOW()`
    );
    return result.rowCount ?? 0;
  }
}

function mapRow(row: any): NotificationRow {
  return {
    id: String(row.id),
    clientId: row.client_id ?? null,
    type: row.type,
    severity: row.severity,
    title: row.title,
    message: row.message,
    metadata: row.metadata ?? {},
    read: Boolean(row.read),
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
    expiresAt: row.expires_at ?? null,
  };
}
