/**
 * Prisma Seed Script
 * Popula banco de dados com dados iniciais
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ============================================================================
  // USUÁRIOS
  // ============================================================================

  console.log('Creating users...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bpmnsystem.com' },
    update: {},
    create: {
      email: 'admin@bpmnsystem.com',
      name: 'Admin User',
      role: 'admin',
      passwordHash: adminPassword,
    },
  });

  const trafegoUser = await prisma.user.upsert({
    where: { email: 'trafego@bpmnsystem.com' },
    update: {},
    create: {
      email: 'trafego@bpmnsystem.com',
      name: 'Gestor de Tráfego',
      role: 'manager',
      passwordHash: userPassword,
    },
  });

  const csUser = await prisma.user.upsert({
    where: { email: 'cs@bpmnsystem.com' },
    update: {},
    create: {
      email: 'cs@bpmnsystem.com',
      name: 'Customer Success',
      role: 'analyst',
      passwordHash: userPassword,
    },
  });

  console.log(`✅ Created ${3} users`);

  // ============================================================================
  // CLIENTES
  // ============================================================================

  console.log('\nCreating clients...');

  const client1 = await prisma.client.upsert({
    where: { email: 'contato@clientea.com' },
    update: {},
    create: {
      name: 'Cliente A Corp',
      email: 'contato@clientea.com',
      tier: 'premium',
      status: 'active',
      contractStart: new Date('2024-01-01'),
      contractEnd: new Date('2025-01-01'),
      budget: 10000.0,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { email: 'contato@clienteb.com' },
    update: {},
    create: {
      name: 'Cliente B Ltd',
      email: 'contato@clienteb.com',
      tier: 'standard',
      status: 'active',
      contractStart: new Date('2024-03-15'),
      contractEnd: new Date('2025-03-15'),
      budget: 5000.0,
    },
  });

  console.log(`✅ Created ${2} clients`);

  // ============================================================================
  // CAMPANHAS
  // ============================================================================

  console.log('\nCreating campaigns...');

  const campaign1 = await prisma.campaign.upsert({
    where: { externalId: 'meta_12345' },
    update: {
      platform: 'meta',
      name: 'Campanha Black Friday - Cliente A',
      status: 'active',
      clientId: client1.id,
      budget: 3000.0,
      spent: 1250.5,
    },
    create: {
      externalId: 'meta_12345',
      platform: 'meta',
      name: 'Campanha Black Friday - Cliente A',
      status: 'active',
      clientId: client1.id,
      budget: 3000.0,
      spent: 1250.5,
    },
  });

  const campaign2 = await prisma.campaign.upsert({
    where: { externalId: 'meta_67890' },
    update: {
      platform: 'meta',
      name: 'Campanha Produto X - Cliente A',
      status: 'active',
      clientId: client1.id,
      budget: 2000.0,
      spent: 850.25,
    },
    create: {
      externalId: 'meta_67890',
      platform: 'meta',
      name: 'Campanha Produto X - Cliente A',
      status: 'active',
      clientId: client1.id,
      budget: 2000.0,
      spent: 850.25,
    },
  });

  const campaign3 = await prisma.campaign.upsert({
    where: { externalId: 'meta_11111' },
    update: {
      platform: 'meta',
      name: 'Campanha Awareness - Cliente B',
      status: 'active',
      clientId: client2.id,
      budget: 1500.0,
      spent: 420.0,
    },
    create: {
      externalId: 'meta_11111',
      platform: 'meta',
      name: 'Campanha Awareness - Cliente B',
      status: 'active',
      clientId: client2.id,
      budget: 1500.0,
      spent: 420.0,
    },
  });

  console.log(`✅ Created ${3} campaigns`);

  // ============================================================================
  // MÉTRICAS (últimos 7 dias)
  // ============================================================================

  console.log('\nCreating metrics...');

  const metricsData = [];
  const campaignMetricsData = [];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const m1 = {
      id: randomUUID(),
      date,
      clientId: client1.id,
      campaignId: campaign1.id,
      impressions: Math.floor(Math.random() * 50000) + 10000,
      clicks: Math.floor(Math.random() * 2000) + 500,
      conversions: Math.floor(Math.random() * 50) + 10,
      spent: Math.random() * 200 + 50,
      revenue: Math.random() * 800 + 200,
      ctr: 0,
      cpc: 0,
      cpa: 0,
      roas: 0,
    };
    metricsData.push(m1);

    const m2 = {
      id: randomUUID(),
      date,
      clientId: client1.id,
      campaignId: campaign2.id,
      impressions: Math.floor(Math.random() * 30000) + 8000,
      clicks: Math.floor(Math.random() * 1500) + 300,
      conversions: Math.floor(Math.random() * 40) + 5,
      spent: Math.random() * 150 + 30,
      revenue: Math.random() * 600 + 150,
      ctr: 0,
      cpc: 0,
      cpa: 0,
      roas: 0,
    };
    metricsData.push(m2);

    const m3 = {
      id: randomUUID(),
      date,
      clientId: client2.id,
      campaignId: campaign3.id,
      impressions: Math.floor(Math.random() * 20000) + 5000,
      clicks: Math.floor(Math.random() * 800) + 200,
      conversions: Math.floor(Math.random() * 20) + 3,
      spent: Math.random() * 80 + 20,
      revenue: Math.random() * 300 + 80,
      ctr: 0,
      cpc: 0,
      cpa: 0,
      roas: 0,
    };
    metricsData.push(m3);

    const toCampaignMetric = (m: typeof m1 | typeof m2 | typeof m3) => {
      const impressions = Math.max(0, Math.trunc(m.impressions));
      const clicks = Math.max(0, Math.trunc(m.clicks));
      const conversions = Math.max(0, Math.trunc(m.conversions));

      const spend = Number(m.spent) || 0;
      const revenue = Number(m.revenue) || 0;

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;
      const cpa = conversions > 0 ? spend / conversions : 0;
      const roas = spend > 0 ? revenue / spend : 0;
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

      const messagingConversations = Math.max(conversions, Math.trunc(conversions * (1.5 + Math.random())));
      const messagingFirstReply = Math.max(0, Math.trunc(messagingConversations * (0.35 + Math.random() * 0.25)));
      const linkClicks = Math.max(0, Math.trunc(clicks * (0.25 + Math.random() * 0.2)));
      const landingPageViews = Math.max(0, Math.trunc(linkClicks * (0.7 + Math.random() * 0.2)));

      const leads = Math.max(conversions, messagingConversations);
      const qualifiedLeads = Math.max(0, Math.trunc(leads * (0.4 + Math.random() * 0.3)));
      const cpl = leads > 0 ? spend / leads : 0;

      const reach = Math.max(1, Math.trunc(impressions * (0.55 + Math.random() * 0.25)));
      const frequency = reach > 0 ? impressions / reach : 0;

      return {
        campaignId: m.campaignId,
        date: m.date,
        impressions,
        clicks,
        conversions,
        spend: Number(spend.toFixed(2)),
        revenue: Number(revenue.toFixed(2)),
        leads,
        qualified_leads: qualifiedLeads,
        messagingConversations,
        messagingFirstReply,
        linkClicks,
        landingPageViews,
        reach,
        frequency: Number(frequency.toFixed(4)),
        cpm: Number(cpm.toFixed(2)),
        ctr: Number(ctr.toFixed(2)),
        cpc: Number(cpc.toFixed(2)),
        cpl: Number(cpl.toFixed(2)),
        cpa: Number(cpa.toFixed(2)),
        roas: Number(roas.toFixed(2)),
        platform: 'meta',
      };
    };

    campaignMetricsData.push(toCampaignMetric(m1), toCampaignMetric(m2), toCampaignMetric(m3));
  }

  // Calcular métricas derivadas
  for (const metric of metricsData) {
    metric.ctr = (metric.clicks / metric.impressions) * 100;
    metric.cpc = metric.spent / metric.clicks;
    metric.cpa = metric.spent / metric.conversions;
    metric.roas = metric.revenue / metric.spent;
  }

  await prisma.metrics.createMany({
    data: metricsData,
    skipDuplicates: true,
  });

  await prisma.campaignMetric.createMany({
    data: campaignMetricsData,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${metricsData.length} metrics`);

  // ============================================================================
  // PROCESSO EXEMPLO
  // ============================================================================

  console.log('\nCreating sample process...');

  const processInstance = await prisma.processInstance.create({
    data: {
      processId: '5.1',
      version: '1.0.0',
      status: 'running',
      priority: 7,
      clientId: client1.id,
      expectedSla: '24h',
      slaBreached: false,
      currentPhase: 'Fase 2: Análise de Desvios',
      currentTask: 'task_5.1_06',
      state: {
        alertsGenerated: 2,
        anomaliesDetected: ['Budget esgotado - Campanha Black Friday'],
      },
    },
  });

  // Criar tasks do processo
  await prisma.task.createMany({
    data: [
      {
        taskId: 'task_5.1_01',
        name: 'Conectar APIs',
        lane: 'Sistema',
        status: 'completed',
        priority: 7,
        processInstanceId: processInstance.id,
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3500000),
        durationMs: 100000,
        input: {},
        output: { connected: true },
      },
      {
        taskId: 'task_5.1_06',
        name: 'Identificar Anomalias',
        lane: 'IA',
        status: 'in_progress',
        priority: 7,
        processInstanceId: processInstance.id,
        assignedTo: trafegoUser.id,
        startedAt: new Date(),
        input: { threshold: 0.15 },
      },
      {
        taskId: 'task_5.1_10',
        name: 'Gerar Relatório de Saúde',
        lane: 'Sistema',
        status: 'pending',
        priority: 7,
        processInstanceId: processInstance.id,
      },
    ],
  });

  console.log(`✅ Created process instance with ${3} tasks`);

  // ============================================================================
  // VERSÃO DE PROCESSO
  // ============================================================================

  console.log('\nCreating process version...');

  await prisma.processVersion.upsert({
    where: {
      processId_version: {
        processId: '5.1',
        version: '1.0.0',
      },
    },
    update: {
      status: 'active',
      description: 'Versão inicial do processo de monitoramento diário',
      breaking: false,
      metadata: {
        author: 'system',
        changelog: ['Initial release'],
        testsPass: true,
      },
    },
    create: {
      processId: '5.1',
      version: '1.0.0',
      status: 'active',
      description: 'Versão inicial do processo de monitoramento diário',
      breaking: false,
      metadata: {
        author: 'system',
        changelog: ['Initial release'],
        testsPass: true,
      },
    },
  });

  console.log(`✅ Created process version`);

  console.log('\n✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: 3`);
  console.log(`   - Clients: 2`);
  console.log(`   - Campaigns: 3`);
  console.log(`   - Metrics: ${metricsData.length}`);
  console.log(`   - Process Instances: 1`);
  console.log(`   - Tasks: 3`);
  console.log(`   - Process Versions: 1\n`);
  console.log('🔐 Login credentials:');
  console.log(`   Admin: admin@bpmnsystem.com / admin123`);
  console.log(`   Manager: trafego@bpmnsystem.com / user123`);
  console.log(`   Analyst: cs@bpmnsystem.com / user123\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
