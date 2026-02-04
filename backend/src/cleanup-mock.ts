/**
 * Cleanup script for mock data inserted by `npm run seed:mock`.
 *
 * Removes mock campaigns identified by their externalId prefix (meta-/google-),
 * cascading related metrics via FK constraints.
 */

import 'dotenv/config';
import { pool } from './config/database';

async function main() {
  try {
    const patterns = ['meta-%', 'google-%'];

    const result = await pool.query(
      `DELETE FROM campaigns
       WHERE "externalId" LIKE ANY($1::text[])
       RETURNING id, name, "clientId", "externalId"`,
      [patterns]
    );

    console.log(`Removed ${result.rowCount ?? 0} mock campaign(s).`);

    for (const row of result.rows as any[]) {
      console.log(`- ${row.name} (${row.externalId}) client=${row.clientId}`);
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

