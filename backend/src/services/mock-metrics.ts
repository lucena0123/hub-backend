/**
 * Mock Metrics Data
 * Realistic campaign data for the 2 clients (for testing without API integrations)
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { seedMockCreativeLibraryData } from './mock-creatives';

export async function seedMockCampaignsAndMetrics(pool: Pool) {
  const resolveTargetClients = async () => {
    const raw = process.env.MOCK_SEED_CLIENT_IDS;
    if (raw) {
      const ids = raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (ids.length < 2) {
        throw new Error('MOCK_SEED_CLIENT_IDS must contain at least 2 client IDs (comma-separated).');
      }

      const result = await pool.query('SELECT id, name FROM clients WHERE id = ANY($1::text[])', [ids]);
      if (result.rows.length < 2) {
        throw new Error('MOCK_SEED_CLIENT_IDS did not match at least 2 existing clients.');
      }

      const byId = new Map<string, { id: string; name: string }>(
        result.rows.map((row) => [String(row.id), { id: String(row.id), name: String(row.name) }])
      );

      return [byId.get(ids[0]) ?? result.rows[0], byId.get(ids[1]) ?? result.rows[1]];
    }

    // Default behavior: seed dedicated demo clients, so we don't pollute real customers.
    const demoA = {
      id: uuidv4(),
      name: 'Cliente Demo A (Mock Data)',
      email: 'demo.a@local.test',
      tier: 'premium',
      status: 'inactive',
      contractStart: new Date('2026-01-01'),
      budget: 10000,
    };
    const demoB = {
      id: uuidv4(),
      name: 'Cliente Demo B (Mock Data)',
      email: 'demo.b@local.test',
      tier: 'standard',
      status: 'inactive',
      contractStart: new Date('2026-01-01'),
      budget: 6000,
    };

    await pool.query(
      `INSERT INTO clients (id, name, email, tier, status, "contractStart", budget, "createdAt", "updatedAt")
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()),
         ($8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [
        demoA.id,
        demoA.name,
        demoA.email,
        demoA.tier,
        demoA.status,
        demoA.contractStart,
        demoA.budget,
        demoB.id,
        demoB.name,
        demoB.email,
        demoB.tier,
        demoB.status,
        demoB.contractStart,
        demoB.budget,
      ]
    );

    const demoResult = await pool.query(
      'SELECT id, name, email FROM clients WHERE email IN ($1, $2)',
      [demoA.email, demoB.email]
    );

    const byEmail = new Map<string, { id: string; name: string }>(
      demoResult.rows.map((row) => [String(row.email), { id: String(row.id), name: String(row.name) }])
    );
    const clientA = byEmail.get(demoA.email);
    const clientB = byEmail.get(demoB.email);

    if (!clientA || !clientB) {
      console.warn('Failed to create demo clients. Aborting seed.');
      return null;
    }

    return [clientA, clientB];
  };

  const clients = await resolveTargetClients();
  if (!clients) return;

  const [client1, client2] = clients;

  // Keep seed idempotent: remove previous mock campaigns for these clients.
  await pool.query(
    `DELETE FROM campaigns
     WHERE "clientId" = ANY($1::text[])
       AND ("externalId" LIKE 'meta-%' OR "externalId" LIKE 'google-%')`,
    [[client1.id, client2.id]]
  );

  // Create campaigns for client 1
  const camp1Id = uuidv4();
  const camp2Id = uuidv4();

  await pool.query(
    `INSERT INTO campaigns (id, "externalId", "clientId", name, platform, budget, status, spent, "createdAt", "updatedAt")
     VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()),
       ($9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
     ON CONFLICT ("externalId") DO NOTHING`,
    [
      camp1Id,
      `meta-${camp1Id}`,
      client1.id,
      '[TRABALHISTA] Rescisão indireta - WhatsApp',
      'meta',
      5000,
      'active',
      0,
      camp2Id,
      `google-${camp2Id}`,
      client1.id,
      'Google Ads - Search Campaigns',
      'google',
      3000,
      'active',
      0,
    ]
  );

  // Create campaigns for client 2
  const camp3Id = uuidv4();

  await pool.query(
    `INSERT INTO campaigns (id, "externalId", "clientId", name, platform, budget, status, spent, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     ON CONFLICT ("externalId") DO NOTHING`,
    [camp3Id, `meta-${camp3Id}`, client2.id, '[MATERNIDADE] Salário maternidade - WhatsApp', 'meta', 7000, 'active', 0]
  );

  // Generate daily metrics for last 30 days
  const today = new Date();
  const metrics = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Campaign 1 metrics (Meta - performing well)
    const camp1Impressions = 8000 + Math.random() * 4000;
    const camp1Clicks = camp1Impressions * (0.02 + Math.random() * 0.01); // 2-3% CTR
    const camp1Conversions = Math.floor(camp1Clicks * (0.05 + Math.random() * 0.03)); // 5-8% conversion
    const camp1Spend = 150 + Math.random() * 50;
    const camp1Revenue = camp1Conversions * (100 + Math.random() * 50); // $100-150 per conversion

    metrics.push({
      id: uuidv4(),
      campaignId: camp1Id,
      date: dateStr,
      impressions: Math.floor(camp1Impressions),
      clicks: Math.floor(camp1Clicks),
      conversions: camp1Conversions,
      spend: Number(camp1Spend.toFixed(2)),
      ctr: Number(((camp1Clicks / camp1Impressions) * 100).toFixed(2)),
      cpc: Number((camp1Spend / camp1Clicks).toFixed(2)),
      cpl: Number((camp1Spend / camp1Conversions).toFixed(2)),
      cpa: Number((camp1Spend / camp1Conversions).toFixed(2)),
      roas: Number((camp1Revenue / camp1Spend).toFixed(2)),
      leads: camp1Conversions,
      qualifiedLeads: Math.floor(camp1Conversions * 0.7),
      revenue: Number(camp1Revenue.toFixed(2)),
      platform: 'meta',
    });

    // Campaign 2 metrics (Google - decent performance)
    const camp2Impressions = 6000 + Math.random() * 3000;
    const camp2Clicks = camp2Impressions * (0.015 + Math.random() * 0.01); // 1.5-2.5% CTR
    const camp2Conversions = Math.floor(camp2Clicks * (0.04 + Math.random() * 0.02)); // 4-6% conversion
    const camp2Spend = 90 + Math.random() * 40;
    const camp2Revenue = camp2Conversions * (120 + Math.random() * 60);

    metrics.push({
      id: uuidv4(),
      campaignId: camp2Id,
      date: dateStr,
      impressions: Math.floor(camp2Impressions),
      clicks: Math.floor(camp2Clicks),
      conversions: camp2Conversions,
      spend: Number(camp2Spend.toFixed(2)),
      ctr: Number(((camp2Clicks / camp2Impressions) * 100).toFixed(2)),
      cpc: Number((camp2Spend / camp2Clicks).toFixed(2)),
      cpl: Number((camp2Spend / camp2Conversions).toFixed(2)),
      cpa: Number((camp2Spend / camp2Conversions).toFixed(2)),
      roas: Number((camp2Revenue / camp2Spend).toFixed(2)),
      leads: camp2Conversions,
      qualifiedLeads: Math.floor(camp2Conversions * 0.6),
      revenue: Number(camp2Revenue.toFixed(2)),
      platform: 'google',
    });

    // Campaign 3 metrics (Meta - high spend, awareness focused)
    const camp3Impressions = 15000 + Math.random() * 8000;
    const camp3Clicks = camp3Impressions * (0.025 + Math.random() * 0.015); // 2.5-4% CTR (awareness)
    const camp3Conversions = Math.floor(camp3Clicks * (0.03 + Math.random() * 0.02)); // 3-5% conversion
    const camp3Spend = 220 + Math.random() * 80;
    const camp3Revenue = camp3Conversions * (90 + Math.random() * 40);

    metrics.push({
      id: uuidv4(),
      campaignId: camp3Id,
      date: dateStr,
      impressions: Math.floor(camp3Impressions),
      clicks: Math.floor(camp3Clicks),
      conversions: camp3Conversions,
      spend: Number(camp3Spend.toFixed(2)),
      ctr: Number(((camp3Clicks / camp3Impressions) * 100).toFixed(2)),
      cpc: Number((camp3Spend / camp3Clicks).toFixed(2)),
      cpl: Number((camp3Spend / camp3Conversions).toFixed(2)),
      cpa: Number((camp3Spend / camp3Conversions).toFixed(2)),
      roas: Number((camp3Revenue / camp3Spend).toFixed(2)),
      leads: camp3Conversions,
      qualifiedLeads: Math.floor(camp3Conversions * 0.5),
      revenue: Number(camp3Revenue.toFixed(2)),
      platform: 'meta',
    });
  }

  // Insert all metrics
  for (const metric of metrics) {
    await pool.query(
      `INSERT INTO campaign_metrics
       (id, campaign_id, date, impressions, clicks, conversions, spend, ctr, cpc, cpl, cpa, roas, leads, qualified_leads, revenue, platform, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
       ON CONFLICT (campaign_id, date, platform) DO UPDATE
       SET impressions = EXCLUDED.impressions,
           clicks = EXCLUDED.clicks,
           conversions = EXCLUDED.conversions,
           spend = EXCLUDED.spend,
           ctr = EXCLUDED.ctr,
           cpc = EXCLUDED.cpc,
           cpl = EXCLUDED.cpl,
           cpa = EXCLUDED.cpa,
           roas = EXCLUDED.roas,
           leads = EXCLUDED.leads,
           qualified_leads = EXCLUDED.qualified_leads,
           revenue = EXCLUDED.revenue,
           updated_at = NOW()`,
      [
        metric.id,
        metric.campaignId,
        metric.date,
        metric.impressions,
        metric.clicks,
        metric.conversions,
        metric.spend,
        metric.ctr,
        metric.cpc,
        metric.cpl,
        metric.cpa,
        metric.roas,
        metric.leads,
        metric.qualifiedLeads,
        metric.revenue,
        metric.platform,
      ]
    );
  }

  // Seed mock creatives/adsets (non-fatal when tables are missing)
  try {
    await seedMockCreativeLibraryData(pool, [
      { campaignId: camp1Id, label: '[TRABALHISTA] Rescisão indireta - WhatsApp' },
      { campaignId: camp3Id, label: '[MATERNIDADE] Salário maternidade - WhatsApp' },
    ]);
  } catch (error) {
    console.warn('⚠️  Failed to seed mock creative library data:', error instanceof Error ? error.message : error);
  }

  // Initialize BPMN progress for both clients
  await pool.query(
    `INSERT INTO client_bpmn_progress
     (id, client_id, current_subprocess, status, progress_percentage, started_at, pending_tasks, created_at, updated_at)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()),
       ($8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
     ON CONFLICT (client_id, current_subprocess) DO UPDATE
     SET status = EXCLUDED.status,
         progress_percentage = EXCLUDED.progress_percentage,
         updated_at = NOW()`,
    [
      uuidv4(),
      client1.id,
      '5.1',
      'in_progress',
      65,
      new Date('2026-01-10'),
      ['Review monthly performance', 'Adjust bids', 'Optimize ad copy'],
      uuidv4(),
      client2.id,
      '4.3',
      'in_progress',
      80,
      new Date('2026-01-15'),
      ['Finalize landing page design', 'Setup conversion tracking', 'QA testing'],
    ]
  );

  console.log('✅ Mock campaigns and metrics seeded successfully!');
  console.log(`   - Client 1 (${client1.name}): 2 campaigns, 60 days of metrics`);
  console.log(`   - Client 2 (${client2.name}): 1 campaign, 30 days of metrics`);
  console.log(`   - Total: 3 campaigns, 90 metric records`);
}
