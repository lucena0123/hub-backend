import type { FastifyBaseLogger } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import type { Pool } from 'pg';
import type { MetaAdsService } from '../../services/meta-ads-service';

export const ensureMetaAdSetsImported = async (params: {
  pool: Pool;
  metaService: MetaAdsService;
  campaignMap: Map<string, string>;
  log: FastifyBaseLogger;
}) => {
  const { pool, metaService, campaignMap, log } = params;

  try {
    const adsets = await metaService.fetchAdSets();

    if (!adsets || adsets.length === 0) return;

    const parseMetaBudget = (value: string | null | undefined) => {
      if (!value) return 0;
      const cents = Number.parseFloat(value);
      if (!Number.isFinite(cents) || cents <= 0) return 0;
      return Math.round(cents) / 100;
    };

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
    let mappedCount = 0;

    for (const adset of adsets) {
      const metaCampaignId = String(adset.campaign_id || '');
      const campaignId = metaCampaignId ? campaignMap.get(metaCampaignId) : undefined;
      if (!campaignId) continue;

      const rowPh: string[] = [];
      for (let i = 0; i < 9; i++) rowPh.push(`$${pIndex++}`);
      placeholders.push(`(${rowPh.join(', ')}, NOW(), NOW())`);

      values.push(
        uuidv4(), // id
        campaignId, // campaign_id
        adset.id, // adset_id (platform id)
        adset.name || null, // adset_name
        normalizeStatus(adset.status), // status
        adset.effective_status ? String(adset.effective_status).trim().toLowerCase() : null, // effective_status
        parseMetaBudget(adset.daily_budget), // daily_budget
        parseMetaBudget(adset.lifetime_budget), // lifetime_budget
        'meta' // platform
      );

      mappedCount++;
    }

    if (placeholders.length === 0) return;

    await pool.query(
      `INSERT INTO adsets (
          id,
          campaign_id,
          adset_id,
          adset_name,
          status,
          effective_status,
          daily_budget,
          lifetime_budget,
          platform,
          created_at,
          updated_at
        )
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (adset_id, platform) DO UPDATE SET
         campaign_id = EXCLUDED.campaign_id,
         adset_name = EXCLUDED.adset_name,
         status = EXCLUDED.status,
         effective_status = EXCLUDED.effective_status,
         daily_budget = CASE WHEN EXCLUDED.daily_budget > 0 THEN EXCLUDED.daily_budget ELSE adsets.daily_budget END,
         lifetime_budget = CASE WHEN EXCLUDED.lifetime_budget > 0 THEN EXCLUDED.lifetime_budget ELSE adsets.lifetime_budget END,
         updated_at = NOW()`,
      values
    );

    log.info({ count: mappedCount }, 'Auto-imported adsets from Meta');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('adsets') && message.toLowerCase().includes('does not exist')) {
      log.warn({ error: message }, 'Skipping adsets import (missing table)');
      return;
    }
    log.error({ error }, 'Failed to auto-import adsets (non-fatal)');
  }
};

