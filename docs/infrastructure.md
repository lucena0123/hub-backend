# Infraestrutura Tecnica - Orquestracao e Governanca

Camada de orquestracao do sistema BPMN com 6 componentes: filas, capacidade, locks, auditoria, monitoramento e versionamento.

## Arquitetura em Camadas

```
APPLICATION LAYER (BPMN Processes)
        |
ORCHESTRATION LAYER
  +-- Queue Manager       <- Gerencia filas
  +-- Capacity Manager    <- Aloca recursos
  +-- Lock Manager         <- Previne conflitos
        |
OBSERVABILITY LAYER
  +-- Audit Trail          <- Registra tudo
  +-- System Monitor       <- Monitora health
  +-- Version Manager      <- Gerencia versoes
        |
EVENT BUS (RabbitMQ/Kafka/EventBridge)
  +-- Nivel 5 (Loop) | Nivel 6 (Paralelo) | Nivel 7 (Paralelo)
```

---

## 1. Queue Manager (Gerenciador de Filas)

Organiza demandas de multiplos clientes com priorizacao automatica.

### Algoritmo de Priorizacao

```
Prioridade = (Urgencia SLA x 0.4) + (Valor Cliente x 0.3) + (Criticidade x 0.3)
```

- **Urgencia SLA:** >=90% tempo -> 10 (critico), >=75% -> 8, >=50% -> 6, <50% -> 4
- **Valor Cliente:** Enterprise(Tier1) -> 10, Growth(Tier2) -> 7, Starter(Tier3) -> 5
- **Criticidade:** 6.1(Atendimento) > 5.2(Otimizacao) > 5.3(Testes)

### API

```typescript
class QueueManager {
  enqueue(task: Task): { status, position, priority }
  dequeue(processId: string): Task | null
  calculatePriority(task: Task): number
  getQueuesStatus(): Record<string, any>
}
```

### Metricas
- Taxa de utilizacao de fila
- Tempo medio na fila
- Taxa de SLA breach em fila

---

## 2. Capacity Manager (Gerenciador de Capacidade)

Aloca recursos (pessoas) baseado em disponibilidade, skills e balanceamento de carga.

### Estrutura de Times

| Time | Processos |
|------|-----------|
| Trafego | 5.1, 5.2, 5.3, 4.2 |
| CS | 6.1, 6.2, 6.3, 6.4, 7.2, 7.3 |
| Financeiro | 7.1, 7.2, 1.3 |
| Vendas | 1.1, 1.2, 1.3 |
| Estrategia | 0.1, 2.2, 2.3, 3.x |
| Creative | 4.1, 4.3 |

### Thresholds
- **Warning:** 70% capacidade
- **Critical:** 85% capacidade (bloqueia novos clientes)

### API

```typescript
class CapacityManager {
  addTeamMember(teamId: string, member: TeamMember): void
  allocateTask(request: AllocationRequest): AllocationResult
  releaseTask(taskId: string, userId: string): void
  getCapacityStatus(): Record<string, any>
  isSystemOverloaded(): { overloaded: boolean; reason?: string }
}
```

### Regras de Alocacao
1. Verificar capacidade disponivel
2. Priorizar por skill match
3. Balancear carga entre membros
4. Escalar alerta quando >70%
5. Bloquear novos clientes quando >85%

### Metricas
- Utilizacao media por time
- Balanceamento de carga (desvio padrao)
- Taxa de bloqueio

---

## 3. Lock Manager (Sistema de Locks e Conflitos)

Locks distribuidos para recursos compartilhados com preempcao por prioridade.

### Hierarquia de Prioridades

```
ALTA (Pode interromper tudo)
  10. Offboarding (6.4)
   9. Atendimento Critico (6.1)
   8. Disaster Recovery

MEDIA (Pode aguardar)
   7. Otimizacao de Lances (5.2)
   6. Apresentacao Resultados (6.2)
   5. Alinhamento Estrategico (6.3)

BAIXA (Sempre aguarda)
   4. Testes A/B (5.3)
   3. Monitoramento (5.1)
```

### Fluxo de Resolucao de Conflitos

1. Verificar se recurso esta locked
2. Se livre: criar lock
3. Se locked e nova prioridade > existente: preemptar (notifica holder para rollback)
4. Se locked e nova prioridade <= existente: entrar na fila de espera

### Exemplo de Conflito

```
10:00 - Processo 5.2 adquire lock em campaign_12345 (prioridade 7)
10:15 - Cliente reporta bug via 6.1 (prioridade 9)
10:15 - Lock Manager detecta conflito, notifica 5.2 para rollback
10:16 - Processo 5.2 reverte mudancas e libera lock
10:16 - Processo 6.1 adquire lock e pausa campanha
10:25 - Bug resolvido, 6.1 libera lock
10:25 - Processo 5.2 retoma da fila
```

### API

```typescript
class LockManager {
  acquireLock(request: LockRequest): Promise<LockResponse>
  releaseLock(lockId: string, holderId: string): boolean
  getLockStatus(resourceType: string, resourceId: string): Lock | null
  getActiveLocks(): Lock[]
  getStatistics(): Record<string, any>
}
```

### Metricas
- Taxa de preempcao
- Tempo medio de lock
- Taxa de expiracao (timeout)

---

## 4. Audit Trail (Auditoria e Compliance LGPD/GDPR)

Registro imutavel (append-only) de todos os eventos do sistema.

### Tipos de Eventos

| Nivel | Eventos |
|-------|---------|
| Processo | `process.started`, `process.completed`, `process.failed`, `process.preempted` |
| Dados | `data.created`, `data.read`, `data.updated`, `data.deleted` |
| Acesso | `access.granted`, `access.denied`, `access.revoked` |
| Compliance | `gdpr.data_export_requested`, `gdpr.data_deletion_requested`, `lgpd.consent_granted`, `lgpd.consent_revoked` |

### Estrutura de Evento

```typescript
{
  eventId: "evt_001_5d3a2b1c",
  timestamp: "2026-01-30T10:00:00Z",
  eventType: "data.updated",
  processId: "5.2",
  clientId: "cliente_A",
  userId: "user_123",
  resource: { type: "campaign", id: "campaign_12345" },
  action: "budget_update",
  changes: {
    before: { dailyBudget: 100.00 },
    after: { dailyBudget: 150.00 }
  },
  metadata: { ipAddress, userAgent, reason },
  complianceFlags: { gdpr: true, lgpd: true }
}
```

### Compliance
- **Data Export Request:** SLA 30 dias
- **Data Deletion (Right to be Forgotten):** Conforme LGPD
- **Consent Management:** Registro de consentimentos
- **Retencao:** 7 anos

### API

```typescript
class AuditTrailManager {
  logEvent(event: AuditEvent): string
  queryEvents(filters: QueryFilters): AuditEvent[]
  getComplianceMetrics(periodDays: number): ComplianceMetrics
  generateAuditReport(clientId: string, startDate: string, endDate: string)
  exportClientData(clientId: string): any
}
```

### Metricas
- Taxa de compliance (requisicoes GDPR/LGPD no prazo)
- Eventos por segundo
- Tempo de retencao

---

## 5. System Monitor (Monitoramento e Health)

Health score por processo com SLA compliance e alertas automaticos.

### Health Score

```
Health = (Success Rate x 60%) + (SLA Compliance x 40%)

Status: Healthy >= 80 | Degraded 60-79 | Critical < 60
```

### Dashboard

```typescript
{
  overall: 92,
  processes: {
    "5.1": { health: 95, avgDuration: "12min", successRate: 98.5 },
    "5.2": { health: 88, avgDuration: "45min", successRate: 94.2 },
    "6.1": { health: 93, avgDuration: "2.5h",  successRate: 96.8 },
  },
  slaCompliance: { total: 95.2, breaches24h: 3, worstProcess: "5.2" },
  capacity: { current: 72, trend: "increasing", projectedFull: "7 days" }
}
```

### Alertas

| Nivel | Canal | Exemplos |
|-------|-------|----------|
| CRITICAL | Pager/SMS | SLA break <10% restante, capacidade >90%, erro critico |
| WARNING | Email/Slack | Performance >2x media, capacidade >75%, erro >5% |
| INFO | Dashboard | Processo concluido, otimizacao aplicada, novo cliente |

### API

```typescript
class SystemMonitor {
  startExecution(processId: string, clientId: string, sla: string): string
  completeExecution(executionId: string, status: 'completed' | 'failed', error?: string)
  getSystemHealth(): SystemHealth
  acknowledgeAlert(alertId: string, userId: string): void
}
```

### Metricas
- Overall Health Score (0-100)
- SLA Compliance Rate
- MTTR (Mean Time To Recovery)

---

## 6. Version Manager (Versionamento e Canary Deploy)

Semantic versioning com deploy incremental e rollback automatico.

### Estrategia de Versao

```
Major.Minor.Patch
- Major: Mudancas incompativeis (requer migracao manual)
- Minor: Novas features (compativel, deprecated automatico)
- Patch: Bug fixes (compativel, migracao automatica)
```

### Canary Deployment

```
Dia 1:  5% clientes  -> nova versao (monitora 48h)
Dia 3:  20% clientes -> nova versao (monitora 48h)
Dia 5:  50% clientes -> nova versao (monitora 48h)
Dia 7:  100% clientes -> nova versao
```

Se houver problema: rollback imediato para versao anterior.

### API

```typescript
class ProcessVersionManager {
  registerVersion(version: ProcessVersion): void
  startCanaryDeployment(processId: string, toVersion: string, canaryPlan?: number[]): string
  rollbackDeployment(deploymentId: string): void
  registerClient(clientId: string, clientName: string, processId: string, version: string)
  getVersionStatistics(): Record<string, any>
}
```

### Metricas
- Taxa de sucesso de canary (% sem rollback)
- Tempo medio de migracao
- Taxa de adocao (% clientes na versao mais recente)

---

## Fluxo de Execucao Completo

Exemplo: Otimizacao de Campanha (Processo 5.2)

```
1. QUEUE MANAGER     -> Calcula prioridade 8.5, adiciona a fila 5.2
2. CAPACITY MANAGER  -> Busca membro com skill 5.2, aloca (carga 60%)
3. LOCK MANAGER      -> Adquire lock em campaign_12345 (prioridade 7, TTL 30min)
4. AUDIT TRAIL       -> Registra process.started + data.read
5. SYSTEM MONITOR    -> Inicia tracking, monitora duracao vs SLA
6. VERSION MANAGER   -> Executa versao 2.0.0 do processo 5.2
7. EXECUCAO          -> IA analisa, sugere aumento budget R$100->R$150
8. AUDIT TRAIL       -> Registra data.updated (budget)
9. LOCK MANAGER      -> Libera lock
10. CAPACITY MANAGER -> Libera task (carga 60%->47.5%)
11. SYSTEM MONITOR   -> Completa execucao, duracao 35min (SLA 2h OK)
12. QUEUE MANAGER    -> Processa proxima task da fila
```

---

## Persistencia Recomendada

| Componente | Storage |
|-----------|---------|
| Queue Manager | Redis (filas) |
| Lock Manager | Redis (locks distribuidos) |
| Audit Trail | DynamoDB/Cassandra (append-only) |
| System Monitor | TimescaleDB (time-series) |
| Version Manager | PostgreSQL (relacional) |

## Monitoramento

- **Dashboards:** Grafana + Prometheus
- **Alertas:** PagerDuty, Slack, Email
- **Logs:** ELK Stack (Elasticsearch, Logstash, Kibana)

## Variaveis de Ambiente

```bash
QUEUE_DEFAULT_CONCURRENCY=3
QUEUE_MAX_SIZE=1000
LOCK_DEFAULT_TTL=1800000        # 30 min
LOCK_EXPIRATION_CHECK_INTERVAL=60000
AUDIT_RETENTION_YEARS=7
MONITOR_HEALTH_CHECK_INTERVAL=300000
CANARY_DEFAULT_STAGES=[5,20,50,100]
CANARY_STAGE_DURATION=172800000  # 48h
```

## Ordem de Implementacao

| Fase | Periodo | Componentes |
|------|---------|-------------|
| 1 - Critico | 0-3 meses | Offboarding (6.4), Locks, Filas |
| 2 - Alto Impacto | 3-6 meses | Nivel 7 (Financeiro), Audit Trail, Capacidade |
| 3 - Melhoria | 6-12 meses | Monitoramento, Versionamento, Event Bus, Dashboard Compliance |

## Metricas de Sucesso

- Zero cancelamentos por falta de offboarding
- <2% SLA breaks
- 95%+ taxa de renovacao
- 100% compliance em auditorias
- <5min tempo medio de alocacao
