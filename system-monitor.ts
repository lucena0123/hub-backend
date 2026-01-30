/**
 * SOLUÇÃO 6: MONITORAMENTO DO SISTEMA
 * Dashboard de Saúde e Performance
 *
 * Monitora:
 * - Performance dos processos
 * - SLA compliance
 * - Capacidade do sistema
 * - Erros e alertas
 * - Health scores
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ProcessHealth {
  processId: string;
  health: number;              // 0-100
  avgDuration: string;         // ex: "12min", "3 days"
  successRate: number;         // %
  totalExecutions: number;
  failedExecutions: number;
  avgResponseTime: number;     // ms
  status: 'healthy' | 'degraded' | 'critical';
}

export interface SLACompliance {
  total: number;               // %
  breaches24h: number;
  breaches7days: number;
  breaches30days: number;
  worstProcess: string;        // Processo com mais SLA breaks
  breachesByProcess: Record<string, number>;
}

export interface SystemCapacity {
  current: number;             // %
  available: number;           // %
  trend: 'increasing' | 'stable' | 'decreasing';
  projectedFull: string;       // ex: "7 days"
  utilizationByTeam: Record<string, number>;
}

export interface SystemErrors {
  last24h: number;
  critical: number;
  warnings: number;
  info: number;
  topErrors: ErrorSummary[];
}

export interface ErrorSummary {
  errorType: string;
  count: number;
  lastOccurrence: string;
  affectedProcesses: string[];
}

export interface SystemHealth {
  overall: number;             // 0-100
  timestamp: string;
  processes: Record<string, ProcessHealth>;
  slaCompliance: SLACompliance;
  capacity: SystemCapacity;
  errors: SystemErrors;
  alerts: SystemAlert[];
}

export interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  processId?: string;
  clientId?: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface ProcessExecution {
  executionId: string;
  processId: string;
  clientId: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;           // ms
  status: 'running' | 'completed' | 'failed';
  error?: string;
  sla: string;
  slaBreached: boolean;
}

// ============================================================================
// SYSTEM MONITOR CLASS
// ============================================================================

export class SystemMonitor {
  private executions: ProcessExecution[];
  private alerts: SystemAlert[];
  private processes: Set<string>;

  // Thresholds de alerta
  private readonly HEALTH_THRESHOLDS = {
    critical: 60,
    warning: 80
  };

  private readonly SLA_BREACH_THRESHOLDS = {
    critical: 10,  // >10 breaches em 24h = crítico
    warning: 5     // >5 breaches em 24h = warning
  };

  private readonly CAPACITY_THRESHOLDS = {
    critical: 90,  // >90% = crítico
    warning: 75    // >75% = warning
  };

  constructor() {
    this.executions = [];
    this.alerts = [];
    this.processes = new Set();

    // Lista de processos do sistema
    ['0.1', '1.1', '1.2', '1.3', '2.1', '2.2', '2.3',
     '3.1', '3.2', '3.3', '3.4', '4.1', '4.2', '4.3',
     '5.1', '5.2', '5.3', '6.1', '6.2', '6.3', '6.4',
     '7.1', '7.2', '7.3'].forEach(p => this.processes.add(p));
  }

  /**
   * Registra início de execução de processo
   */
  public startExecution(
    processId: string,
    clientId: string,
    sla: string
  ): string {
    const executionId = `exec_${processId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const execution: ProcessExecution = {
      executionId,
      processId,
      clientId,
      startedAt: new Date().toISOString(),
      status: 'running',
      sla,
      slaBreached: false
    };

    this.executions.push(execution);

    return executionId;
  }

  /**
   * Registra conclusão de execução
   */
  public completeExecution(
    executionId: string,
    status: 'completed' | 'failed',
    error?: string
  ): void {
    const execution = this.executions.find(e => e.executionId === executionId);

    if (!execution) {
      console.error(`Execution ${executionId} not found`);
      return;
    }

    execution.completedAt = new Date().toISOString();
    execution.status = status;
    execution.error = error;

    // Calcula duração
    const startTime = new Date(execution.startedAt).getTime();
    const endTime = new Date(execution.completedAt).getTime();
    execution.duration = endTime - startTime;

    // Verifica SLA breach
    const slaMs = this.parseSLA(execution.sla);
    execution.slaBreached = execution.duration > slaMs;

    if (execution.slaBreached) {
      this.createAlert({
        severity: 'warning',
        message: `SLA breach detected for process ${execution.processId}`,
        processId: execution.processId,
        clientId: execution.clientId
      });
    }

    if (status === 'failed') {
      this.createAlert({
        severity: 'critical',
        message: `Process ${execution.processId} failed: ${error}`,
        processId: execution.processId,
        clientId: execution.clientId
      });
    }
  }

  /**
   * Converte SLA string para milliseconds
   */
  private parseSLA(sla: string): number {
    const value = parseInt(sla);
    const unit = sla.slice(-1);

    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return 2 * 60 * 60 * 1000; // Default: 2h
    }
  }

  /**
   * Cria alerta no sistema
   */
  private createAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const newAlert: SystemAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.push(newAlert);

    // Em produção: enviar para sistema de alertas (Slack, PagerDuty, etc.)
    console.log(`[ALERT ${alert.severity.toUpperCase()}] ${alert.message}`);
  }

  /**
   * Calcula health de um processo específico
   */
  private calculateProcessHealth(processId: string, periodHours: number = 24): ProcessHealth {
    const periodMs = periodHours * 60 * 60 * 1000;
    const periodStart = new Date(Date.now() - periodMs);

    const executions = this.executions.filter(e =>
      e.processId === processId &&
      new Date(e.startedAt) >= periodStart &&
      e.status !== 'running'
    );

    const totalExecutions = executions.length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    const successRate = totalExecutions > 0
      ? ((totalExecutions - failedExecutions) / totalExecutions) * 100
      : 100;

    // Calcula duração média
    const completedExecutions = executions.filter(e => e.duration);
    const avgDuration = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
      : 0;

    // Health score (0-100)
    // - Success rate: 60%
    // - SLA compliance: 40%
    const slaBreaches = executions.filter(e => e.slaBreached).length;
    const slaCompliance = totalExecutions > 0
      ? ((totalExecutions - slaBreaches) / totalExecutions) * 100
      : 100;

    const health = Math.round((successRate * 0.6) + (slaCompliance * 0.4));

    let status: ProcessHealth['status'] = 'healthy';
    if (health < this.HEALTH_THRESHOLDS.critical) status = 'critical';
    else if (health < this.HEALTH_THRESHOLDS.warning) status = 'degraded';

    return {
      processId,
      health,
      avgDuration: this.formatDuration(avgDuration),
      successRate: Math.round(successRate * 10) / 10,
      totalExecutions,
      failedExecutions,
      avgResponseTime: avgDuration,
      status
    };
  }

  /**
   * Formata duração em formato legível
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}min`;
    if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
    return `${Math.round(ms / 86400000)}d`;
  }

  /**
   * Calcula SLA compliance
   */
  private calculateSLACompliance(): SLACompliance {
    const now = Date.now();

    const breaches24h = this.countSLABreaches(24);
    const breaches7days = this.countSLABreaches(24 * 7);
    const breaches30days = this.countSLABreaches(24 * 30);

    const total30days = this.executions.filter(e =>
      new Date(e.startedAt).getTime() >= now - 30 * 24 * 60 * 60 * 1000 &&
      e.status !== 'running'
    ).length;

    const complianceRate = total30days > 0
      ? ((total30days - breaches30days) / total30days) * 100
      : 100;

    // Encontra processo com mais breaches
    const breachesByProcess: Record<string, number> = {};
    this.processes.forEach(p => {
      breachesByProcess[p] = this.executions.filter(e =>
        e.processId === p &&
        e.slaBreached &&
        new Date(e.startedAt).getTime() >= now - 30 * 24 * 60 * 60 * 1000
      ).length;
    });

    const worstProcess = Object.entries(breachesByProcess)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      total: Math.round(complianceRate * 10) / 10,
      breaches24h,
      breaches7days,
      breaches30days,
      worstProcess,
      breachesByProcess
    };
  }

  /**
   * Conta SLA breaches em um período
   */
  private countSLABreaches(hours: number): number {
    const periodMs = hours * 60 * 60 * 1000;
    const periodStart = new Date(Date.now() - periodMs);

    return this.executions.filter(e =>
      new Date(e.startedAt) >= periodStart &&
      e.slaBreached
    ).length;
  }

  /**
   * Calcula capacidade do sistema
   */
  private calculateCapacity(): SystemCapacity {
    // Em produção: integrar com CapacityManager

    // Mock data
    const current = 72;
    const available = 28;

    return {
      current,
      available,
      trend: 'increasing',
      projectedFull: '7 days',
      utilizationByTeam: {
        'team_trafego': 75,
        'team_cs': 68,
        'team_financeiro': 82,
        'team_vendas': 65
      }
    };
  }

  /**
   * Analisa erros do sistema
   */
  private analyzeErrors(): SystemErrors {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const failedExecutions = this.executions.filter(e =>
      e.status === 'failed' &&
      new Date(e.startedAt).getTime() >= last24h
    );

    const critical = this.alerts.filter(a =>
      a.severity === 'critical' &&
      new Date(a.timestamp).getTime() >= last24h
    ).length;

    const warnings = this.alerts.filter(a =>
      a.severity === 'warning' &&
      new Date(a.timestamp).getTime() >= last24h
    ).length;

    // Agrupa erros por tipo
    const errorGroups: Record<string, ErrorSummary> = {};

    failedExecutions.forEach(e => {
      const errorType = e.error || 'Unknown Error';

      if (!errorGroups[errorType]) {
        errorGroups[errorType] = {
          errorType,
          count: 0,
          lastOccurrence: e.startedAt,
          affectedProcesses: []
        };
      }

      errorGroups[errorType].count++;
      if (!errorGroups[errorType].affectedProcesses.includes(e.processId)) {
        errorGroups[errorType].affectedProcesses.push(e.processId);
      }
    });

    const topErrors = Object.values(errorGroups)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      last24h: failedExecutions.length,
      critical,
      warnings,
      info: this.alerts.filter(a => a.severity === 'info').length,
      topErrors
    };
  }

  /**
   * Retorna health completo do sistema
   */
  public getSystemHealth(): SystemHealth {
    const processHealthMap: Record<string, ProcessHealth> = {};

    this.processes.forEach(processId => {
      processHealthMap[processId] = this.calculateProcessHealth(processId);
    });

    const slaCompliance = this.calculateSLACompliance();
    const capacity = this.calculateCapacity();
    const errors = this.analyzeErrors();

    // Health geral (média ponderada)
    const avgProcessHealth = Object.values(processHealthMap)
      .reduce((sum, p) => sum + p.health, 0) / this.processes.size;

    const overall = Math.round(
      (avgProcessHealth * 0.5) +
      (slaCompliance.total * 0.3) +
      ((100 - capacity.current) * 0.2)
    );

    // Gera alertas baseado em thresholds
    const currentAlerts = this.generateSystemAlerts(
      slaCompliance,
      capacity,
      errors,
      processHealthMap
    );

    return {
      overall,
      timestamp: new Date().toISOString(),
      processes: processHealthMap,
      slaCompliance,
      capacity,
      errors,
      alerts: currentAlerts
    };
  }

  /**
   * Gera alertas baseado em métricas
   */
  private generateSystemAlerts(
    sla: SLACompliance,
    capacity: SystemCapacity,
    errors: SystemErrors,
    processes: Record<string, ProcessHealth>
  ): SystemAlert[] {
    const alerts = [...this.alerts.filter(a => !a.acknowledged)];

    // SLA breaches
    if (sla.breaches24h >= this.SLA_BREACH_THRESHOLDS.critical) {
      alerts.push({
        id: `alert_sla_critical_${Date.now()}`,
        severity: 'critical',
        message: `Critical: ${sla.breaches24h} SLA breaches in last 24h`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    } else if (sla.breaches24h >= this.SLA_BREACH_THRESHOLDS.warning) {
      alerts.push({
        id: `alert_sla_warning_${Date.now()}`,
        severity: 'warning',
        message: `Warning: ${sla.breaches24h} SLA breaches in last 24h`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Capacidade
    if (capacity.current >= this.CAPACITY_THRESHOLDS.critical) {
      alerts.push({
        id: `alert_capacity_critical_${Date.now()}`,
        severity: 'critical',
        message: `Critical: System capacity at ${capacity.current}%`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Processos degradados
    Object.values(processes).forEach(p => {
      if (p.status === 'critical') {
        alerts.push({
          id: `alert_process_${p.processId}_${Date.now()}`,
          severity: 'critical',
          message: `Process ${p.processId} is critical (health: ${p.health})`,
          processId: p.processId,
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      }
    });

    return alerts.slice(-20); // Últimos 20 alertas
  }

  /**
   * Reconhece alerta
   */
  public acknowledgeAlert(alertId: string, userId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`[Alert ${alertId}] Acknowledged by ${userId}`);
    }
  }
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

// Inicializar monitor
const systemMonitor = new SystemMonitor();

// Simular execução de processo
// const execId = systemMonitor.startExecution('5.2', 'cliente_A', '2h');

// ... processo executa ...

// systemMonitor.completeExecution(execId, 'completed');

// Ver health do sistema
// const health = systemMonitor.getSystemHealth();
// console.log('System Health:', JSON.stringify(health, null, 2));

export default systemMonitor;
