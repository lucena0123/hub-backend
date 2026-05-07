import { PrismaClient } from '@prisma/client';

type ListContractsOptions = {
  clientId?: string;
  status?: string;
};

type CreateContractInput = {
  clientId: string;
  title?: string;
  serviceType?: string;
  startDate?: string;
  endDate?: string | null;
  billingCycle?: string;
  currency?: string;
  amount?: number | string | null;
};

type UpdateContractInput = Partial<CreateContractInput> & {
  status?: string;
};

type ListReceivablesOptions = {
  clientId?: string;
  status?: string;
};

type RecordPaymentInput = {
  amount: number | string;
  paidAt?: string;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
};

type ListRenewalsOptions = {
  clientId?: string;
  status?: string;
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const toDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const labelForReceivable = (date: Date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
};

export class FinanceService {
  constructor(private readonly prisma: PrismaClient) {}

  async listContracts(options: ListContractsOptions = {}) {
    const contracts = await this.prisma.contract.findMany({
      where: {
        ...(options.clientId ? { clientId: options.clientId } : {}),
        ...(options.status ? { status: options.status } : {}),
      },
      include: {
        client: true,
        terms: {
          orderBy: { version: 'desc' },
        },
        receivables: {
          orderBy: [{ dueDate: 'asc' }],
        },
        renewalOpportunities: {
          orderBy: [{ dueDate: 'asc' }],
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    return contracts.map((contract) => ({
      ...contract,
      openReceivables: contract.receivables.filter((item) => item.status !== 'paid').length,
      overdueReceivables: contract.receivables.filter(
        (item) => item.status !== 'paid' && item.dueDate < new Date()
      ).length,
      latestTerm: contract.terms[0] ?? null,
    }));
  }

  async getContractById(id: string) {
    return this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        terms: {
          orderBy: { version: 'desc' },
        },
        receivables: {
          include: {
            payments: {
              orderBy: { paidAt: 'desc' },
            },
            collectionActions: {
              orderBy: { actionAt: 'desc' },
            },
          },
          orderBy: [{ dueDate: 'asc' }],
        },
        renewalOpportunities: {
          orderBy: [{ dueDate: 'asc' }],
        },
      },
    });
  }

  async createContract(input: CreateContractInput) {
    const client = await this.prisma.client.findUnique({
      where: { id: input.clientId },
    });

    if (!client) throw new Error('Client not found');

    const startDate = toDate(input.startDate) ?? client.contractStart;
    const endDate = input.endDate === null ? null : toDate(input.endDate) ?? client.contractEnd ?? null;
    const amount = input.amount ?? client.budget;

    const contract = await this.prisma.contract.create({
      data: {
        clientId: client.id,
        title: input.title?.trim() || `${client.name} - Contrato`,
        serviceType: input.serviceType?.trim() || 'marketing_retainer',
        startDate,
        endDate,
        billingCycle: input.billingCycle?.trim() || 'monthly',
        currency: input.currency?.trim() || 'BRL',
        amount,
        terms: {
          create: {
            version: 1,
            status: 'draft',
            startDate,
            endDate,
            amount,
            scopeSummary: 'Contrato inicial criado pelo Hub',
          },
        },
      },
    });

    return this.getContractById(contract.id);
  }

  async updateContract(id: string, input: UpdateContractInput) {
    const existing = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!existing) throw new Error('Contract not found');

    await this.prisma.contract.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title?.trim() || existing.title } : {}),
        ...(input.serviceType !== undefined ? { serviceType: input.serviceType?.trim() || existing.serviceType } : {}),
        ...(input.startDate !== undefined ? { startDate: toDate(input.startDate) ?? existing.startDate } : {}),
        ...(input.endDate !== undefined ? { endDate: input.endDate === null ? null : toDate(input.endDate) } : {}),
        ...(input.billingCycle !== undefined ? { billingCycle: input.billingCycle?.trim() || existing.billingCycle } : {}),
        ...(input.currency !== undefined ? { currency: input.currency?.trim() || existing.currency } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    return this.getContractById(id);
  }

  async activateContract(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        terms: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!contract) throw new Error('Contract not found');

    const latestTerm = contract.terms[0];
    if (!latestTerm) throw new Error('Contract term not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id },
        data: { status: 'active' },
      });

      await tx.contractTerm.update({
        where: { id: latestTerm.id },
        data: { status: 'active' },
      });

      const anchor = contract.startDate > startOfToday() ? contract.startDate : startOfToday();
      const schedule = Array.from({ length: 3 }, (_, index) => addMonths(anchor, index));

      for (const dueDate of schedule) {
        const referenceLabel = labelForReceivable(dueDate);
        const existingReceivable = await tx.receivable.findFirst({
          where: {
            contractId: contract.id,
            referenceLabel,
          },
        });

        if (!existingReceivable) {
          await tx.receivable.create({
            data: {
              clientId: contract.clientId,
              contractId: contract.id,
              referenceLabel,
              dueDate,
              amount: latestTerm.amount ?? contract.amount ?? 0,
              status: dueDate < startOfToday() ? 'overdue' : 'scheduled',
              issuedAt: new Date(),
            },
          });
        }
      }
    });

    await this.syncRenewalOpportunities({ contractId: id });
    return this.getContractById(id);
  }

  async backfillContracts() {
    const clients = await this.prisma.client.findMany({
      orderBy: { createdAt: 'asc' },
    });

    let created = 0;
    for (const client of clients) {
      const existing = await this.prisma.contract.findFirst({
        where: { clientId: client.id },
        select: { id: true },
      });

      if (existing) continue;

      const startDate = client.contractStart;
      const endDate = client.contractEnd ?? null;
      const amount = client.budget ?? 0;

      await this.prisma.contract.create({
        data: {
          clientId: client.id,
          title: `${client.name} - Contrato`,
          serviceType: 'marketing_retainer',
          status: client.status === 'active' ? 'draft' : 'draft',
          startDate,
          endDate,
          billingCycle: 'monthly',
          currency: 'BRL',
          amount,
          terms: {
            create: {
              version: 1,
              status: 'draft',
              startDate,
              endDate,
              amount,
              scopeSummary: 'Backfill inicial a partir da ficha do cliente',
            },
          },
        },
      });

      created += 1;
    }

    return { created, totalClients: clients.length };
  }

  async listReceivables(options: ListReceivablesOptions = {}) {
    const today = startOfToday();
    await this.prisma.receivable.updateMany({
      where: {
        status: { in: ['scheduled', 'issued'] },
        dueDate: { lt: today },
      },
      data: { status: 'overdue' },
    });

    return this.prisma.receivable.findMany({
      where: {
        ...(options.clientId ? { clientId: options.clientId } : {}),
        ...(options.status ? { status: options.status } : {}),
      },
      include: {
        client: true,
        contract: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
        collectionActions: {
          orderBy: { actionAt: 'desc' },
        },
      },
      orderBy: [{ dueDate: 'asc' }],
    });
  }

  async recordPayment(receivableId: string, input: RecordPaymentInput) {
    const receivable = await this.prisma.receivable.findUnique({
      where: { id: receivableId },
      include: { payments: true },
    });

    if (!receivable) throw new Error('Receivable not found');

    const paidAt = toDate(input.paidAt) ?? new Date();
    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    await this.prisma.paymentRecord.create({
      data: {
        receivableId,
        amount,
        paidAt,
        paymentMethod: input.paymentMethod ?? null,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
      },
    });

    const paymentTotal = receivable.payments.reduce((sum, item) => sum + Number(item.amount), 0) + amount;
    const fullyPaid = paymentTotal >= Number(receivable.amount);

    await this.prisma.receivable.update({
      where: { id: receivableId },
      data: {
        status: fullyPaid ? 'paid' : 'issued',
        paidAt: fullyPaid ? paidAt : null,
      },
    });

    return this.prisma.receivable.findUnique({
      where: { id: receivableId },
      include: {
        client: true,
        contract: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });
  }

  async listRenewalOpportunities(options: ListRenewalsOptions = {}) {
    await this.syncRenewalOpportunities({});

    return this.prisma.renewalOpportunity.findMany({
      where: {
        ...(options.clientId ? { clientId: options.clientId } : {}),
        ...(options.status ? { status: options.status } : {}),
      },
      include: {
        client: true,
        contract: true,
      },
      orderBy: [{ dueDate: 'asc' }],
    });
  }

  private async syncRenewalOpportunities(options: { contractId?: string }) {
    const now = startOfToday();
    const inSixtyDays = addMonths(now, 2);
    const contracts = await this.prisma.contract.findMany({
      where: {
        status: 'active',
        endDate: {
          not: null,
          lte: inSixtyDays,
        },
        ...(options.contractId ? { id: options.contractId } : {}),
      },
    });

    for (const contract of contracts) {
      if (!contract.endDate) continue;

      await this.prisma.renewalOpportunity.upsert({
        where: {
          contractId_dueDate: {
            contractId: contract.id,
            dueDate: contract.endDate,
          },
        },
        update: {
          status: contract.endDate < now ? 'overdue' : 'open',
        },
        create: {
          clientId: contract.clientId,
          contractId: contract.id,
          dueDate: contract.endDate,
          status: contract.endDate < now ? 'overdue' : 'open',
          notes: 'Oportunidade de renovação gerada automaticamente pelo Hub',
        },
      });
    }
  }
}
