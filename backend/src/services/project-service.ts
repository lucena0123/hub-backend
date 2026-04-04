import { PrismaClient } from '@prisma/client';

type ListProjectsOptions = {
  clientId?: string;
  status?: string;
};

type CreateProjectInput = {
  clientId: string;
  contractId?: string | null;
  name?: string;
  serviceType?: string;
  ownerUserId?: string | null;
  dueDate?: string | null;
};

type CreateMilestoneInput = {
  name: string;
  dueDate?: string | null;
};

type CreateDeliverableInput = {
  projectId: string;
  milestoneId?: string | null;
  name: string;
  description?: string | null;
  dueDate?: string | null;
};

type UpdateDeliverableInput = {
  status?: string;
  blockedReason?: string | null;
};

const DEFAULT_TEMPLATES: Record<string, { milestones: string[]; deliverables: Array<{ milestone: number; name: string }> }> = {
  marketing_retainer: {
    milestones: ['Kickoff', 'Planejamento', 'Execução', 'Revisão Mensal'],
    deliverables: [
      { milestone: 0, name: 'Kickoff e alinhamento inicial' },
      { milestone: 1, name: 'Plano operacional do ciclo' },
      { milestone: 2, name: 'Entrega principal do mês' },
      { milestone: 3, name: 'Revisão e próximos passos' },
    ],
  },
  landing_page: {
    milestones: ['Briefing', 'Wireframe', 'Implementação', 'Publicação'],
    deliverables: [
      { milestone: 0, name: 'Escopo validado' },
      { milestone: 1, name: 'Wireframe aprovado' },
      { milestone: 2, name: 'Página implementada' },
      { milestone: 3, name: 'Go-live e checklist final' },
    ],
  },
};

const toDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export class ProjectService {
  constructor(private readonly prisma: PrismaClient) {}

  async listProjects(options: ListProjectsOptions = {}) {
    return this.prisma.project.findMany({
      where: {
        ...(options.clientId ? { clientId: options.clientId } : {}),
        ...(options.status ? { status: options.status } : {}),
      },
      include: {
        client: true,
        contract: true,
        milestones: {
          orderBy: [{ orderIndex: 'asc' }],
        },
        deliverables: {
          orderBy: [{ createdAt: 'asc' }],
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async getProjectById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        milestones: {
          orderBy: [{ orderIndex: 'asc' }],
        },
        deliverables: {
          include: {
            workItems: true,
          },
          orderBy: [{ createdAt: 'asc' }],
        },
        workItems: {
          orderBy: [{ createdAt: 'asc' }],
        },
      },
    });
  }

  async createProject(input: CreateProjectInput) {
    const client = await this.prisma.client.findUnique({ where: { id: input.clientId } });
    if (!client) throw new Error('Client not found');

    let contractId = input.contractId ?? null;
    if (contractId) {
      const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
      if (!contract || contract.status !== 'active') throw new Error('Active contract not found');
    } else {
      const activeContract = await this.prisma.contract.findFirst({
        where: {
          clientId: input.clientId,
          status: 'active',
        },
        orderBy: [{ updatedAt: 'desc' }],
      });
      contractId = activeContract?.id ?? null;
    }

    const serviceType = input.serviceType?.trim() || 'marketing_retainer';
    const template = DEFAULT_TEMPLATES[serviceType] ?? DEFAULT_TEMPLATES.marketing_retainer;
    const startDate = new Date();

    const project = await this.prisma.project.create({
      data: {
        clientId: input.clientId,
        contractId,
        name: input.name?.trim() || `${client.name} - ${serviceType.replace(/_/g, ' ')}`,
        serviceType,
        status: 'planned',
        ownerUserId: input.ownerUserId ?? null,
        startDate,
        dueDate: toDate(input.dueDate) ?? addDays(startDate, 30),
      },
    });

    const milestones = await Promise.all(
      template.milestones.map((name, index) =>
        this.prisma.milestone.create({
          data: {
            projectId: project.id,
            name,
            orderIndex: index,
            dueDate: addDays(startDate, (index + 1) * 7),
          },
        })
      )
    );

    await Promise.all(
      template.deliverables.map((item) =>
        this.prisma.deliverable.create({
          data: {
            projectId: project.id,
            milestoneId: milestones[item.milestone]?.id ?? null,
            name: item.name,
            dueDate: milestones[item.milestone]?.dueDate ?? null,
          },
        })
      )
    );

    return this.getProjectById(project.id);
  }

  async ensureProjectForContract(contractId: string) {
    const existing = await this.prisma.project.findFirst({
      where: { contractId },
      select: { id: true },
    });
    if (existing) return this.getProjectById(existing.id);

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { client: true },
    });
    if (!contract || contract.status !== 'active') return null;

    return this.createProject({
      clientId: contract.clientId,
      contractId: contract.id,
      serviceType: contract.serviceType,
      name: `${contract.client.name} - Execução`,
      dueDate: contract.endDate ? contract.endDate.toISOString() : null,
    });
  }

  async createMilestone(projectId: string, input: CreateMilestoneInput) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const count = await this.prisma.milestone.count({ where: { projectId } });
    return this.prisma.milestone.create({
      data: {
        projectId,
        name: input.name.trim(),
        orderIndex: count,
        dueDate: toDate(input.dueDate),
      },
    });
  }

  async listDeliverables(projectId?: string, status?: string) {
    return this.prisma.deliverable.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        project: true,
        milestone: true,
        workItems: true,
      },
      orderBy: [{ dueDate: 'asc' }],
    });
  }

  async createDeliverable(input: CreateDeliverableInput) {
    const project = await this.prisma.project.findUnique({ where: { id: input.projectId } });
    if (!project) throw new Error('Project not found');

    return this.prisma.deliverable.create({
      data: {
        projectId: input.projectId,
        milestoneId: input.milestoneId ?? null,
        name: input.name.trim(),
        description: input.description ?? null,
        dueDate: toDate(input.dueDate),
      },
    });
  }

  async updateDeliverable(id: string, input: UpdateDeliverableInput) {
    const deliverable = await this.prisma.deliverable.findUnique({ where: { id } });
    if (!deliverable) throw new Error('Deliverable not found');

    return this.prisma.deliverable.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.blockedReason !== undefined ? { blockedReason: input.blockedReason } : {}),
      },
    });
  }
}
