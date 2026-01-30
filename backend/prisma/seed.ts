/**
 * Prisma Seed Script
 * Popula banco de dados com dados iniciais
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
      role: 'gestor_trafego',
      passwordHash: userPassword,
    },
  });

  const csUser = await prisma.user.upsert({
    where: { email: 'cs@bpmnsystem.com' },
    update: {},
    create: {
      email: 'cs@bpmnsystem.com',
      name: 'Customer Success',
      role: 'cs',
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

  const campaign1 = await prisma.campaign.create({
    data: {
      externalId: 'meta_12345',
      platform: 'meta',
      name: 'Campanha Black Friday - Cliente A',
      status: 'active',
      clientId: client1.id,
      budget: 3000.0,
      spent: 1250.5,
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      externalId: 'meta_67890',
      platform: 'meta',
      name: 'Campanha Produto X - Cliente A',
      status: 'active',
      clientId: client1.id,
      budget: 2000.0,
      spent: 850.25,
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
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
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // Métricas para Campaign 1
    metricsData.push({
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
    });

    // Métricas para Campaign 2
    metricsData.push({
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
    });

    // Métricas para Campaign 3
    metricsData.push({
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
    });
  }

  // Calcular métricas derivadas
  for (const metric of metricsData) {
    metric.ctr = metric.clicks / metric.impressions;
    metric.cpc = metric.spent / metric.clicks;
    metric.cpa = metric.spent / metric.conversions;
    metric.roas = metric.revenue / metric.spent;
  }

  await prisma.metric.createMany({
    data: metricsData,
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

  await prisma.processVersion.create({
    data: {
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
  console.log(`   Tráfego: trafego@bpmnsystem.com / user123`);
  console.log(`   CS: cs@bpmnsystem.com / user123\n`);
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
