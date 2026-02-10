
import { Pool } from 'pg';
import { buildOptimizationCenter } from '../src/routes/analytics/optimization-center/handler';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    const clientId = process.argv[2];
    if (!clientId) {
        console.error('Please provide a clientId as an argument');
        process.exit(1);
    }

    console.log(`Debugging Optimization Center for Client: ${clientId}`);

    try {
        const result = await buildOptimizationCenter({
            pool,
            clientId,
            query: { period: '30d' },
        });

        console.log('\n--- SUMMARY ---');
        console.log(JSON.stringify(result.summary, null, 2));

        console.log('\n--- ITEMS (First 5) ---');
        console.log(JSON.stringify(result.items.slice(0, 5), null, 2));

        console.log(`\nTotal Rules Triggered: ${result.items.length}`);
    } catch (error) {
        console.error('Error running optimization center:', error);
    } finally {
        await pool.end();
    }
}

main();
