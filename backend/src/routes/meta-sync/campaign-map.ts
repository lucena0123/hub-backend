import type { FastifyBaseLogger } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import type { Pool } from 'pg';
import type { MetaAdsService } from '../../services/meta-ads-service';

export const ensureMetaCampaignsImported = async (params: {
  pool: Pool;
  metaService: MetaAdsService;
  clientId: string;
  log: FastifyBaseLogger;
}) => {
  const { pool, metaService, clientId, log } = params;

  try {
    const campaigns = await metaService.fetchCampaigns();

    if (!campaigns || campaigns.length === 0) return;

    const parseMetaBudget = (value: string | null | undefined) => {
      if (!value) return 0;
      const cents = Number.parseFloat(value);
      if (!Number.isFinite(cents) || cents <= 0) return 0;
      return Math.round(cents) / 100;
    };

    const resolveBudget = (camp: { daily_budget?: string; lifetime_budget?: string }) =>
      parseMetaBudget(camp.daily_budget ?? camp.lifetime_budget);

    const normalizeStatus = (status: string | null | undefined) => {
      const value = typeof status === 'string' ? status.trim().toLowerCase() : '';
      if (!value) return 'archived';
      if (value === 'active') return 'active';
      if (value === 'paused') return 'paused';
      if (value === 'archived') return 'archived';
      return value;
    };

    const values: any[] = [];
    const placeholders: string[] = [];
    let pIndex = 1;

    for (const camp of campaigns) {
      const rowPh: string[] = [];
      for (let i = 0; i < 8; i++) rowPh.push(`$${pIndex++}`);
      placeholders.push(`(${rowPh.join(', ')}, NOW())`);

      values.push(
        uuidv4(), // id
        camp.id, // externalId
        'meta', // platform
        camp.name, // name
        normalizeStatus(camp.status), // status
        clientId, // clientId
        resolveBudget(camp), // budget (daily/lifetime, cents -> moeda)
        camp.objective || null // objective
      );
    }

    if (placeholders.length === 0) return;

    await pool.query(
      `INSERT INTO campaigns (id, "externalId", platform, name, status, "clientId", budget, objective, "updatedAt")
       VALUES ${placeholders.join(', ')}
       ON CONFLICT ("externalId") DO UPDATE SET
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         budget = CASE WHEN EXCLUDED.budget > 0 THEN EXCLUDED.budget ELSE campaigns.budget END,
         objective = COALESCE(EXCLUDED.objective, campaigns.objective),
         "updatedAt" = NOW()`,
      values
    );

    log.info({ count: campaigns.length }, 'Auto-imported campaigns from Meta');
  } catch (error) {
    log.error({ error }, 'Failed to auto-import campaigns (non-fatal)');
  }
};

export const buildMetaCampaignMap = async (pool: Pool) => {
  const campaignsResult = await pool.query('SELECT id, \"externalId\" FROM campaigns WHERE platform = $1', ['meta']);
  return new Map<string, string>(campaignsResult.rows.map((row) => [row.externalId, row.id]));
};
