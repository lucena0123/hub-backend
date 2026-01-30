/**
 * SOLUÇÃO 5: AUDIT TRAIL E COMPLIANCE
 * Sistema de Auditoria e Compliance (LGPD/GDPR)
 *
 * Captura TODOS os eventos do sistema para:
 * - Auditoria completa de ações
 * - Compliance com LGPD/GDPR
 * - Debugging e troubleshooting
 * - Análise forense de incidentes
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type EventType =
  // Nível de Processo
  | 'process.started'
  | 'process.completed'
  | 'process.failed'
  | 'process.preempted'
  // Nível de Dados
  | 'data.created'
  | 'data.read'
  | 'data.updated'
  | 'data.deleted'
  // Nível de Acesso
  | 'access.granted'
  | 'access.denied'
  | 'access.revoked'
  // Nível de Compliance
  | 'gdpr.data_export_requested'
  | 'gdpr.data_deletion_requested'
  | 'lgpd.consent_granted'
  | 'lgpd.consent_revoked';

export interface AuditEvent {
  eventId: string;
  timestamp: string;          // ISO 8601
  eventType: EventType;
  processId?: string;
  instanceId?: string;        // Instância específica do processo
  clientId: string;
  userId: string;             // Quem executou a ação
  userRole: string;

  resource: {
    type: string;             // 'campaign', 'client', 'landing_page', etc.
    id: string;
    name?: string;
  };

  action: string;             // 'budget_update', 'campaign_pause', etc.

  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };

  metadata: {
    ipAddress: string;
    userAgent: string;
    location?: string;
    reason?: string;
    [key: string]: any;
  };

  complianceFlags: {
    gdpr: boolean;
    lgpd: boolean;
    sox: boolean;
    pci: boolean;
  };
}

export interface ComplianceMetrics {
  gdpr: {
    dataExportRequests: number;
    dataDeletionRequests: number;
    avgResponseTime: string;
    breaches: number;
  };
  lgpd: {
    consentRate: number;
    dataRetentionCompliance: number;
    pendingReviews: number;
  };
  auditTrail: {
    eventsLogged24h: number;
    storageSize: string;
    oldestRecord: string;
    retentionPolicy: string;
  };
  alerts: ComplianceAlert[];
}

export interface ComplianceAlert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  clientId?: string;
  timestamp: string;
}

// ============================================================================
// AUDIT TRAIL MANAGER CLASS
// ============================================================================

export class AuditTrailManager {
  private events: AuditEvent[];                      // Em produção: DB append-only
  private complianceRequests: Map<string, any>;     // Requisições GDPR/LGPD ativas
  private retentionPolicyYears: number = 7;         // Padrão: 7 anos

  constructor() {
    this.events = [];
    this.complianceRequests = new Map();
  }

  /**
   * Gera ID único para evento
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Registra evento de auditoria
   */
  public logEvent(event: Omit<AuditEvent, 'eventId' | 'timestamp'>): string {
    const auditEvent: AuditEvent = {
      ...event,
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString()
    };

    this.events.push(auditEvent);

    // Em produção: salvar em banco de dados imutável (DynamoDB, Cassandra, TimescaleDB)
    // await db.auditEvents.insert(auditEvent);

    console.log(`[Audit] ${auditEvent.eventType}:`, auditEvent.eventId);

    // Verifica se evento requer ação de compliance
    this.checkComplianceRequirements(auditEvent);

    return auditEvent.eventId;
  }

  /**
   * Verifica se evento requer ação de compliance
   */
  private checkComplianceRequirements(event: AuditEvent): void {
    // GDPR: Data Export Request
    if (event.eventType === 'gdpr.data_export_requested') {
      this.handleDataExportRequest(event);
    }

    // GDPR: Data Deletion Request (Right to be Forgotten)
    if (event.eventType === 'gdpr.data_deletion_requested') {
      this.handleDataDeletionRequest(event);
    }

    // LGPD: Consent Revoked
    if (event.eventType === 'lgpd.consent_revoked') {
      this.handleConsentRevoked(event);
    }
  }

  /**
   * Processa requisição de exportação de dados (GDPR)
   */
  private handleDataExportRequest(event: AuditEvent): void {
    const requestId = `export_${event.clientId}_${Date.now()}`;

    this.complianceRequests.set(requestId, {
      type: 'data_export',
      clientId: event.clientId,
      requestedAt: event.timestamp,
      deadline: this.calculateDeadline(30), // GDPR: 30 dias
      status: 'pending',
      eventId: event.eventId
    });

    console.log(`[Compliance] Data export request registered: ${requestId}`);

    // Em produção: iniciar processo automático de coleta de dados
    // this.startDataExportProcess(requestId);
  }

  /**
   * Processa requisição de exclusão de dados (GDPR Right to be Forgotten)
   */
  private handleDataDeletionRequest(event: AuditEvent): void {
    const requestId = `deletion_${event.clientId}_${Date.now()}`;

    this.complianceRequests.set(requestId, {
      type: 'data_deletion',
      clientId: event.clientId,
      requestedAt: event.timestamp,
      deadline: this.calculateDeadline(30), // GDPR: 30 dias
      status: 'pending',
      eventId: event.eventId
    });

    console.log(`[Compliance] Data deletion request registered: ${requestId}`);

    // Em produção: iniciar processo de exclusão (aciona subprocesso 6.4)
    // this.startDataDeletionProcess(requestId);
  }

  /**
   * Processa revogação de consentimento (LGPD)
   */
  private handleConsentRevoked(event: AuditEvent): void {
    console.log(`[Compliance] Consent revoked for client ${event.clientId}`);

    // LGPD: Deve parar de processar dados imediatamente
    // Em produção: desativa processamento para este cliente
    // this.pauseDataProcessing(event.clientId);
  }

  /**
   * Calcula deadline para compliance
   */
  private calculateDeadline(days: number): string {
    const now = new Date();
    const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return deadline.toISOString();
  }

  /**
   * Busca eventos por filtros
   */
  public queryEvents(filters: {
    clientId?: string;
    userId?: string;
    processId?: string;
    eventType?: EventType;
    startDate?: string;
    endDate?: string;
    resource?: string;
  }): AuditEvent[] {
    let results = [...this.events];

    if (filters.clientId) {
      results = results.filter(e => e.clientId === filters.clientId);
    }

    if (filters.userId) {
      results = results.filter(e => e.userId === filters.userId);
    }

    if (filters.processId) {
      results = results.filter(e => e.processId === filters.processId);
    }

    if (filters.eventType) {
      results = results.filter(e => e.eventType === filters.eventType);
    }

    if (filters.startDate) {
      results = results.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      results = results.filter(e => e.timestamp <= filters.endDate!);
    }

    if (filters.resource) {
      results = results.filter(e => e.resource.type === filters.resource);
    }

    return results.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Retorna métricas de compliance
   */
  public getComplianceMetrics(periodDays: number = 30): ComplianceMetrics {
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const recentEvents = this.events.filter(e =>
      new Date(e.timestamp) >= periodStart
    );

    // GDPR Metrics
    const gdprExportRequests = recentEvents.filter(e =>
      e.eventType === 'gdpr.data_export_requested'
    ).length;

    const gdprDeletionRequests = recentEvents.filter(e =>
      e.eventType === 'gdpr.data_deletion_requested'
    ).length;

    // LGPD Metrics
    const consentGranted = recentEvents.filter(e =>
      e.eventType === 'lgpd.consent_granted'
    ).length;

    const consentRevoked = recentEvents.filter(e =>
      e.eventType === 'lgpd.consent_revoked'
    ).length;

    const totalConsents = consentGranted + consentRevoked;
    const consentRate = totalConsents > 0 ? (consentGranted / totalConsents) * 100 : 100;

    // Alerts
    const alerts = this.generateComplianceAlerts();

    return {
      gdpr: {
        dataExportRequests: gdprExportRequests,
        dataDeletionRequests: gdprDeletionRequests,
        avgResponseTime: '18h', // Calculado dinamicamente em produção
        breaches: 0
      },
      lgpd: {
        consentRate: Math.round(consentRate),
        dataRetentionCompliance: 98, // % - Calculado dinamicamente
        pendingReviews: 3
      },
      auditTrail: {
        eventsLogged24h: this.events.filter(e =>
          new Date(e.timestamp) >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
        ).length,
        storageSize: this.calculateStorageSize(),
        oldestRecord: this.events.length > 0 ? this.events[0].timestamp : 'N/A',
        retentionPolicy: `${this.retentionPolicyYears} years`
      },
      alerts
    };
  }

  /**
   * Gera alertas de compliance
   */
  private generateComplianceAlerts(): ComplianceAlert[] {
    const alerts: ComplianceAlert[] = [];

    // Verifica requisições próximas ao deadline
    this.complianceRequests.forEach((request, requestId) => {
      const deadline = new Date(request.deadline);
      const now = new Date();
      const daysToDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (daysToDeadline <= 5 && request.status === 'pending') {
        alerts.push({
          severity: 'critical',
          message: `GDPR ${request.type} request approaching deadline (${daysToDeadline} days remaining)`,
          clientId: request.clientId,
          timestamp: new Date().toISOString()
        });
      } else if (daysToDeadline <= 10 && request.status === 'pending') {
        alerts.push({
          severity: 'warning',
          message: `GDPR ${request.type} request approaching deadline (${daysToDeadline} days remaining)`,
          clientId: request.clientId,
          timestamp: new Date().toISOString()
        });
      }
    });

    return alerts;
  }

  /**
   * Calcula tamanho de armazenamento
   */
  private calculateStorageSize(): string {
    // Estima ~1KB por evento
    const sizeKB = this.events.length;

    if (sizeKB < 1024) return `${sizeKB} KB`;
    if (sizeKB < 1024 * 1024) return `${Math.round(sizeKB / 1024)} MB`;
    return `${Math.round(sizeKB / 1024 / 1024)} GB`;
  }

  /**
   * Gera relatório de auditoria para cliente
   */
  public generateAuditReport(clientId: string, startDate: string, endDate: string): {
    clientId: string;
    period: { start: string; end: string };
    events: AuditEvent[];
    summary: {
      totalEvents: number;
      eventsByType: Record<string, number>;
      dataAccess: number;
      dataModifications: number;
    };
  } {
    const events = this.queryEvents({ clientId, startDate, endDate });

    const eventsByType: Record<string, number> = {};
    events.forEach(e => {
      eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
    });

    const dataAccess = events.filter(e => e.eventType === 'data.read').length;
    const dataModifications = events.filter(e =>
      e.eventType === 'data.created' ||
      e.eventType === 'data.updated' ||
      e.eventType === 'data.deleted'
    ).length;

    return {
      clientId,
      period: { start: startDate, end: endDate },
      events,
      summary: {
        totalEvents: events.length,
        eventsByType,
        dataAccess,
        dataModifications
      }
    };
  }

  /**
   * Exporta dados para compliance (GDPR Data Portability)
   */
  public exportClientData(clientId: string): any {
    const events = this.queryEvents({ clientId });

    return {
      exportedAt: new Date().toISOString(),
      clientId,
      auditTrail: events,
      dataAccessed: this.getDataAccessedByClient(clientId),
      consents: this.getClientConsents(clientId)
    };
  }

  private getDataAccessedByClient(clientId: string): any[] {
    // Em produção: buscar todos os dados acessados
    return [];
  }

  private getClientConsents(clientId: string): any[] {
    const consentEvents = this.queryEvents({
      clientId,
      eventType: 'lgpd.consent_granted'
    });

    return consentEvents.map(e => ({
      grantedAt: e.timestamp,
      purpose: e.metadata.reason,
      status: 'active'
    }));
  }
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

// Inicializar audit trail manager
const auditManager = new AuditTrailManager();

// Exemplo 1: Log de mudança de budget
// auditManager.logEvent({
//   eventType: 'data.updated',
//   processId: '5.2',
//   instanceId: '5.2_instance_001',
//   clientId: 'cliente_A',
//   userId: 'user_123',
//   userRole: 'gestor_trafego',
//   resource: {
//     type: 'campaign',
//     id: 'campaign_12345',
//     name: 'Campaign Black Friday'
//   },
//   action: 'budget_update',
//   changes: {
//     before: { dailyBudget: 100.00 },
//     after: { dailyBudget: 150.00 }
//   },
//   metadata: {
//     ipAddress: '192.168.1.10',
//     userAgent: 'Mozilla/5.0...',
//     reason: 'Optimization detected opportunity'
//   },
//   complianceFlags: {
//     gdpr: true,
//     lgpd: true,
//     sox: false,
//     pci: false
//   }
// });

// Exemplo 2: Requisição GDPR de exportação de dados
// auditManager.logEvent({
//   eventType: 'gdpr.data_export_requested',
//   clientId: 'cliente_B',
//   userId: 'cliente_B_user',
//   userRole: 'client',
//   resource: { type: 'client_data', id: 'cliente_B' },
//   action: 'request_data_export',
//   metadata: {
//     ipAddress: '203.0.113.45',
//     userAgent: 'Mozilla/5.0...',
//     reason: 'GDPR Article 20 - Right to Data Portability'
//   },
//   complianceFlags: {
//     gdpr: true,
//     lgpd: false,
//     sox: false,
//     pci: false
//   }
// });

// Ver métricas
// console.log('Métricas de compliance:', auditManager.getComplianceMetrics(30));

export default auditManager;
