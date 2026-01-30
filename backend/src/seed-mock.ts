/**
 * Seed script for mock campaign metrics data
 */

import { Pool } from 'pg';
import { seedMockCampaignsAndMetrics } from './services/mock-metrics';

const pool = new Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'bpmn_system',
  user: 'bpmn',
  password: 'dev123',
});

async function main() {
  try {
    console.log('🌱 Seeding mock campaigns and metrics...');
    await seedMockCampaignsAndMetrics(pool);
    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
