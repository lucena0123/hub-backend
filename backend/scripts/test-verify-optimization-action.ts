/**
 * Manual script to verify OptimizationActionService end-to-end.
 *
 * Usage:
 *   npx tsx scripts/test-verify-optimization-action.ts <clientId> <entityId> [action] [amount]
 *
 * Notes:
 * - Requires `DATABASE_URL` (Prisma) and `META_ACCESS_TOKEN` in `backend/.env`.
 * - `dryRun` is enabled by default (no writeback).
 */

import { PrismaClient } from '@prisma/client';
import { OptimizationActionService } from '../src/services/optimization-playbook/optimization-action-service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ACTIONS = new Set(['pause_ad', 'resume_ad', 'set_adset_budget', 'set_campaign_budget'] as const);
type ActionType = 'pause_ad' | 'resume_ad' | 'set_adset_budget' | 'set_campaign_budget';

async function main() {
  const clientId = process.argv[2];
  const entityId = process.argv[3];
  const action = (process.argv[4] || 'pause_ad') as ActionType;
  const amountArg = process.argv[5];

  if (!clientId || !entityId) {
    console.error('Usage: npx tsx scripts/test-verify-optimization-action.ts <clientId> <entityId> [action] [amount]');
    process.exit(1);
  }

  if (!ACTIONS.has(action)) {
    console.error(`Invalid action "${action}". Valid: ${[...ACTIONS].join(', ')}`);
    process.exit(1);
  }

  const amount = amountArg ? Number(amountArg) : undefined;

  const prisma = new PrismaClient();
  await prisma.$connect();

  try {
    const service = new OptimizationActionService(prisma);

    const result = await service.executeAction(clientId, {
      type: action,
      entityId,
      amount,
      reason: 'Manual verification script',
      dryRun: true,
    });

    console.log(JSON.stringify(result, null, 2));

    process.exit(result.success ? 0 : 2);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
