# Soluções para Gaps Críticos - Design Técnico

## Visão Geral

Este documento detalha as soluções arquiteturais para os gaps críticos identificados no sistema de fluxos BPMN, incluindo novos subprocessos, camadas de orquestração e integrações necessárias.

---

## SOLUÇÃO 1: Offboarding de Cliente (Subprocesso 6.4)

### 6.4 - Offboarding e Encerramento
**Prioridade:** 🔴 CRÍTICA
**Entrada:** Solicitação de Cancelamento ou Não Renovação

### Lanes (6):
1. **Cliente**
2. **CS / Retention**
3. **Operações / Tráfego**
4. **Financeiro / Cobrança**
5. **Compliance / Legal**
6. **IA / Automação**

### Fases (5):
1. **Detecção & Tentativa de Retenção**
2. **Aprovação & Planejamento**
3. **Desativação Controlada**
4. **Backup & Handoff de Dados**
5. **Encerramento & Aprendizado**

### Fluxo Detalhado:

```
┌─────────────────────────────────────────────────────────┐
│ FASE 1: DETECÇÃO & TENTATIVA DE RETENÇÃO               │
├─────────────────────────────────────────────────────────┤
│ 1. Cliente Solicita Cancelamento                       │
│ 2. IA Detecta Risco de Churn (Proativo)                │
│ 3. CS Registra Motivo do Cancelamento                  │
│ 4. IA Analisa Histórico e Sentimento                   │
│ 5. CS Qualifica Motivo (Preço, Resultado, Atendimento) │
│ 6. CS Propõe Contra-Oferta (se aplicável)              │
│ 7. GATEWAY: Cliente Aceita Retenção?                   │
│    - SIM → Registra Retenção → Fim (sucesso)           │
│    - NÃO → Prossegue para Fase 2                       │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ FASE 2: APROVAÇÃO & PLANEJAMENTO                       │
├─────────────────────────────────────────────────────────┤
│ 8. Financeiro Valida Pendências                        │
│ 9. GATEWAY: Há Inadimplência?                          │
│    - SIM → Processo de Cobrança Especial               │
│    - NÃO → Prossegue                                   │
│ 10. Compliance Valida Obrigações Contratuais (LGPD)    │
│ 11. Operações Mapeia Campanhas Ativas                  │
│ 12. IA Gera Plano de Desativação                       │
│ 13. CS Agenda Reunião de Encerramento                  │
│ 14. Cliente Valida Plano de Desativação                │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ FASE 3: DESATIVAÇÃO CONTROLADA                         │
├─────────────────────────────────────────────────────────┤
│ 15. Operações Pausa Testes A/B (5.3)                   │
│ 16. Operações Pausa Otimizações (5.2)                  │
│ 17. Operações Reduz Budget Gradualmente                │
│ 18. IA Monitora Impacto da Redução                     │
│ 19. Operações Desativa Campanhas (4.2)                 │
│ 20. Operações Desativa Landing Pages (4.3)             │
│ 21. Operações Registra Métricas Finais                 │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ FASE 4: BACKUP & HANDOFF DE DADOS                      │
├─────────────────────────────────────────────────────────┤
│ 22. BI Exporta Todos os Relatórios                     │
│ 23. BI Gera Backup Completo de Dados                   │
│ 24. Compliance Valida LGPD (Direito ao Esquecimento)   │
│ 25. GATEWAY: Cliente Quer Dados?                       │
│    - SIM → Gera Pacote de Dados → Envia Cliente        │
│    - NÃO → Prossegue                                   │
│ 26. Operações Remove Acessos do Cliente                │
│ 27. Operações Desconecta Integrações                   │
│ 28. IA Remove Dados Sensíveis (conforme LGPD)          │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ FASE 5: ENCERRAMENTO & APRENDIZADO                     │
├─────────────────────────────────────────────────────────┤
│ 29. Financeiro Emite Nota de Encerramento              │
│ 30. Financeiro Processa Reembolso (se aplicável)       │
│ 31. CS Conduz Reunião de Exit Interview                │
│ 32. Cliente Responde Pesquisa de Saída                 │
│ 33. IA Analisa Motivos de Churn                        │
│ 34. CS Consolida Aprendizados                          │
│ 35. CS Atualiza Playbook de Retenção                   │
│ 36. CS Registra Cliente em "Win-Back List"             │
│ 37. Financeiro Arquiva Documentação                    │
│ 38. FIM: Offboarding Concluído                         │
└─────────────────────────────────────────────────────────┘
```

### Dados Críticos:
- **Input:** Motivo de cancelamento, histórico de CSAT, valor LTV
- **Output:** Relatórios finais, backup de dados, motivos de churn, win-back timing

### SLAs:
- Detecção de risco: **24h**
- Tentativa de retenção: **48h**
- Desativação controlada: **5-7 dias** (redução gradual)
- Backup de dados: **24h**
- Encerramento completo: **14 dias**

### Integrações:
- CRM: Atualizar status para "Churn"
- Plataformas de Mídia: Pausar/Desativar campanhas
- Analytics: Exportar dados históricos
- Financeiro: Processar pendências
- LGPD: Aplicar direito ao esquecimento

---

## SOLUÇÃO 2: Gestão Financeira (Nível 7)

### Estrutura do Nível 7

```
NÍVEL 7: GESTÃO COMERCIAL E FINANCEIRA
├── 7.1 - Faturamento e Cobrança ⟲
├── 7.2 - Renovação de Contratos ⟲
└── 7.3 - Expansão (Upsell/Cross-sell) ⟲
```

### 7.1 - Faturamento e Cobrança
**Entrada:** Ciclo de faturamento (mensal/trimestral)

#### Lanes (5):
- Cliente
- Financeiro / Cobrança
- IA / Previsão
- CS / Relacionamento
- Gestão / Aprovação

#### Fluxo Resumido:
1. IA Prevê Receita do Mês
2. Financeiro Valida Serviços Prestados
3. Financeiro Gera Fatura
4. Cliente Recebe Fatura
5. IA Monitora Prazo de Pagamento
6. **Gateway:** Pago no Prazo?
   - **SIM:** Registra Pagamento → Fim
   - **NÃO:** Cobrança Amigável → Cobrança Formal → Suspensão (se não pagar)

#### SLAs:
- Geração de fatura: **D-5** (5 dias antes do vencimento)
- Cobrança amigável: **D+3** (3 dias após vencimento)
- Cobrança formal: **D+10**
- Suspensão de serviço: **D+30**

---

### 7.2 - Renovação de Contratos
**Entrada:** 60 dias antes do vencimento do contrato

#### Lanes (5):
- Cliente
- CS / Renovação
- IA / Análise
- Financeiro / Proposta
- Gestão / Aprovação

#### Fluxo Resumido:
1. IA Detecta Contrato Próximo ao Vencimento (D-60)
2. IA Analisa Saúde da Conta (CSAT, Resultados, Engagement)
3. CS Prepara Proposta de Renovação
4. **Gateway:** Conta Saudável?
   - **SIM:** Proposta Padrão
   - **NÃO:** Proposta com Incentivo ou Desconto
5. CS Agenda Reunião de Renovação
6. Cliente Revisa Proposta
7. **Gateway:** Cliente Aceita?
   - **SIM:** Renovação → Novo Contrato
   - **NÃO:** Negociação → Offboarding (6.4)

#### SLAs:
- Detecção: **D-60**
- Primeira apresentação: **D-45**
- Negociação: **D-30 a D-15**
- Fechamento: **D-7**

---

### 7.3 - Expansão (Upsell/Cross-sell)
**Entrada:** Oportunidade detectada (proativa ou reativa)

#### Lanes (4):
- Cliente
- CS / Growth
- IA / Identificação
- Financeiro / Proposta

#### Fluxo Resumido:
1. IA Detecta Oportunidade de Expansão:
   - Cliente cresceu budget (5.1)
   - Resultados acima da meta (6.2)
   - Cliente solicitou novo canal (6.3)
2. CS Qualifica Oportunidade
3. CS Prepara Proposta de Expansão
4. CS Agenda Reunião Comercial
5. Cliente Avalia Proposta
6. **Gateway:** Cliente Aceita?
   - **SIM:** Expansão → Atualiza Contrato → Re-onboarding (parcial)
   - **NÃO:** Registra para Futuro

#### Gatilhos de Oportunidade:
- Budget esgotado consistentemente
- ROAS acima de threshold (ex: >300%)
- Cliente pergunta sobre novos canais
- Competidor lança campanha agressiva

---

## SOLUÇÃO 3: Orquestração e Gestão de Recursos

### Arquitetura: Camada de Orquestração

```
┌─────────────────────────────────────────────────────────┐
│            CAMADA DE ORQUESTRAÇÃO                       │
│                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐│
│  │ Gerenciador   │  │ Gerenciador   │  │ Gerenciador ││
│  │ de Filas      │  │ de Capacidade │  │ de Prioridade││
│  └───────────────┘  └───────────────┘  └─────────────┘│
│           │                  │                  │       │
│           └──────────────────┴──────────────────┘       │
│                              │                          │
└──────────────────────────────┼──────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────┐
│              EVENT BUS (Mensageria)                     │
│  Pub/Sub: RabbitMQ, Kafka ou AWS EventBridge           │
└─────────────────────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
    ┌────────┐           ┌────────┐           ┌────────┐
    │Nível 5 │           │Nível 6 │           │Nível 7 │
    │(Loop)  │           │(Paralelo)│         │(Paralelo)│
    └────────┘           └────────┘           └────────┘
```

### Componentes da Orquestração:

#### 1. Gerenciador de Filas

**Função:** Organizar demandas de múltiplos clientes

```javascript
// Modelo de Fila
{
  queueId: "q_5.2_optimization",
  tasks: [
    {
      taskId: "t_001",
      clientId: "cliente_A",
      processId: "5.2",
      priority: 9,        // 1-10 (10 = crítico)
      sla: "2h",
      status: "pending",
      createdAt: "2026-01-30T10:00:00Z",
      assignedTo: null
    },
    {
      taskId: "t_002",
      clientId: "cliente_B",
      processId: "5.2",
      priority: 7,
      sla: "4h",
      status: "in_progress",
      assignedTo: "user_123",
      startedAt: "2026-01-30T10:05:00Z"
    }
  ]
}
```

**Algoritmo de Priorização:**
```python
def calculate_priority(task):
    """
    Prioridade = (Urgência SLA × 0.4) +
                 (Valor Cliente × 0.3) +
                 (Criticidade × 0.3)
    """
    sla_urgency = get_sla_urgency(task.sla, task.created_at)  # 0-10
    client_value = get_client_tier(task.client_id)            # 0-10
    criticality = task.process_criticality                    # 0-10

    priority = (sla_urgency * 0.4) + (client_value * 0.3) + (criticality * 0.3)
    return priority

def get_sla_urgency(sla, created_at):
    """Quanto mais próximo do SLA break, maior a urgência"""
    time_elapsed = now() - created_at
    sla_threshold = parse_sla(sla)
    percentage_elapsed = time_elapsed / sla_threshold

    if percentage_elapsed >= 0.9:    return 10  # Crítico
    elif percentage_elapsed >= 0.75: return 8
    elif percentage_elapsed >= 0.5:  return 6
    else:                            return 4
```

#### 2. Gerenciador de Capacidade

**Função:** Alocar recursos baseado em disponibilidade

```javascript
// Modelo de Capacidade
{
  teamCapacity: {
    "gestor_trafego": {
      total: 5,
      available: 2,
      assigned: 3,
      skills: ["5.1", "5.2", "5.3"],
      currentLoad: 60  // %
    },
    "analista_cs": {
      total: 3,
      available: 1,
      assigned: 2,
      skills: ["6.1", "6.2", "6.3"],
      currentLoad: 67  // %
    }
  },
  thresholds: {
    warning: 70,    // % - Alerta amarelo
    critical: 85    // % - Alerta vermelho
  }
}
```

**Regras de Alocação:**
1. Verifica capacidade disponível
2. Prioriza por skill match
3. Balanceia carga entre membros
4. Escala alerta quando >70% capacidade
5. Bloqueia novos clientes quando >85% capacidade

#### 3. Gerenciador de Prioridade

**Tiers de Cliente:**
- **Tier 1 (Enterprise):** Prioridade 10, SLA reduzido 50%
- **Tier 2 (Growth):** Prioridade 7, SLA padrão
- **Tier 3 (Starter):** Prioridade 5, SLA padrão + 25%

**Regras de Preempção:**
- Tier 1 pode interromper Tier 3 se necessário
- Processos críticos (6.1 - Atendimento) têm prioridade sobre otimizações (5.2)
- SLA próximo do break tem prioridade sobre tarefas novas

---

## SOLUÇÃO 4: Sistema de Locks e Conflitos

### Arquitetura de Locks

```
┌─────────────────────────────────────────────────────────┐
│                  LOCK MANAGER                           │
│                                                         │
│  Redis ou DynamoDB para locks distribuídos             │
└─────────────────────────────────────────────────────────┘
```

### Modelo de Lock:

```javascript
{
  lockId: "lock_campaign_12345",
  resourceType: "campaign",
  resourceId: "campaign_12345",
  clientId: "cliente_A",
  holderId: "process_5.2_instance_001",
  holderType: "optimization",
  acquiredAt: "2026-01-30T10:00:00Z",
  expiresAt: "2026-01-30T10:30:00Z",  // Auto-release após 30min
  priority: 7,
  status: "active"
}
```

### Hierarquia de Prioridades:

```
PRIORIDADE ALTA (Pode interromper tudo)
  10. Offboarding (6.4) - Cliente cancelou
   9. Atendimento Crítico (6.1) - Bug reportado
   8. Disaster Recovery

PRIORIDADE MÉDIA (Pode aguardar)
   7. Otimização de Lances (5.2)
   6. Apresentação de Resultados (6.2)
   5. Alinhamento Estratégico (6.3)

PRIORIDADE BAIXA (Sempre aguarda)
   4. Testes A/B (5.3)
   3. Monitoramento (5.1)
```

### Fluxo de Resolução de Conflitos:

```python
def acquire_lock(resource_id, process_id, priority):
    """Tenta adquirir lock em recurso"""

    # 1. Verifica se recurso já está locked
    existing_lock = redis.get(f"lock_{resource_id}")

    if not existing_lock:
        # Recurso livre, cria lock
        create_lock(resource_id, process_id, priority)
        return {"status": "acquired"}

    # 2. Recurso locked, compara prioridades
    if priority > existing_lock.priority:
        # Nova requisição tem prioridade maior
        notify_holder(existing_lock.holder_id, "preempted")
        release_lock(existing_lock)
        create_lock(resource_id, process_id, priority)
        return {"status": "acquired", "preempted": existing_lock.holder_id}

    # 3. Prioridade menor ou igual, entra na fila
    add_to_wait_queue(resource_id, process_id, priority)
    return {"status": "queued", "position": get_queue_position()}

def notify_holder(holder_id, reason):
    """Notifica processo que está sendo preemptado"""
    event_bus.publish({
        "event": "lock_preempted",
        "holder": holder_id,
        "reason": reason,
        "action": "rollback_and_release"
    })
```

### Exemplo de Conflito Real:

**Cenário:** Campanha X está sendo otimizada (5.2) e cliente reporta bug (6.1)

```
1. 10:00 - Processo 5.2 adquire lock em campaign_12345 (prioridade 7)
2. 10:15 - Cliente reporta bug crítico via 6.1
3. 10:15 - Processo 6.1 solicita lock em campaign_12345 (prioridade 9)
4. 10:15 - Lock Manager detecta conflito
5. 10:15 - Lock Manager notifica 5.2 para fazer rollback
6. 10:16 - Processo 5.2 reverte mudanças e libera lock
7. 10:16 - Processo 6.1 adquire lock
8. 10:16 - Processo 6.1 pausa campanha para investigação
9. 10:25 - Bug resolvido, 6.1 libera lock
10. 10:25 - Processo 5.2 retoma da fila
```

---

## SOLUÇÃO 5: Audit Trail e Compliance

### Arquitetura de Auditoria

```
┌─────────────────────────────────────────────────────────┐
│                   EVENT LOGGER                          │
│  Captura TODOS os eventos do sistema                    │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              AUDIT DATABASE                             │
│  Imutável, append-only, time-series DB                  │
│  (DynamoDB, Cassandra ou TimescaleDB)                   │
└─────────────────────────────────────────────────────────┘
```

### Modelo de Evento de Auditoria:

```javascript
{
  eventId: "evt_001_5d3a2b1c",
  timestamp: "2026-01-30T10:00:00.123Z",
  eventType: "process.started",
  processId: "5.2",
  instanceId: "5.2_instance_001",
  clientId: "cliente_A",
  userId: "user_123",
  userRole: "gestor_trafego",

  resource: {
    type: "campaign",
    id: "campaign_12345",
    name: "Campaign Black Friday"
  },

  action: "budget_update",

  changes: {
    before: { dailyBudget: 100.00, status: "active" },
    after:  { dailyBudget: 150.00, status: "active" }
  },

  metadata: {
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0...",
    location: "São Paulo, BR",
    reason: "Optimization detected opportunity"
  },

  complianceFlags: {
    gdpr: true,
    lgpd: true,
    sox: false
  }
}
```

### Eventos Auditados:

**Nível de Processo:**
- `process.started`
- `process.completed`
- `process.failed`
- `process.preempted`

**Nível de Dados:**
- `data.created`
- `data.read`
- `data.updated`
- `data.deleted`

**Nível de Acesso:**
- `access.granted`
- `access.denied`
- `access.revoked`

**Nível de Compliance:**
- `gdpr.data_export_requested`
- `gdpr.data_deletion_requested`
- `lgpd.consent_granted`
- `lgpd.consent_revoked`

### Dashboard de Compliance:

```javascript
// Métricas de Compliance em Tempo Real
{
  compliance: {
    gdpr: {
      dataExportRequests: 5,      // Últimos 30 dias
      dataDeletionRequests: 2,
      avgResponseTime: "18h",     // SLA: 30 dias
      breaches: 0
    },
    lgpd: {
      consentRate: 100,            // %
      dataRetentionCompliance: 98, // %
      pendingReviews: 3
    },
    auditTrail: {
      eventsLogged24h: 45623,
      storageSize: "2.3 TB",
      oldestRecord: "2024-01-01",
      retentionPolicy: "7 years"
    }
  },

  alerts: [
    {
      severity: "warning",
      message: "GDPR data export request approaching SLA (25 days elapsed)",
      clientId: "cliente_C"
    }
  ]
}
```

---

## SOLUÇÃO 6: Monitoramento do Sistema

### Dashboard de Saúde do Sistema

```javascript
// Métricas de Performance dos Processos
{
  systemHealth: {
    overall: 92,  // % (0-100)

    processes: {
      "5.1": { health: 95, avgDuration: "12min", successRate: 98.5 },
      "5.2": { health: 88, avgDuration: "45min", successRate: 94.2 },
      "5.3": { health: 90, avgDuration: "5 days", successRate: 87.0 },
      "6.1": { health: 93, avgDuration: "2.5h",  successRate: 96.8 },
      "6.2": { health: 91, avgDuration: "3 days", successRate: 100 },
      "6.3": { health: 94, avgDuration: "1 day",  successRate: 98.0 }
    },

    slaCompliance: {
      total: 95.2,    // %
      breaches24h: 3,
      breaches7days: 12,
      worstProcess: "5.2"  // Mais SLA breaks
    },

    capacity: {
      current: 72,       // %
      available: 28,     // %
      trend: "increasing",
      projectedFull: "7 days"
    },

    errors: {
      last24h: 15,
      critical: 2,
      warnings: 13,
      topError: "API timeout in 4.2"
    }
  }
}
```

### Alertas Automáticos:

**Nível CRÍTICO (Pager/SMS):**
- SLA break iminente (<10% tempo restante)
- Capacidade >90%
- Erro crítico em processo core
- Múltiplos conflitos de lock

**Nível WARNING (Email/Slack):**
- Performance degradada (>2x tempo médio)
- Capacidade >75%
- Taxa de erro >5%
- Cliente Tier 1 insatisfeito (CSAT <7)

**Nível INFO (Dashboard):**
- Processo concluído com sucesso
- Otimização aplicada
- Novo cliente onboarded

---

## SOLUÇÃO 7: Versionamento de Processos

### Estratégia de Versionamento

```
v1.0.0 → v1.1.0 → v1.2.0 → v2.0.0
 │        │        │        │
 └─ Major.Minor.Patch ──────┘

Major: Mudanças incompatíveis (quebra fluxo)
Minor: Novas features (compatível)
Patch: Bug fixes (compatível)
```

### Implementação:

```javascript
// Registro de Versão de Processo
{
  processId: "5.2",
  versions: [
    {
      version: "2.0.0",
      status: "active",
      deployedAt: "2026-01-15",
      description: "Nova estratégia de bid com ML",
      breaking: true,
      rollbackVersion: "1.2.1"
    },
    {
      version: "1.2.1",
      status: "deprecated",
      deprecatedAt: "2026-01-15",
      description: "Versão estável anterior",
      breaking: false
    }
  ],

  clients: [
    { clientId: "cliente_A", version: "2.0.0", migratedAt: "2026-01-20" },
    { clientId: "cliente_B", version: "1.2.1", scheduledMigration: "2026-02-01" },
    { clientId: "cliente_C", version: "2.0.0", migratedAt: "2026-01-16" }
  ]
}
```

### Estratégia de Migração (Canary Deployment):

```
Dia 1:  5% clientes  → v2.0.0 (monitora 48h)
Dia 3:  20% clientes → v2.0.0 (monitora 48h)
Dia 5:  50% clientes → v2.0.0 (monitora 48h)
Dia 7:  100% clientes → v2.0.0
```

Se houver problema, rollback imediato para v1.2.1.

---

## Resumo de Implementação

### Ordem Recomendada:

**FASE 1 - Crítico (0-3 meses):**
1. ✅ Subprocesso 6.4 (Offboarding)
2. ✅ Sistema de Locks
3. ✅ Gerenciador de Filas

**FASE 2 - Alto Impacto (3-6 meses):**
4. ✅ Nível 7 (Gestão Financeira)
5. ✅ Audit Trail
6. ✅ Gerenciador de Capacidade

**FASE 3 - Melhoria Contínua (6-12 meses):**
7. ✅ Monitoramento de Sistema
8. ✅ Versionamento de Processos
9. ✅ Event Bus completo
10. ✅ Dashboard de Compliance

### Métricas de Sucesso:

- **Zero** cancelamentos por falta de offboarding estruturado
- **<2%** SLA breaks
- **95%+** taxa de renovação
- **100%** compliance em auditorias
- **<5min** tempo médio de alocação de recursos

---

## Próximos Passos

Quer que eu:
1. Detalhe a implementação de alguma solução específica?
2. Crie os diagramas BPMN dos novos subprocessos (6.4, 7.x)?
3. Projete a arquitetura técnica (APIs, banco de dados, integrações)?
4. Crie um roadmap de implementação detalhado?
