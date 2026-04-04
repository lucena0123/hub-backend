import { Pool } from 'pg';
import { IS_TEST } from './env';

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readEnv = (name: string) => {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
};

const requireEnv = (name: string) => {
  const value = readEnv(name);
  if (value) return value;
  throw new Error(`${name} is required when DATABASE_URL is not set`);
};

const connectionString = readEnv('DATABASE_URL') || null;

const sslMode = readEnv('PGSSLMODE').toLowerCase();
const sslEnabled =
  process.env.PGSSL === 'true' ||
  process.env.DATABASE_SSL === 'true' ||
  sslMode === 'require' ||
  sslMode === 'verify-ca' ||
  sslMode === 'verify-full' ||
  (connectionString ? /(?:\?|&)sslmode=require\b|(?:\?|&)ssl=true\b|(?:\?|&)ssl=1\b/i.test(connectionString) : false);

const allowSelfSignedSsl = process.env.PGSSL_ALLOW_SELF_SIGNED === 'true' && !IS_TEST;
const poolConfig = {
  max: parseNumber(process.env.PGPOOL_MAX, 20),
  idleTimeoutMillis: parseNumber(process.env.PGPOOL_IDLE_TIMEOUT_MS, 30000),
  connectionTimeoutMillis: parseNumber(process.env.PGPOOL_CONNECTION_TIMEOUT_MS, 2000),
  ...(sslEnabled ? { ssl: { rejectUnauthorized: !allowSelfSignedSsl } } : {}),
};

const discreteConfig = () => {
  if (IS_TEST) {
    return {
      host: readEnv('PGHOST') || '127.0.0.1',
      port: parseNumber(process.env.PGPORT, 5433),
      database: readEnv('PGDATABASE') || 'bpmn_system',
      user: readEnv('PGUSER') || 'bpmn',
      password: process.env.PGPASSWORD || 'dev123',
    };
  }

  return {
    host: requireEnv('PGHOST'),
    port: parseNumber(requireEnv('PGPORT'), 5433),
    database: requireEnv('PGDATABASE'),
    user: requireEnv('PGUSER'),
    password: requireEnv('PGPASSWORD'),
  };
};

export const pool = connectionString
  ? new Pool({
      connectionString,
      ...poolConfig,
    })
  : new Pool({
      ...discreteConfig(),
      ...poolConfig,
    });

pool.on('error', (err) => {
  console.error('[pg-pool] idle client error:', err.message);
});
