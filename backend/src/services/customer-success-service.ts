import { PrismaClient, type Prisma } from '@prisma/client';

type ListOnboardingOptions = {
  clientId?: string;
};

type ListHealthOptions = {
  clientId?: string;
};

type UpdateOnboardingTaskInput = {
  status: string;
};

type CreateExpansionOpportunityInput = {
  clientId: string;
  contractId?: string | null;
  title: string;
  notes?: string | null;
  estimatedMrr?: number | string | null;
};

type HealthSignalDraft = {
  signalType: string;
  severity: 'low' | 'medium' | 'high';
  source: string;
  message: string;
  metadata: Prisma.InputJsonValue;
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const ONBOARDING_TASKS = [
  { key: 'd0', title: 'D0 - Kickoff e handoff', offset: 0 },
  { key: 'd1', title: 'D1 - Acessos e setup inicial', offset: 1 },
  { key: 'd2', title: 'D2 - Planejamento operacional', offset: 2 },
  { key: 'd3_d4', title: 'D3-D4 - Primeiras entregas', offset: 4 },
  { key: 'd5_d7', title: 'D5-D7 - Revisão da primeira semana', offset: 7 },
];

export class CustomerSuccessService {
  constructor(private readonly prisma: PrismaClient) {}

  async ensureOnboardingPlanForContract(contractId: string) {
    const existing = await this.prisma.onboardingPlan.findUnique({
      where: { contractId },
      include: { tasks: true },
    });
    if (existing) return existing;

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract || contract.status !== 'active') return null;

    const plan = await this.prisma.onboardingPlan.create({
      data: {
        clientId: contract.clientId,
        contractId: contract.id,
        status: 'onboarding',
        targetDate: addDays(startOfToday(), 7),
      },
    });

    await Promise.all(
      ONBOARDING_TASKS.map((task) =>
        this.prisma.onboardingTask.create({
          data: {
            planId: plan.id,
            taskKey: task.key,
            title: task.title,
            dueDate: addDays(startOfToday(), task.offset),
          },
        })
      )
    );

    return this.prisma.onboardingPlan.findUnique({
      where: { id: plan.id },
      include: { tasks: true, client: true, contract: true },
    });
  }

  async listOnboardingPlans(options: ListOnboardingOptions = {}) {
    return this.prisma.onboardingPlan.findMany({
      where: {
        ...(options.clientId ? { clientId: options.clientId } : {}),
      },
      include: {
        client: true,
        contract: true,
        tasks: {
          orderBy: [{ dueDate: 'asc' }],
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async updateOnboardingTask(id: string, input: UpdateOnboardingTaskInput) {
    const task = await this.prisma.onboardingTask.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!task) throw new Error('Onboarding task not found');

    const updatedTask = await this.prisma.onboardingTask.update({
      where: { id },
      data: {
        status: input.status,
        completedAt: input.status === 'done' ? new Date() : null,
      },
    });

    const remaining = await this.prisma.onboardingTask.count({
      where: {
        planId: task.planId,
        status: { not: 'done' },
      },
    });

    await this.prisma.onboardingPlan.update({
      where: { id: task.planId },
      data: {
        status: remaining === 0 ? 'healthy' : 'onboarding',
        completedAt: remaining === 0 ? new Date() : null,
      },
    });

    return updatedTask;
  }

  async listHealthPortfolio(options: ListHealthOptions = {}) {
    const activeContracts = await this.prisma.contract.findMany({
      where: {
        status: 'active',
        ...(options.clientId ? { clientId: options.clientId } : {}),
      },
      include: {
        client: true,
        onboardingPlans: {
          include: {
            tasks: true,
          },
        },
        receivables: true,
        projects: {
          include: {
            deliverables: true,
          },
        },
      },
    });

    const snapshotDate = startOfToday();
    const renewalBoundary = addMonths(snapshotDate, 2);
    const portfolio = [];

    for (const contract of activeContracts) {
      const onboardingPlan = contract.onboardingPlans[0] ?? null;
      const overdueReceivables = contract.receivables.filter(
        (item) => item.status !== 'paid' && item.dueDate < snapshotDate
      );
      const blockedDeliverables = contract.projects.flatMap((project) =>
        project.deliverables.filter((item) => item.status === 'blocked')
      );
      const pendingOnboarding = onboardingPlan?.tasks.filter((task) => task.status !== 'done') ?? [];

      let score = 100;
      score -= overdueReceivables.length * 25;
      score -= blockedDeliverables.length * 15;
      if (pendingOnboarding.length > 0) score -= 10;
      score = Math.max(0, score);

      let status = 'healthy';
      if (contract.client.status === 'churned') status = 'churned';
      else if (contract.endDate && contract.endDate <= renewalBoundary) status = 'renewal';
      else if (pendingOnboarding.length > 0) status = 'onboarding';
      else if (score < 70) status = 'risk';

      const signals: HealthSignalDraft[] = [
        ...overdueReceivables.map<HealthSignalDraft>((item) => ({
          signalType: 'finance_overdue',
          severity: 'high',
          source: 'finance',
          message: `Recebível ${item.referenceLabel} em atraso`,
          metadata: { receivableId: item.id } as Prisma.InputJsonValue,
        })),
        ...blockedDeliverables.map<HealthSignalDraft>((item) => ({
          signalType: 'delivery_blocked',
          severity: 'medium',
          source: 'projects',
          message: `Entregável bloqueado: ${item.name}`,
          metadata: { deliverableId: item.id } as Prisma.InputJsonValue,
        })),
      ];

      if (pendingOnboarding.length > 0) {
        signals.push({
          signalType: 'onboarding_pending',
          severity: 'medium',
          source: 'cs',
          message: `${pendingOnboarding.length} tarefa(s) de onboarding pendente(s)`,
          metadata: { planId: onboardingPlan?.id } as Prisma.InputJsonValue,
        });
      }

      const snapshot = await this.prisma.healthSnapshot.upsert({
        where: {
          clientId_contractId_snapshotDate: {
            clientId: contract.clientId,
            contractId: contract.id,
            snapshotDate,
          },
        },
        update: {
          status,
          score,
          summary: {
            overdueReceivables: overdueReceivables.length,
            blockedDeliverables: blockedDeliverables.length,
            pendingOnboarding: pendingOnboarding.length,
          },
        },
        create: {
          clientId: contract.clientId,
          contractId: contract.id,
          snapshotDate,
          status,
          score,
          summary: {
            overdueReceivables: overdueReceivables.length,
            blockedDeliverables: blockedDeliverables.length,
            pendingOnboarding: pendingOnboarding.length,
          },
        },
      });

      await this.prisma.healthSignal.deleteMany({
        where: { snapshotId: snapshot.id },
      });

      if (signals.length > 0) {
        await this.prisma.healthSignal.createMany({
          data: signals.map((signal) => ({
            snapshotId: snapshot.id,
            signalType: signal.signalType,
            severity: signal.severity,
            source: signal.source,
            message: signal.message,
            metadata: signal.metadata,
          })),
        });
      }

      const hydrated = await this.prisma.healthSnapshot.findUnique({
        where: { id: snapshot.id },
        include: {
          client: true,
          contract: true,
          signals: true,
        },
      });

      if (hydrated) portfolio.push(hydrated);
    }

    return portfolio;
  }

  async listRenewalBoard(clientId?: string) {
    return this.prisma.renewalOpportunity.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client: true,
        contract: true,
      },
      orderBy: [{ dueDate: 'asc' }],
    });
  }

  async listExpansionOpportunities(clientId?: string) {
    return this.prisma.expansionOpportunity.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client: true,
        contract: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async createExpansionOpportunity(input: CreateExpansionOpportunityInput) {
    const client = await this.prisma.client.findUnique({ where: { id: input.clientId } });
    if (!client) throw new Error('Client not found');

    if (input.contractId) {
      const contract = await this.prisma.contract.findUnique({ where: { id: input.contractId } });
      if (!contract) throw new Error('Contract not found');
    }

    return this.prisma.expansionOpportunity.create({
      data: {
        clientId: input.clientId,
        contractId: input.contractId ?? null,
        title: input.title.trim(),
        notes: input.notes ?? null,
        estimatedMrr: input.estimatedMrr ?? null,
      },
    });
  }
}
