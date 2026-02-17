/**
 * Audit Trail Middleware and Helpers
 */

import { randomUUID } from 'crypto';
import { Pool } from 'pg';

export type AuditAction = 'create' | 'update' | 'delete' | 'read';
export type EntityType = 'client' | 'campaign' | 'process' | 'task' | 'user';

export interface AuditEvent {
  userId?: string;
  userRole?: string;
  clientId?: string;
  processId?: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  changes?: any;
  metadata?: any;
}

/**
 * Creates an audit log entry in the database
 */
export async function createAuditLog(
  pool: Pool,
  event: AuditEvent
): Promise<void> {
  try {
    const clientId =
      event.clientId ||
      event.metadata?.clientId ||
      (event.entityType === 'client' ? event.entityId : 'unknown');

    const processId = event.processId || event.metadata?.processId || null;

    await pool.query(
      `INSERT INTO audit_events
       (id, "eventType", "processId", "clientId", "userId", "userRole", resource, action, changes, metadata, "complianceFlags", timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb, $10::jsonb, $11::jsonb, NOW())`,
      [
        randomUUID(),
        `${event.entityType}.${event.action}`,
        processId,
        clientId,
        event.userId || 'system',
        event.userRole || event.metadata?.userRole || 'system',
        JSON.stringify({ entityType: event.entityType, entityId: event.entityId }),
        event.action,
        event.changes ? JSON.stringify(event.changes) : null,
        event.metadata ? JSON.stringify(event.metadata) : JSON.stringify({}),
        JSON.stringify([]),
      ]
    );
  } catch (error) {
    // Log error but don't throw - audit failures shouldn't break the main operation
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Compares old and new objects to generate a changes object
 */
export function getChanges(oldObj: any, newObj: any): any {
  const changes: any = {
    before: {},
    after: {},
  };

  // Get all keys from both objects
  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {}),
  ]);

  for (const key of allKeys) {
    if (oldObj[key] !== newObj[key]) {
      changes.before[key] = oldObj[key];
      changes.after[key] = newObj[key];
    }
  }

  // Return null if no changes
  return Object.keys(changes.before).length === 0 ? null : changes;
}

/**
 * Audit helper for client operations
 */
export class ClientAudit {
  constructor(private pool: Pool) {}

  async logCreate(clientId: string, clientData: any, userId?: string) {
    await createAuditLog(this.pool, {
      userId,
      action: 'create',
      entityType: 'client',
      entityId: clientId,
      changes: { after: clientData },
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  async logUpdate(
    clientId: string,
    oldData: any,
    newData: any,
    userId?: string
  ) {
    const changes = getChanges(oldData, newData);
    if (changes) {
      await createAuditLog(this.pool, {
        userId,
        action: 'update',
        entityType: 'client',
        entityId: clientId,
        changes,
        metadata: { timestamp: new Date().toISOString() },
      });
    }
  }

  async logDelete(clientId: string, clientData: any, userId?: string) {
    await createAuditLog(this.pool, {
      userId,
      action: 'delete',
      entityType: 'client',
      entityId: clientId,
      changes: { before: clientData },
      metadata: {
        timestamp: new Date().toISOString(),
        softDelete: true,
      },
    });
  }
}
