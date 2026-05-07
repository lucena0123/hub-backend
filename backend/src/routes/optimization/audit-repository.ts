import type { Pool } from 'pg';

export type OptimizationAuditFilters = {
  clientId?: string;
  action?: 'create' | 'update' | 'delete' | 'read';
  eventType?: string;
  sinceHours?: number;
  limit: number;
};

export type OptimizationAuditSummaryFilters = {
  clientId?: string;
  sinceHours?: number;
};

const buildAuditWhere = (filters: {
  clientId?: string;
  action?: 'create' | 'update' | 'delete' | 'read';
  eventType?: string;
  sinceHours?: number;
}) => {
  const values: unknown[] = [];
  const where: string[] = [];

  if (filters.clientId) {
    values.push(filters.clientId);
    where.push(`"clientId" = $${values.length}`);
  }

  if (filters.action) {
    values.push(filters.action);
    where.push(`action = $${values.length}`);
  }

  if (filters.eventType) {
    values.push(filters.eventType);
    where.push(`"eventType" = $${values.length}`);
  }

  if (filters.sinceHours) {
    values.push(filters.sinceHours);
    where.push(`timestamp >= NOW() - ($${values.length} * INTERVAL '1 hour')`);
  }

  return {
    values,
    whereClause: where.length > 0 ? `WHERE ${where.join(' AND ')}` : '',
  };
};

export const listOptimizationAuditEvents = async (
  pool: Pool,
  filters: OptimizationAuditFilters
) => {
  const { values, whereClause } = buildAuditWhere(filters);
  values.push(filters.limit);

  const result = await pool.query(
    `SELECT id, action, "eventType", "clientId", "processId", "userId", "userRole", resource, changes, metadata, timestamp
     FROM audit_events
     ${whereClause}
     ORDER BY timestamp DESC
     LIMIT $${values.length}`,
    values
  );

  return {
    total: result.rowCount,
    events: result.rows,
  };
};

export const summarizeOptimizationAudit = async (
  pool: Pool,
  filters: OptimizationAuditSummaryFilters
) => {
  const { values, whereClause } = buildAuditWhere(filters);

  const actionsResult = await pool.query(
    `SELECT action, COUNT(*)::int AS total
     FROM audit_events
     ${whereClause}
     GROUP BY action`,
    values
  );

  const eventTypesResult = await pool.query(
    `SELECT "eventType", COUNT(*)::int AS total
     FROM audit_events
     ${whereClause}
     GROUP BY "eventType"
     ORDER BY total DESC
     LIMIT 20`,
    values
  );

  return {
    actions: actionsResult.rows,
    eventTypes: eventTypesResult.rows,
  };
};
