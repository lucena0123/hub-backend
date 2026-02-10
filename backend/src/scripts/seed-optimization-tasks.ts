
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Optimization Tasks...');

    // 1. Get or Create a Client
    let client = await prisma.client.findFirst();
    if (!client) {
        console.log('Creating dummy client...');
        client = await prisma.client.create({
            data: {
                name: 'Demo Client',
                email: 'demo@example.com',
                tier: 'premium',
                status: 'active',
                contractStart: new Date(),
                budget: 10000,
                metaAdAccountId: 'act_123456789'
            }
        });
    }

    // 2. Create a Process Instance
    // Schema requires: processId, version, status, expectedSla, state, clientId
    const processInstance = await prisma.processInstance.create({
        data: {
            processId: 'optimization-process-v1', // String identifier
            version: '1.0.0',
            status: 'running',
            expectedSla: '24h',
            state: { stage: 'optimization' },
            clientId: client.id,
            startedAt: new Date(),
        }
    });

    // 3. Create Tasks
    const tasksData = [
        {
            name: 'Pausar AdSet com CPL Alto',
            input: {
                insightId: uuidv4(),
                ruleId: 'adset.cpl-high',
                severity: 'critical',
                description: 'AdSet "Retargeting - 180D" com CPL de R$45,00 (Meta: R$20,00).',
                entityId: 'act_123_adset_1',
                entityName: 'Retargeting - 180D',
                autoAction: {
                    type: 'PAUSE_AD_SET',
                    entityId: 'act_123_adset_1',
                    reason: 'CPA > Target'
                }
            },
            status: 'pending'
        },
        {
            name: 'Aumentar Budget Campanha Vencedora',
            input: {
                insightId: uuidv4(),
                ruleId: 'campaign.scale-winner',
                severity: 'medium',
                description: 'Campanha "Prospecting - Interests" com ROAS 4.5. Sugestão: +20% budget.',
                entityId: 'act_123_campaign_1',
                entityName: 'Prospecting - Interests',
                autoAction: {
                    type: 'INCREASE_BUDGET',
                    entityId: 'act_123_campaign_1',
                    amount: 20,
                    reason: 'High ROAS'
                }
            },
            status: 'pending'
        },
        {
            name: 'Criativo com Fadiga',
            input: {
                insightId: uuidv4(),
                ruleId: 'creative.fatigue',
                severity: 'high',
                description: 'Ad "Video_Depoimento_03" com CTR caindo para 0.4% (Média: 1.2%).',
                entityId: 'act_123_ad_1',
                entityName: 'Video_Depoimento_03',
                autoAction: {
                    type: 'PAUSE_AD',
                    entityId: 'act_123_ad_1',
                    reason: 'Creative Fatigue'
                }
            },
            status: 'pending'
        },
        {
            name: 'Oportunidade de Bid Cap',
            input: {
                insightId: uuidv4(),
                ruleId: 'bidding.opportunity',
                severity: 'low',
                description: 'Leilão menos competitivo no final de semana. Sugestão: Reduzir bid cap em 10%.',
                entityId: 'act_123_adset_2',
                entityName: 'Manual Bid - Test',
                autoAction: null
            },
            status: 'pending'
        },
        {
            name: 'Ajuste de Estrutura (Duplicar)',
            input: {
                insightId: uuidv4(),
                ruleId: 'structure.duplicate',
                severity: 'medium',
                description: 'AdSet com alta performance mas budget limitado. Duplicar para nova audiência.',
                entityId: 'act_123_adset_3',
                entityName: 'Lookalike 1%',
                autoAction: null
            },
            status: 'approved'
        },
        {
            name: 'Erro de Rastreamento (Pixel)',
            input: {
                insightId: uuidv4(),
                ruleId: 'tech.pixel-issue',
                severity: 'critical',
                description: 'Discrepância de 30% entre cliques e page views.',
                entityId: 'pixel_000',
                entityName: 'Main Pixel',
                autoAction: null
            },
            status: 'rejected'
        }
    ];

    for (const t of tasksData) {
        // Schema: taskId (String), lane (String)
        await prisma.task.create({
            data: {
                processInstanceId: processInstance.id,
                taskId: 'task_opt_' + uuidv4().substring(0, 8),
                name: t.name,
                lane: 'optimization_bot',
                status: t.status as any,
                input: t.input,
                output: {},
            }
        });
    }

    console.log(`✅ Created ${tasksData.length} seeded tasks linked to Client: ${client.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
