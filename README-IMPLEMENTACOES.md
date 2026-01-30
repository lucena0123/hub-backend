# Implementações Técnicas - Soluções de Infraestrutura

## Visão Geral

Este documento descreve as implementações técnicas das **Soluções 3-7** do sistema de fluxos BPMN, focadas em infraestrutura, orquestração e governança.

---

## 📦 Arquivos Implementados

### 1. [orchestrator-queue-manager.ts](orchestrator-queue-manager.ts)
**Solução 3.1: Gerenciador de Filas e Priorização**

#### Funcionalidades:
- ✅ Organização de demandas de múltiplos clientes
- ✅ Algoritmo de priorização baseado em:
  - **Urgência do SLA** (40%) - Quanto mais próximo do deadline, maior a prioridade
  - **Valor do Cliente** (30%) - Tiers Enterprise/Growth/Starter
  - **Criticidade do Processo** (30%) - 6.1 > 5.2 > 5.3
- ✅ Filas separadas por processo
- ✅ Concorrência controlada por processo
- ✅ Reordenação automática por prioridade

#### Classes e Métodos Principais:
```typescript
class QueueManager {
  // Adiciona task à fila com cálculo automático de prioridade
  enqueue(task: Task): { status, position, priority }

  // Remove próxima task de maior prioridade
  dequeue(processId: string): Task | null

  // Calcula prioridade (SLA × 0.4 + Cliente × 0.3 + Criticidade × 0.3)
  calculatePriority(task: Task): number

  // Retorna status de todas as filas
  getQueuesStatus(): Record<string, any>
}
```

#### Exemplo de Uso:
```typescript
const queueManager = new QueueManager();

queueManager.setClientTier('cliente_A', 1); // Enterprise

const task = {
  taskId: 't_001',
  clientId: 'cliente_A',
  processId: '5.2',
  sla: '2h',
  status: 'pending',
  createdAt: new Date().toISOString()
};

const result = queueManager.enqueue(task);
// { status: 'queued', position: 1, priority: 8.5 }
```

---

### 2. [orchestrator-capacity-manager.ts](orchestrator-capacity-manager.ts)
**Solução 3.2: Gerenciador de Capacidade de Time**

#### Funcionalidades:
- ✅ Alocação de recursos (pessoas) baseado em:
  - Disponibilidade do membro
  - Skills necessárias para o processo
  - Balanceamento de carga entre membros
- ✅ Alertas de sobrecarga (Warning: 70%, Critical: 85%)
- ✅ Detecção de capacidade total do sistema
- ✅ Estimativa de tempo de espera

#### Classes e Métodos Principais:
```typescript
class CapacityManager {
  // Adiciona membro ao time
  addTeamMember(teamId: string, member: TeamMember): void

  // Aloca task para melhor membro disponível
  allocateTask(request: AllocationRequest): AllocationResult

  // Libera task concluída
  releaseTask(taskId: string, userId: string): void

  // Retorna status de capacidade de todos os times
  getCapacityStatus(): Record<string, any>

  // Verifica se sistema está sobrecarregado
  isSystemOverloaded(): { overloaded: boolean; reason?: string }
}
```

#### Estrutura de Times:
- **Tráfego**: Processos 5.1, 5.2, 5.3, 4.2
- **CS**: Processos 6.1, 6.2, 6.3, 6.4, 7.2, 7.3
- **Financeiro**: Processos 7.1, 7.2, 1.3
- **Vendas**: Processos 1.1, 1.2, 1.3
- **Estratégia**: Processos 0.1, 2.2, 2.3, 3.x
- **Creative**: Processos 4.1, 4.3

---

### 3. [lock-manager.ts](lock-manager.ts)
**Solução 4: Sistema de Locks e Resolução de Conflitos**

#### Funcionalidades:
- ✅ Locks distribuídos para recursos compartilhados
- ✅ Sistema de prioridades com preempção
- ✅ Fila de espera ordenada por prioridade
- ✅ Expiração automática de locks (TTL)
- ✅ Notificações para holders preemptados
- ✅ Event emitter para monitoramento

#### Hierarquia de Prioridades:
```
ALTA (Pode interromper tudo)
  10. Offboarding (6.4) - Cliente cancelou
   9. Atendimento Crítico (6.1) - Bug reportado
   8. Disaster Recovery

MÉDIA (Pode aguardar)
   7. Otimização de Lances (5.2)
   6. Apresentação de Resultados (6.2)
   5. Alinhamento Estratégico (6.3)

BAIXA (Sempre aguarda)
   4. Testes A/B (5.3)
   3. Monitoramento (5.1)
```

#### Classes e Métodos Principais:
```typescript
class LockManager {
  // Tenta adquirir lock (com preempção se necessário)
  acquireLock(request: LockRequest): Promise<LockResponse>

  // Libera lock
  releaseLock(lockId: string, holderId: string): boolean

  // Verifica status de um recurso
  getLockStatus(resourceType: string, resourceId: string): Lock | null

  // Lista todos os locks ativos
  getActiveLocks(): Lock[]

  // Estatísticas de locks
  getStatistics(): Record<string, any>
}
```

#### Exemplo de Conflito:
```
10:00 - Processo 5.2 (Otimização) adquire lock em campaign_12345 (prioridade 7)
10:15 - Cliente reporta bug via 6.1 (prioridade 9)
10:15 - Lock Manager detecta conflito
10:15 - Notifica 5.2 para fazer rollback
10:16 - Processo 5.2 reverte mudanças e libera lock
10:16 - Processo 6.1 adquire lock
```

---

### 4. [audit-trail-manager.ts](audit-trail-manager.ts)
**Solução 5: Audit Trail e Compliance (LGPD/GDPR)**

#### Funcionalidades:
- ✅ Captura de TODOS os eventos do sistema
- ✅ Registro imutável (append-only)
- ✅ Compliance com LGPD/GDPR:
  - Data Export Request (30 dias)
  - Data Deletion Request (Right to be Forgotten)
  - Consent Management
- ✅ Busca avançada de eventos
- ✅ Relatórios de auditoria por cliente
- ✅ Alertas de deadline próximo

#### Tipos de Eventos:
```typescript
// Nível de Processo
'process.started' | 'process.completed' | 'process.failed' | 'process.preempted'

// Nível de Dados
'data.created' | 'data.read' | 'data.updated' | 'data.deleted'

// Nível de Acesso
'access.granted' | 'access.denied' | 'access.revoked'

// Nível de Compliance
'gdpr.data_export_requested' | 'gdpr.data_deletion_requested'
'lgpd.consent_granted' | 'lgpd.consent_revoked'
```

#### Classes e Métodos Principais:
```typescript
class AuditTrailManager {
  // Registra evento de auditoria
  logEvent(event: AuditEvent): string

  // Busca eventos por filtros
  queryEvents(filters: QueryFilters): AuditEvent[]

  // Retorna métricas de compliance
  getComplianceMetrics(periodDays: number): ComplianceMetrics

  // Gera relatório de auditoria para cliente
  generateAuditReport(clientId: string, startDate: string, endDate: string)

  // Exporta dados para compliance (GDPR)
  exportClientData(clientId: string): any
}
```

#### Estrutura de Evento:
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

---

### 5. [system-monitor.ts](system-monitor.ts)
**Solução 6: Monitoramento e Dashboard de Saúde**

#### Funcionalidades:
- ✅ Health score por processo (0-100)
- ✅ SLA compliance tracking
- ✅ Detecção de erros e anomalias
- ✅ Alertas automáticos por severidade:
  - **CRITICAL**: Pager/SMS (SLA break iminente, capacidade >90%)
  - **WARNING**: Email/Slack (Performance degradada, capacidade >75%)
  - **INFO**: Dashboard (Processos concluídos)
- ✅ Análise de tendências
- ✅ Top errors com agregação

#### Classes e Métodos Principais:
```typescript
class SystemMonitor {
  // Registra início de execução
  startExecution(processId: string, clientId: string, sla: string): string

  // Registra conclusão (com detecção de SLA breach)
  completeExecution(executionId: string, status: 'completed' | 'failed', error?: string)

  // Retorna health completo do sistema
  getSystemHealth(): SystemHealth

  // Reconhece alerta
  acknowledgeAlert(alertId: string, userId: string): void
}
```

#### Health Score Calculation:
```
Health = (Success Rate × 60%) + (SLA Compliance × 40%)

Status:
- Healthy: >= 80
- Degraded: 60-79
- Critical: < 60
```

#### Dashboard Metrics:
```typescript
{
  overall: 92,  // Health geral do sistema
  processes: {
    "5.1": { health: 95, avgDuration: "12min", successRate: 98.5 },
    "5.2": { health: 88, avgDuration: "45min", successRate: 94.2 },
    ...
  },
  slaCompliance: {
    total: 95.2,
    breaches24h: 3,
    worstProcess: "5.2"
  },
  capacity: {
    current: 72,
    trend: "increasing",
    projectedFull: "7 days"
  }
}
```

---

### 6. [process-version-manager.ts](process-version-manager.ts)
**Solução 7: Versionamento e Deploy Canary**

#### Funcionalidades:
- ✅ Semantic versioning (Major.Minor.Patch)
- ✅ Deploy incremental (Canary): 5% → 20% → 50% → 100%
- ✅ Health check entre fases
- ✅ Rollback automático em caso de falha
- ✅ Migração gradual de clientes
- ✅ Tracking de versão por cliente

#### Classes e Métodos Principais:
```typescript
class ProcessVersionManager {
  // Registra nova versão de processo
  registerVersion(version: ProcessVersion): void

  // Inicia deploy canary
  startCanaryDeployment(processId: string, toVersion: string, canaryPlan?: number[]): string

  // Rollback de deployment
  rollbackDeployment(deploymentId: string): void

  // Registra cliente
  registerClient(clientId: string, clientName: string, processId: string, version: string)

  // Estatísticas de versionamento
  getVersionStatistics(): Record<string, any>
}
```

#### Estratégia de Deploy Canary:
```
Dia 1:  5% clientes  → v2.0.0 (monitora 48h)
        ↓ Health Check
Dia 3:  20% clientes → v2.0.0 (monitora 48h)
        ↓ Health Check
Dia 5:  50% clientes → v2.0.0 (monitora 48h)
        ↓ Health Check
Dia 7:  100% clientes → v2.0.0
```

Se houver problema, **rollback imediato** para versão anterior.

#### Breaking vs Non-Breaking:
- **Breaking Change** (Major): v1.0.0 → v2.0.0
  - Incompatível com versão anterior
  - Requer migração manual
  - Versão antiga não é deprecated automaticamente

- **Non-Breaking Change** (Minor/Patch): v1.0.0 → v1.1.0
  - Compatível com versão anterior
  - Versão antiga marcada como deprecated
  - Migração automática via canary

---

## 🔗 Integração entre Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│                   (BPMN Processes)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │    ORCHESTRATION LAYER    │
         │                           │
         │  ┌──────────────────────┐ │
         │  │  Queue Manager       │ │ ◄── Gerencia filas
         │  └──────────────────────┘ │
         │  ┌──────────────────────┐ │
         │  │  Capacity Manager    │ │ ◄── Aloca recursos
         │  └──────────────────────┘ │
         │  ┌──────────────────────┐ │
         │  │  Lock Manager        │ │ ◄── Previne conflitos
         │  └──────────────────────┘ │
         └─────────────┬─────────────┘
                       │
         ┌─────────────┴─────────────┐
         │   OBSERVABILITY LAYER     │
         │                           │
         │  ┌──────────────────────┐ │
         │  │  Audit Trail         │ │ ◄── Registra tudo
         │  └──────────────────────┘ │
         │  ┌──────────────────────┐ │
         │  │  System Monitor      │ │ ◄── Monitora health
         │  └──────────────────────┘ │
         │  ┌──────────────────────┐ │
         │  │  Version Manager     │ │ ◄── Gerencia versões
         │  └──────────────────────┘ │
         └───────────────────────────┘
```

---

## 📊 Fluxo de Execução Completo

### Exemplo: Otimização de Campanha (Processo 5.2)

```
1. QUEUE MANAGER
   ↓ Cliente A solicita otimização
   ↓ Calcula prioridade: 8.5 (Enterprise + SLA 2h + Processo crítico)
   ↓ Adiciona à fila do processo 5.2

2. CAPACITY MANAGER
   ↓ Busca membro do team_trafego com skill 5.2
   ↓ Encontra João Silva (carga: 60%)
   ↓ Aloca task para João

3. LOCK MANAGER
   ↓ Tenta adquirir lock em campaign_12345
   ↓ Lock disponível, adquire (prioridade 7, TTL 30min)

4. AUDIT TRAIL
   ↓ Registra evento: process.started
   ↓ Registra evento: data.read (campanha)

5. SYSTEM MONITOR
   ↓ Inicia tracking de execução (startExecution)
   ↓ Monitora duração vs SLA

6. VERSÃO DO PROCESSO
   ↓ Executa versão 2.0.0 do processo 5.2
   ↓ (Cliente A já foi migrado via canary)

7. EXECUÇÃO DO PROCESSO
   ↓ IA analisa campanha
   ↓ Sugere aumento de budget de R$100 → R$150

8. AUDIT TRAIL
   ↓ Registra evento: data.updated (budget)
   ↓ Changes: {before: {budget: 100}, after: {budget: 150}}

9. LOCK MANAGER
   ↓ Libera lock de campaign_12345

10. CAPACITY MANAGER
    ↓ Libera task de João (carga: 60% → 47.5%)

11. SYSTEM MONITOR
    ↓ Completa execução (completeExecution)
    ↓ Duração: 35min (SLA: 2h) ✅ OK
    ↓ Atualiza health score do processo 5.2

12. QUEUE MANAGER
    ↓ Processa próxima task da fila (se houver)
```

---

## 🚨 Cenários de Preempção e Conflito

### Cenário 1: Bug Crítico Durante Otimização

```
10:00 - Processo 5.2 otimizando campaign_12345 (prioridade 7)
10:15 - Cliente reporta bug crítico (6.1 - prioridade 9)
        ↓
10:15 - Lock Manager detecta conflito
        ↓ Prioridade 9 > 7
        ↓
10:15 - Notifica processo 5.2: "Você foi preemptado, faça rollback"
        ↓
10:16 - Processo 5.2 reverte mudanças (budget: 150 → 100)
        ↓
10:16 - Lock Manager libera lock
        ↓
10:16 - Processo 6.1 adquire lock
        ↓
10:16 - CS pausa campanha para investigação
        ↓
10:25 - Bug resolvido, 6.1 libera lock
        ↓
10:25 - Processo 5.2 retoma da fila
```

### Cenário 2: Sistema Sobrecarregado

```
Status:
- team_trafego: 85% capacidade (WARNING)
- team_cs: 92% capacidade (CRITICAL)

Nova task de processo 6.2 (Apresentação) chega
        ↓
Capacity Manager: "Nenhum membro disponível no team_cs"
        ↓
Task entra na fila de espera
        ↓
Estimativa de espera: 120 minutos
        ↓
System Monitor gera alerta: "team_cs at critical capacity"
        ↓
Alerta enviado para gestor: "Considere adicionar mais recursos"
```

---

## 📈 Métricas e KPIs

### Queue Manager
- **Taxa de utilização de fila**: % de tempo que filas têm tasks aguardando
- **Tempo médio na fila**: Quanto tempo tasks aguardam antes de serem processadas
- **Taxa de SLA breach em fila**: % de tasks que já chegam com SLA comprometido

### Capacity Manager
- **Utilização média por time**: % de capacidade utilizada
- **Balanceamento de carga**: Desvio padrão de carga entre membros
- **Taxa de bloqueio**: % de tasks que não conseguem alocação imediata

### Lock Manager
- **Taxa de preempção**: % de locks que são preemptados
- **Tempo médio de lock**: Duração média de um lock
- **Taxa de expiração**: % de locks que expiram (timeout)

### Audit Trail
- **Taxa de compliance**: % de requisições GDPR/LGPD atendidas no prazo
- **Eventos por segundo**: Throughput do sistema de auditoria
- **Tempo de retenção**: Idade do evento mais antigo

### System Monitor
- **Overall Health Score**: 0-100 (agregado de todos os processos)
- **SLA Compliance Rate**: % de execuções que respeitam SLA
- **MTTR** (Mean Time To Recovery): Tempo médio para resolver incidentes

### Version Manager
- **Taxa de sucesso de canary**: % de deploys canary concluídos sem rollback
- **Tempo médio de migração**: Duração de deploy completo
- **Taxa de adoção**: % de clientes em versão mais recente

---

## 🔧 Configuração e Deployment

### Pré-requisitos:
```json
{
  "node": ">=18.0.0",
  "typescript": ">=5.0.0"
}
```

### Instalação:
```bash
npm install
npm run build
```

### Variáveis de Ambiente:
```bash
# Queue Manager
QUEUE_DEFAULT_CONCURRENCY=3
QUEUE_MAX_SIZE=1000

# Lock Manager
LOCK_DEFAULT_TTL=1800000  # 30 min em ms
LOCK_EXPIRATION_CHECK_INTERVAL=60000  # 1 min

# Audit Trail
AUDIT_RETENTION_YEARS=7
AUDIT_DB_CONNECTION=mongodb://...

# System Monitor
MONITOR_HEALTH_CHECK_INTERVAL=300000  # 5 min
MONITOR_ALERT_WEBHOOK=https://...

# Version Manager
CANARY_DEFAULT_STAGES=[5,20,50,100]
CANARY_STAGE_DURATION=172800000  # 48h em ms
```

---

## 🧪 Testes

Cada módulo inclui exemplos de uso comentados no final do arquivo. Para execução em produção, descomentar e adaptar conforme necessário.

### Exemplo de Teste de Integração:
```typescript
// Simula fluxo completo
const queueManager = new QueueManager();
const capacityManager = new CapacityManager();
const lockManager = new LockManager();
const auditManager = new AuditTrailManager();
const systemMonitor = new SystemMonitor();

// 1. Enfileira task
const task = { taskId: 't_001', processId: '5.2', clientId: 'cliente_A', sla: '2h', ... };
queueManager.enqueue(task);

// 2. Aloca recurso
const allocation = capacityManager.allocateTask({ taskId: 't_001', processId: '5.2', ... });

// 3. Adquire lock
const lock = await lockManager.acquireLock({ resourceId: 'campaign_123', priority: 7, ... });

// 4. Registra início
const execId = systemMonitor.startExecution('5.2', 'cliente_A', '2h');
auditManager.logEvent({ eventType: 'process.started', ... });

// 5. Executa processo
// ... lógica do processo ...

// 6. Completa
systemMonitor.completeExecution(execId, 'completed');
auditManager.logEvent({ eventType: 'process.completed', ... });
lockManager.releaseLock(lock.lockId!, allocation.assignedTo!);
capacityManager.releaseTask('t_001', allocation.assignedTo!);
```

---

## 📚 Próximos Passos

### Integração com Processos BPMN:
1. Modificar `subprocesso-X.Y-v5-data.js` para chamar os gerenciadores
2. Adicionar interceptors nos pontos de entrada dos processos
3. Integrar com Event Bus (RabbitMQ/Kafka) para comunicação assíncrona

### Persistência:
- Queue Manager → Redis (filas)
- Lock Manager → Redis (locks distribuídos)
- Audit Trail → DynamoDB/Cassandra (append-only)
- System Monitor → TimescaleDB (time-series)
- Version Manager → PostgreSQL (relacional)

### Monitoramento:
- Dashboards: Grafana + Prometheus
- Alertas: PagerDuty, Slack, Email
- Logs: ELK Stack (Elasticsearch, Logstash, Kibana)

---

## 📞 Suporte

Para dúvidas ou issues sobre as implementações, consulte:
- [SOLUCOES-GAPS-CRITICOS.md](SOLUCOES-GAPS-CRITICOS.md) - Design original
- [ARQUITETURA-SISTEMA.md](ARQUITETURA-SISTEMA.md) - Arquitetura completa
- [MAPA-CONEXOES.md](MAPA-CONEXOES.md) - Mapa de dependências

---

**Versão:** 1.0.0
**Data:** 2026-01-30
**Status:** ✅ Todas as soluções implementadas
