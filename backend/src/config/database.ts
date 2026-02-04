import { Pool } from 'pg';

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const connectionString = process.env.DATABASE_URL?.trim() || null;

const sslMode = process.env.PGSSLMODE?.trim().toLowerCase();
const sslEnabled =
  process.env.PGSSL === 'true' ||
  process.env.DATABASE_SSL === 'true' ||
  sslMode === 'require' ||
  sslMode === 'verify-ca' ||
  sslMode === 'verify-full' ||
  (connectionString ? /(?:\?|&)sslmode=require\b|(?:\?|&)ssl=true\b|(?:\?|&)ssl=1\b/i.test(connectionString) : false);

const poolConfig = {
  max: parseNumber(process.env.PGPOOL_MAX, 20),
  idleTimeoutMillis: parseNumber(process.env.PGPOOL_IDLE_TIMEOUT_MS, 30000),
  connectionTimeoutMillis: parseNumber(process.env.PGPOOL_CONNECTION_TIMEOUT_MS, 2000),
  ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
};

export const pool = connectionString
  ? new Pool({
      connectionString,
      ...poolConfig,
    })
  : new Pool({
      host: process.env.PGHOST?.trim() || '127.0.0.1',
      port: parseNumber(process.env.PGPORT, 5433),
      database: process.env.PGDATABASE?.trim() || 'bpmn_system',
      user: process.env.PGUSER?.trim() || 'bpmn',
      password: process.env.PGPASSWORD || 'dev123',
      ...poolConfig,
    });
