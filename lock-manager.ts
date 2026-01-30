/**
 * SOLUÇÃO 4: SISTEMA DE LOCKS E CONFLITOS
 * Gerenciador de Locks Distribuídos
 *
 * Previne conflitos quando múltiplos processos tentam acessar o mesmo recurso:
 * - Campanhas sendo otimizadas e cliente reporta bug
 * - Múltiplos processos tentando modificar mesmo cliente
 * - Sistema de prioridades para preempção
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Lock {
  lockId: string;
  resourceType: 'campaign' | 'client' | 'landing_page' | 'budget' | 'contract';
  resourceId: string;
  clientId: string;
  holderId: string;            // process_X.Y_instance_NNN
  holderType: string;          // Nome do processo (ex: "optimization", "offboarding")
  acquiredAt: string;          // ISO 8601
  expiresAt: string;           // Auto-release após timeout
  priority: number;            // 1-10
  status: 'active' | 'expired' | 'released';
  metadata?: Record<string, any>;
}

export interface LockRequest {
  resourceType: Lock['resourceType'];
  resourceId: string;
  clientId: string;
  holderId: string;
  holderType: string;
  priority: number;
  ttl?: number;                // Time-to-live em minutos (default: 30)
}

export interface LockResponse {
  success: boolean;
  lock?: Lock;
  status: 'acquired' | 'queued' | 'rejected';
  reason?: string;
  queuePosition?: number;
  preempted?: string;          // ID do holder que foi preemptado
}

export interface WaitQueueEntry {
  request: LockRequest;
  enqueuedAt: string;
  position: number;
}

// ============================================================================
// HIERARQUIA DE PRIORIDADES
// ============================================================================

export const LOCK_PRIORITIES = {
  // PRIORIDADE ALTA - Pode interromper tudo
  OFFBOARDING: 10,                    // 6.4 - Cliente cancelou
  CRITICAL_SUPPORT: 9,                // 6.1 - Bug crítico reportado
  DISASTER_RECOVERY: 8,               // Sistema em recovery

  // PRIORIDADE MÉDIA - Pode aguardar
  OPTIMIZATION: 7,                    // 5.2 - Otimização de lances
  RESULTS_PRESENTATION: 6,            // 6.2 - Apresentação de resultados
  STRATEGIC_ALIGNMENT: 5,             // 6.3 - Alinhamento estratégico

  // PRIORIDADE BAIXA - Sempre aguarda
  AB_TESTING: 4,                      // 5.3 - Testes A/B
  MONITORING: 3,                      // 5.1 - Monitoramento
  REPORTING: 2                        // Relatórios batch
};

// Mapeamento processo -> prioridade
export const PROCESS_LOCK_PRIORITY: Record<string, number> = {
  '6.4': LOCK_PRIORITIES.OFFBOARDING,
  '6.1': LOCK_PRIORITIES.CRITICAL_SUPPORT,
  '5.2': LOCK_PRIORITIES.OPTIMIZATION,
  '6.2': LOCK_PRIORITIES.RESULTS_PRESENTATION,
  '6.3': LOCK_PRIORITIES.STRATEGIC_ALIGNMENT,
  '5.3': LOCK_PRIORITIES.AB_TESTING,
  '5.1': LOCK_PRIORITIES.MONITORING
};

// ============================================================================
// LOCK MANAGER CLASS
// ============================================================================

export class LockManager {
  private locks: Map<string, Lock>;              // resourceId => Lock
  private waitQueues: Map<string, WaitQueueEntry[]>; // resourceId => Queue
  private eventListeners: Map<string, Function[]>;   // event => callbacks

  constructor() {
    this.locks = new Map();
    this.waitQueues = new Map();
    this.eventListeners = new Map();
    this.startExpirationMonitor();
  }

  /**
   * Gera ID único para o lock
   */
  private generateLockId(resourceType: string, resourceId: string): string {
    return `lock_${resourceType}_${resourceId}_${Date.now()}`;
  }

  /**
   * Tenta adquirir lock em recurso
   */
  public async acquireLock(request: LockRequest): Promise<LockResponse> {
    const resourceKey = `${request.resourceType}:${request.resourceId}`;

    // 1. Verifica se recurso já está locked
    const existingLock = this.locks.get(resourceKey);

    if (!existingLock || existingLock.status !== 'active') {
      // Recurso livre, cria lock
      const lock = this.createLock(request);
      this.locks.set(resourceKey, lock);

      this.emit('lock:acquired', { lock, request });

      return {
        success: true,
        lock,
        status: 'acquired'
      };
    }

    // 2. Recurso locked, compara prioridades
    if (request.priority > existingLock.priority) {
      // Nova requisição tem prioridade maior - PREEMPÇÃO
      this.emit('lock:preempted', {
        oldLock: existingLock,
        newRequest: request,
        reason: 'Higher priority process'
      });

      // Notifica holder atual
      this.notifyHolder(existingLock.holderId, 'preempted', {
        reason: `Preempted by ${request.holderType} (priority ${request.priority})`,
        action: 'rollback_and_release'
      });

      // Remove lock antigo
      this.releaseLock(existingLock.lockId, existingLock.holderId);

      // Cria novo lock
      const newLock = this.createLock(request);
      this.locks.set(resourceKey, newLock);

      return {
        success: true,
        lock: newLock,
        status: 'acquired',
        preempted: existingLock.holderId
      };
    }

    // 3. Prioridade menor ou igual, entra na fila de espera
    const position = this.addToWaitQueue(resourceKey, request);

    return {
      success: false,
      status: 'queued',
      reason: `Resource locked by ${existingLock.holderType}`,
      queuePosition: position
    };
  }

  /**
   * Cria novo lock
   */
  private createLock(request: LockRequest): Lock {
    const now = new Date();
    const ttl = request.ttl || 30; // Default: 30 minutos
    const expiresAt = new Date(now.getTime() + ttl * 60 * 1000);

    return {
      lockId: this.generateLockId(request.resourceType, request.resourceId),
      resourceType: request.resourceType,
      resourceId: request.resourceId,
      clientId: request.clientId,
      holderId: request.holderId,
      holderType: request.holderType,
      acquiredAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      priority: request.priority,
      status: 'active'
    };
  }

  /**
   * Adiciona requisição à fila de espera
   */
  private addToWaitQueue(resourceKey: string, request: LockRequest): number {
    if (!this.waitQueues.has(resourceKey)) {
      this.waitQueues.set(resourceKey, []);
    }

    const queue = this.waitQueues.get(resourceKey)!;

    const entry: WaitQueueEntry = {
      request,
      enqueuedAt: new Date().toISOString(),
      position: queue.length + 1
    };

    queue.push(entry);

    // Ordena por prioridade (maior prioridade primeiro)
    queue.sort((a, b) => b.request.priority - a.request.priority);

    // Recalcula posições
    queue.forEach((e, idx) => e.position = idx + 1);

    return entry.position;
  }

  /**
   * Libera lock
   */
  public releaseLock(lockId: string, holderId: string): boolean {
    // Encontra lock
    let resourceKey: string | null = null;
    let lock: Lock | null = null;

    this.locks.forEach((l, key) => {
      if (l.lockId === lockId && l.holderId === holderId) {
        resourceKey = key;
        lock = l;
      }
    });

    if (!lock || !resourceKey) {
      return false;
    }

    // Marca como released
    lock.status = 'released';
    this.locks.delete(resourceKey);

    this.emit('lock:released', { lock, holderId });

    // Processa próxima requisição da fila
    this.processWaitQueue(resourceKey);

    return true;
  }

  /**
   * Processa próxima requisição da fila de espera
   */
  private processWaitQueue(resourceKey: string): void {
    const queue = this.waitQueues.get(resourceKey);

    if (!queue || queue.length === 0) {
      return;
    }

    // Pega primeira requisição da fila
    const nextEntry = queue.shift();

    if (nextEntry) {
      // Tenta adquirir lock automaticamente
      this.acquireLock(nextEntry.request).then(response => {
        if (response.success) {
          this.emit('lock:queue_processed', {
            resourceKey,
            request: nextEntry.request,
            lock: response.lock
          });
        }
      });
    }
  }

  /**
   * Notifica holder de um evento (preempção, expiração, etc.)
   */
  private notifyHolder(holderId: string, event: string, data: any): void {
    this.emit('holder:notification', {
      holderId,
      event,
      data,
      timestamp: new Date().toISOString()
    });

    // Em produção, isso enviaria mensagem via Event Bus/RabbitMQ/Kafka
    console.log(`[LockManager] Notifying ${holderId} about ${event}:`, data);
  }

  /**
   * Verifica status de um lock
   */
  public getLockStatus(resourceType: string, resourceId: string): Lock | null {
    const resourceKey = `${resourceType}:${resourceId}`;
    return this.locks.get(resourceKey) || null;
  }

  /**
   * Lista todos os locks ativos
   */
  public getActiveLocks(): Lock[] {
    return Array.from(this.locks.values()).filter(l => l.status === 'active');
  }

  /**
   * Retorna fila de espera para um recurso
   */
  public getWaitQueue(resourceType: string, resourceId: string): WaitQueueEntry[] {
    const resourceKey = `${resourceType}:${resourceId}`;
    return this.waitQueues.get(resourceKey) || [];
  }

  /**
   * Monitor de expiração automática
   */
  private startExpirationMonitor(): void {
    setInterval(() => {
      const now = new Date();

      this.locks.forEach((lock, resourceKey) => {
        const expiresAt = new Date(lock.expiresAt);

        if (now > expiresAt && lock.status === 'active') {
          console.log(`[LockManager] Lock ${lock.lockId} expired, releasing...`);

          lock.status = 'expired';
          this.locks.delete(resourceKey);

          this.emit('lock:expired', { lock });

          // Notifica holder
          this.notifyHolder(lock.holderId, 'expired', {
            reason: 'Lock TTL exceeded',
            action: 'rollback_if_needed'
          });

          // Processa fila
          this.processWaitQueue(resourceKey);
        }
      });
    }, 60000); // Verifica a cada 1 minuto
  }

  /**
   * Sistema de eventos (Event Emitter pattern)
   */
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Retorna estatísticas de locks
   */
  public getStatistics(): Record<string, any> {
    const activeLocks = this.getActiveLocks();

    return {
      activeLocks: activeLocks.length,
      totalQueued: Array.from(this.waitQueues.values()).reduce((sum, q) => sum + q.length, 0),
      locksByType: this.groupLocksByType(activeLocks),
      locksByPriority: this.groupLocksByPriority(activeLocks),
      avgLockDuration: this.calculateAvgLockDuration(activeLocks)
    };
  }

  private groupLocksByType(locks: Lock[]): Record<string, number> {
    const groups: Record<string, number> = {};
    locks.forEach(lock => {
      groups[lock.resourceType] = (groups[lock.resourceType] || 0) + 1;
    });
    return groups;
  }

  private groupLocksByPriority(locks: Lock[]): Record<number, number> {
    const groups: Record<number, number> = {};
    locks.forEach(lock => {
      groups[lock.priority] = (groups[lock.priority] || 0) + 1;
    });
    return groups;
  }

  private calculateAvgLockDuration(locks: Lock[]): number {
    if (locks.length === 0) return 0;

    const now = new Date().getTime();
    const durations = locks.map(lock => {
      const acquired = new Date(lock.acquiredAt).getTime();
      return (now - acquired) / 1000 / 60; // minutos
    });

    return Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
  }
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

// Inicializar lock manager
const lockManager = new LockManager();

// Listener para preempções
lockManager.on('lock:preempted', (data: any) => {
  console.log(`[Alert] Lock preempted:`, data);
  // Aqui enviaria alerta para sistema de monitoramento
});

// Cenário 1: Processo 5.2 adquire lock para otimizar campanha
// const optimization = await lockManager.acquireLock({
//   resourceType: 'campaign',
//   resourceId: 'campaign_12345',
//   clientId: 'cliente_A',
//   holderId: 'process_5.2_instance_001',
//   holderType: 'optimization',
//   priority: LOCK_PRIORITIES.OPTIMIZATION, // 7
//   ttl: 30
// });

// Cenário 2: Cliente reporta bug crítico (6.1) e precisa acessar mesma campanha
// const support = await lockManager.acquireLock({
//   resourceType: 'campaign',
//   resourceId: 'campaign_12345',
//   clientId: 'cliente_A',
//   holderId: 'process_6.1_instance_042',
//   holderType: 'critical_support',
//   priority: LOCK_PRIORITIES.CRITICAL_SUPPORT, // 9
//   ttl: 15
// });
// // Resultado: support preempta optimization

// Ver estatísticas
// console.log('Estatísticas de locks:', lockManager.getStatistics());

export default lockManager;
