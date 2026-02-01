/**
 * Seed script for mock campaign metrics data
 */

import 'dotenv/config';
import { pool } from './config/database';
import { seedMockCampaignsAndMetrics } from './services/mock-metrics';

async function main() {
  try {
    console.log('Seeding mock campaigns and metrics...');
    await seedMockCampaignsAndMetrics(pool);
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
