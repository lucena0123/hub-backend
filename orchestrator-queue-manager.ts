/**
 * SOLUÇÃO 3: ORQUESTRAÇÃO E GESTÃO DE RECURSOS
 * Gerenciador de Filas e Priorização de Tarefas
 *
 * Organiza demandas de múltiplos clientes com algoritmo de priorização baseado em:
 * - Urgência do SLA
 * - Valor do cliente (tier)
 * - Criticidade do processo
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Task {
  taskId: string;
  clientId: string;
  processId: string;       // ex: "5.2", "6.1", "7.1"
  priority: number;         // 1-10 (10 = crítico)
  sla: string;             // ex: "2h", "4h", "1d"
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;       // ISO 8601
  assignedTo: string | null;
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface Queue {
  queueId: string;
  processId: string;        // Queue dedicada para cada processo
  tasks: Task[];
  maxConcurrency: number;   // Limite de tasks simultâneas
  currentLoad: number;      // Tasks em andamento
}

export interface ClientTier {
  tier: 1 | 2 | 3;
  name: 'Enterprise' | 'Growth' | 'Starter';
  priorityMultiplier: number;
  slaReduction: number;     // % de redução no SLA
}

// ============================================================================
// CONFIGURAÇÕES DE TIERS
// ============================================================================

export const CLIENT_TIERS: Record<number, ClientTier> = {
  1: { tier: 1, name: 'Enterprise', priorityMultiplier: 10, slaReduction: 0.5 },
  2: { tier: 2, name: 'Growth', priorityMultiplier: 7, slaReduction: 0 },
  3: { tier: 3, name: 'Starter', priorityMultiplier: 5, slaReduction: 0.25 }
};

// Criticidade por tipo de processo
export const PROCESS_CRITICALITY: Record<string, number> = {
  // Crítico - Problemas imediatos
  '6.1': 10,  // Atendimento ao Cliente
  '6.4': 10,  // Offboarding

  // Alta - Operacional
  '5.2': 8,   // Otimização de Lances
  '7.1': 8,   // Faturamento

  // Média - Estratégico
  '6.2': 6,   // Apresentação de Resultados
  '6.3': 6,   // Alinhamento Estratégico
  '7.2': 7,   // Renovação
  '7.3': 6,   // Expansão

  // Baixa - Melhoria contínua
  '5.1': 4,   // Monitoramento (roda automaticamente)
  '5.3': 3    // Testes A/B (pode aguardar)
};

// ============================================================================
// QUEUE MANAGER CLASS
// ============================================================================

export class QueueManager {
  private queues: Map<string, Queue>;
  private clientTiers: Map<string, number>; // clientId => tier number

  constructor() {
    this.queues = new Map();
    this.clientTiers = new Map();
    this.initializeQueues();
  }

  /**
   * Inicializa filas para cada processo
   */
  private initializeQueues(): void {
    const processes = Object.keys(PROCESS_CRITICALITY);

    processes.forEach(processId => {
      this.queues.set(processId, {
        queueId: `q_${processId}`,
        processId,
        tasks: [],
        maxConcurrency: this.getMaxConcurrency(processId),
        currentLoad: 0
      });
    });
  }

  /**
   * Define concorrência máxima baseado no tipo de processo
   */
  private getMaxConcurrency(processId: string): number {
    // Processos críticos têm maior concorrência
    if (PROCESS_CRITICALITY[processId] >= 8) return 10;
    if (PROCESS_CRITICALITY[processId] >= 6) return 5;
    return 3;
  }

  /**
   * Registra tier do cliente
   */
  public setClientTier(clientId: string, tier: 1 | 2 | 3): void {
    this.clientTiers.set(clientId, tier);
  }

  /**
   * Obtém tier do cliente
   */
  public getClientTier(clientId: string): number {
    return this.clientTiers.get(clientId) || 3; // Default: Starter
  }

  /**
   * ALGORITMO DE PRIORIZAÇÃO
   * Prioridade = (Urgência SLA × 0.4) + (Valor Cliente × 0.3) + (Criticidade × 0.3)
   */
  public calculatePriority(task: Task): number {
    const slaUrgency = this.getSLAUrgency(task.sla, task.createdAt);
    const clientValue = this.getClientValue(task.clientId);
    const criticality = PROCESS_CRITICALITY[task.processId] || 5;

    const priority = (slaUrgency * 0.4) + (clientValue * 0.3) + (criticality * 0.3);

    return Math.round(priority * 10) / 10; // Arredonda para 1 casa decimal
  }

  /**
   * Calcula urgência baseado em quanto tempo falta para o SLA break
   */
  private getSLAUrgency(sla: string, createdAt: string): number {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const timeElapsed = now - created;

    const slaThreshold = this.parseSLA(sla);
    const percentageElapsed = timeElapsed / slaThreshold;

    if (percentageElapsed >= 0.9) return 10;  // Crítico - 90%+ do SLA usado
    if (percentageElapsed >= 0.75) return 8;  // Alto - 75%+
    if (percentageElapsed >= 0.5) return 6;   // Médio - 50%+
    if (percentageElapsed >= 0.25) return 4;  // Baixo - 25%+
    return 2;                                  // Muito tempo disponível
  }

  /**
   * Converte SLA string para milliseconds
   */
  private parseSLA(sla: string): number {
    const value = parseInt(sla);
    const unit = sla.slice(-1);

    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;      // horas
      case 'd': return value * 24 * 60 * 60 * 1000; // dias
      case 'm': return value * 60 * 1000;            // minutos
      default: return 2 * 60 * 60 * 1000;            // Default: 2h
    }
  }

  /**
   * Obtém valor do cliente baseado no tier
   */
  private getClientValue(clientId: string): number {
    const tier = this.getClientTier(clientId);
    return CLIENT_TIERS[tier].priorityMultiplier;
  }

  /**
   * Adiciona task à fila apropriada
   */
  public enqueue(task: Task): { status: string; position: number; priority: number } {
    const queue = this.queues.get(task.processId);

    if (!queue) {
      throw new Error(`Queue not found for process ${task.processId}`);
    }

    // Calcula prioridade
    task.priority = this.calculatePriority(task);

    // Adiciona à fila
    queue.tasks.push(task);

    // Reordena por prioridade (maior prioridade primeiro)
    queue.tasks.sort((a, b) => b.priority - a.priority);

    // Retorna posição na fila
    const position = queue.tasks.findIndex(t => t.taskId === task.taskId) + 1;

    return {
      status: 'queued',
      position,
      priority: task.priority
    };
  }

  /**
   * Remove próxima task da fila (maior prioridade)
   */
  public dequeue(processId: string): Task | null {
    const queue = this.queues.get(processId);

    if (!queue || queue.tasks.length === 0) {
      return null;
    }

    // Verifica se não excedeu concorrência máxima
    if (queue.currentLoad >= queue.maxConcurrency) {
      return null;
    }

    // Remove task de maior prioridade
    const task = queue.tasks.shift();

    if (task) {
      task.status = 'in_progress';
      task.startedAt = new Date().toISOString();
      queue.currentLoad++;
    }

    return task || null;
  }

  /**
   * Marca task como concluída
   */
  public completeTask(taskId: string, processId: string): void {
    const queue = this.queues.get(processId);

    if (queue) {
      queue.currentLoad = Math.max(0, queue.currentLoad - 1);
    }
  }

  /**
   * Retorna status de todas as filas
   */
  public getQueuesStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    this.queues.forEach((queue, processId) => {
      status[processId] = {
        queueId: queue.queueId,
        pending: queue.tasks.length,
        inProgress: queue.currentLoad,
        maxConcurrency: queue.maxConcurrency,
        utilization: Math.round((queue.currentLoad / queue.maxConcurrency) * 100),
        nextTask: queue.tasks[0] || null
      };
    });

    return status;
  }

  /**
   * Retorna tarefas de um cliente específico
   */
  public getClientTasks(clientId: string): Task[] {
    const allTasks: Task[] = [];

    this.queues.forEach(queue => {
      const clientTasks = queue.tasks.filter(task => task.clientId === clientId);
      allTasks.push(...clientTasks);
    });

    return allTasks.sort((a, b) => b.priority - a.priority);
  }
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

// Inicializar queue manager
const queueManager = new QueueManager();

// Registrar tiers de clientes
queueManager.setClientTier('cliente_A', 1); // Enterprise
queueManager.setClientTier('cliente_B', 2); // Growth
queueManager.setClientTier('cliente_C', 3); // Starter

// Adicionar tasks
const task1: Task = {
  taskId: 't_001',
  clientId: 'cliente_A',
  processId: '5.2',
  priority: 0, // Será calculado
  sla: '2h',
  status: 'pending',
  createdAt: new Date().toISOString(),
  assignedTo: null
};

const task2: Task = {
  taskId: 't_002',
  clientId: 'cliente_B',
  processId: '6.1',
  priority: 0,
  sla: '4h',
  status: 'pending',
  createdAt: new Date().toISOString(),
  assignedTo: null
};

// Enfileirar tasks
// const result1 = queueManager.enqueue(task1);
// const result2 = queueManager.enqueue(task2);

// console.log('Task 1 enfileirada:', result1);
// console.log('Task 2 enfileirada:', result2);

// Ver status das filas
// console.log('Status das filas:', queueManager.getQueuesStatus());

// Processar próxima task
// const nextTask = queueManager.dequeue('6.1');
// console.log('Próxima task a processar:', nextTask);

export default queueManager;
