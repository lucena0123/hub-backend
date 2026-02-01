import { Pool } from 'pg';

export const pool = new Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'bpmn_system',
  user: 'bpmn',
  password: 'dev123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
