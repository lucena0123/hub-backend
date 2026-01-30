# Mapa Visual de Conexões - Sistema BPMN v5

## Diagrama de Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NÍVEL 0: RAIZ                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  0.1 - Pre-SDR: Dados e Estratégia                       │    │
│  │  • Define ICP, Oferta, Canais                            │    │
│  │  • Configura CRM, IA, Integrações                        │    │
│  │  • Saída: Leads Prontos para SDR                         │    │
│  └──────────────────┬───────────────────────────────────────┘    │
└─────────────────────┼────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NÍVEL 1: FUNIL DE VENDAS                        │
│                                                                     │
│  ┌───────────────────┐      ┌──────────────────┐      ┌──────────┐│
│  │ 1.1 - Prospecção  │  →   │ 1.2 - Vendas     │  →   │1.3 -     ││
│  │      SDR          │      │  & Apresentação  │      │Fechamento││
│  │                   │      │                  │      │          ││
│  │ • Qualificação    │      │ • Discovery      │      │• Negociação│
│  │ • Cadência        │      │ • Proposta       │      │• Contrato  │
│  │ • Agendamento     │      │ • Apresentação   │      │• Assinatura│
│  │                   │      │                  │      │            │
│  │ Saída: Reunião    │      │ Saída: Proposta  │      │Saída:      │
│  │       Agendada    │      │       Enviada    │      │ Contrato   │
│  │                   │      │                  │      │ Fechado    │
│  └───────────────────┘      └──────────────────┘      └─────┬──────┘│
└───────────────────────────────────────────────────────────────┼─────┘
                                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              NÍVEL 2: ONBOARDING & PLANEJAMENTO                     │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐       │
│  │  2.1 - Onboarding                                      │       │
│  │  • Kickoff                                             │       │
│  │  • Setup de Acessos                                    │       │
│  │  • QA Técnica                                          │       │
│  │  • Saída: Cliente Operacional                          │       │
│  └────────────────────┬───────────────────────────────────┘       │
│                       │                                            │
│         ┌─────────────┴─────────────┐                             │
│         ▼                           ▼                              │
│  ┌──────────────┐           ┌──────────────┐                     │
│  │ 2.2 - Análise│           │ 2.3 - Metas  │                     │
│  │   de Mercado │           │    e KPIs    │                     │
│  │              │           │              │                     │
│  │ • Pesquisa   │           │ • Objetivos  │                     │
│  │ • Competição │    ───→   │ • Simulação  │                     │
│  │ • Insights   │           │ • Dashboard  │                     │
│  │              │           │              │                     │
│  │ Saída:       │           │ Saída:       │                     │
│  │ Estratégia   │           │ Metas        │                     │
│  │ Aprovada     │           │ Definidas    │                     │
│  └──────────────┘           └──────┬───────┘                     │
└─────────────────────────────────────┼────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                NÍVEL 3: PLANEJAMENTO DE CAMPANHA                    │
│                                                                     │
│  ┌───────────┐    ┌────────────┐    ┌──────────┐    ┌──────────┐ │
│  │3.1 -      │    │3.2 -       │    │3.3 -     │    │3.4 -     │ │
│  │Keywords   │ →  │Audiência   │ →  │Conteúdo  │    │Budget    │ │
│  │           │    │            │    │          │    │          │ │
│  │• Pesquisa │    │• Personas  │    │• Messages│    │• Alocação│ │
│  │• Expansão │    │• Segmentos │    │• Copies  │    │• Lances  │ │
│  │• Clusters │    │• Jornada   │    │• CTAs    │    │• ROI     │ │
│  └─────┬─────┘    └──────┬─────┘    └────┬─────┘    └─────┬────┘ │
│        │                 │                │                │      │
│        └─────────┬───────┴────────┬───────┘                │      │
│                  │                │                        │      │
└──────────────────┼────────────────┼────────────────────────┼──────┘
                   ▼                ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       NÍVEL 4: EXECUÇÃO                             │
│                                                                     │
│  ┌──────────────────┐         ┌──────────────────┐                │
│  │  4.1 - Criação   │         │  4.3 - Landing   │                │
│  │    de Anúncios   │         │      Page        │                │
│  │                  │         │                  │                │
│  │  • Design Visual │         │  • Wireframe     │                │
│  │  • Copy Final    │         │  • Copy LP       │                │
│  │  • Variações     │         │  • Implementação │                │
│  │  • QA            │         │  • Integração    │                │
│  │                  │         │                  │                │
│  │  Saída: Anúncios │         │  Saída: LP Ativa │                │
│  │         Prontos  │         │                  │                │
│  └────────┬─────────┘         └────────┬─────────┘                │
│           │                            │                          │
│           └────────────┬───────────────┘                          │
│                        ▼                                           │
│           ┌────────────────────────┐                              │
│           │  4.2 - Configuração    │◄──── Budget (de 3.4)        │
│           │       de Campanha      │                              │
│           │                        │                              │
│           │  • Estrutura           │                              │
│           │  • Segmentação         │                              │
│           │  • Tracking            │                              │
│           │  • Ativação            │                              │
│           │                        │                              │
│           │  Saída: Campanha Ativa │                              │
│           └────────────┬───────────┘                              │
│                        │                                           │
└────────────────────────┼───────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│              NÍVEL 5: OTIMIZAÇÃO CONTÍNUA (LOOP ⟲)                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  5.1 - Monitoramento Diário                              │    │
│  │                                                           │    │
│  │  • Dashboards & Métricas (CPL, CPC, CTR, ROAS)          │    │
│  │  • Detecção de Anomalias (IA)                           │    │
│  │  • Sugestão de Oportunidades                            │    │
│  │  • Gateway: Anomalia/Oportunidade?                       │    │
│  │    - Não: Registrar OK → Loop ⟲                         │    │
│  │    - Sim: Criar Tarefa → 5.2 ou 5.3                     │    │
│  └────────┬─────────────────────────┬──────────────────────┘    │
│           │                         │                            │
│     ┌─────┴─────┐            ┌──────┴──────┐                    │
│     ▼           │            │             ▼                     │
│  ┌──────────────┴───┐    ┌───┴──────────────────┐              │
│  │  5.2 - Otimização│    │  5.3 - Testes A/B    │              │
│  │  Lances & Budget │    │                       │              │
│  │                  │    │  • Hipótese           │              │
│  │  • Análise       │    │  • Amostra            │              │
│  │  • IA Sugestão   │    │  • Variações          │              │
│  │  • Ajuste Lances │    │  • Monitoramento      │              │
│  │  • Redistribuir  │    │  • Significância      │              │
│  │  • Aplicar       │    │  • Implementar        │              │
│  │                  │    │  • Biblioteca         │              │
│  │  Saída: Otimizado│    │  Saída: Teste         │              │
│  │         → 5.1 ⟲  │    │         Concluído     │              │
│  └──────────────────┘    │         → 5.1 ⟲       │              │
│                          └───────────────────────┘              │
│                                                                  │
│  LOOP INFINITO DE MELHORIA CONTÍNUA                             │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│           NÍVEL 6: CUSTOMER SUCCESS (PARALELO) ⟲                   │
│                                                                     │
│  ┌────────────────┐  ┌─────────────┐  ┌────────────┐  ┌─────────┐│
│  │6.1 - Atendimento│ │6.2 - Apresent│ │6.3 - Alinha│ │6.4 - Off│ │
│  │  ao Cliente    │  │  de Resultados│ │  Estratégico│ │ boarding││
│  │                │  │              │  │            │  │         ││
│  │ • Reativo      │  │ • Consolidação│ │ • Proativo │  │ • 5 Fases││
│  │ • IA Classif.  │  │ • Storytelling│ │ • Detecção │  │ • Retenção││
│  │ • Escalação    │  │ • Reunião     │ │ • Pauta IA │  │ • Desativar││
│  │ • CSAT         │  │ • CSAT        │ │ • Ata IA   │  │ • Backup ││
│  │ • Loop ⟲       │  │               │ │ • Loop ⟲   │  │ • Learning││
│  │                │  │ Entrada: 5.x  │ │ Entrada: A │  │         ││
│  │ Entrada: A     │  │ Saída: Result.│ │   qualquer │  │ Entrada:││
│  │   qualquer     │  │   Apresentados│ │ Saída: Alinh│ │ Cancela-││
│  │   momento      │  │               │ │  Concluído │  │ mento   ││
│  │ Saída: Demanda │  │               │ │            │  │ Saída:  ││
│  │   Resolvida    │  │               │ │            │  │ Offboard││
│  └────────────────┘  └───────────────┘ └────────────┘  └─────────┘│
│                                                                     │
│  GESTÃO DE RELACIONAMENTO CONTÍNUO + OFFBOARDING                   │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│             NÍVEL 7: GESTÃO COMERCIAL E FINANCEIRA ⟲               │
│                                                                     │
│  ┌──────────────────┐   ┌────────────────┐   ┌──────────────────┐│
│  │ 7.1 - Faturamento│   │ 7.2 - Renovação│   │ 7.3 - Expansão   ││
│  │   e Cobrança     │   │  de Contratos  │   │   (Upsell)       ││
│  │                  │   │                │   │                  ││
│  │ • Ciclo Loop ⟲   │   │ • D-60 Trigger │   │ • Oportunidade   ││
│  │ • Cobrança 3 Níveis│ │ • Gateway Saúde│   │ • Qualificação   ││
│  │ • Suspensão D+30 │   │ • Negociação   │   │ • Gateway Aceita?││
│  │ • Juridico       │   │ • → 6.4 se Não │   │ • → 2.1 Parcial  ││
│  │                  │   │                │   │                  ││
│  │ Entrada: Ciclo   │   │ Entrada: D-60  │   │ Entrada: Gatilho ││
│  │         Mensal   │   │         Vencim │   │         IA/CS    ││
│  │ Saída: Pagamento │   │ Saída: Renovado│   │ Saída: Expansão  ││
│  │        ou Suspensa│  │        ou → 6.4│   │        ou Follow ││
│  └──────────────────┘   └────────────────┘   └──────────────────┘│
│                                                                     │
│  GESTÃO DO CICLO DE VIDA FINANCEIRO DO CLIENTE                     │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
                    🎯 RECEITA RECORRENTE
```

---

## Matriz de Dependências

| Processo | Depende de | Alimenta | Tipo de Conexão |
|----------|-----------|----------|-----------------|
| **0.1** | - (início) | 1.1 | Sequencial |
| **1.1** | 0.1 | 1.2 | Sequencial |
| **1.2** | 1.1 | 1.3 | Sequencial |
| **1.3** | 1.2 | 2.1 | Sequencial |
| **2.1** | 1.3 | 2.2, 2.3 | Fork (paralelo) |
| **2.2** | 2.1 | 2.3 | Sequencial |
| **2.3** | 2.1, 2.2 | 3.1, 3.2, 3.3, 3.4 | Fork (paralelo) |
| **3.1** | 2.3 | 3.2, 3.3, 3.4 | Paralelo com alimentação |
| **3.2** | 2.3, 3.1 | 3.3, 3.4 | Paralelo com alimentação |
| **3.3** | 2.3, 3.1, 3.2 | 4.1, 4.3 | Fork (paralelo) |
| **3.4** | 2.3, 3.1, 3.2 | 4.2 | Sequencial |
| **4.1** | 3.3 | 4.2 | Join |
| **4.2** | 3.4, 4.1, 4.3 | 5.1 | Join e início do loop |
| **4.3** | 3.3 | 4.2 | Join |
| **5.1** | 4.2 (loop) | 5.2, 5.3, ou 5.1 | Loop contínuo com fork |
| **5.2** | 5.1 | 5.1 | Loop de retorno |
| **5.3** | 5.1 | 5.1 | Loop de retorno |
| **6.1** | Qualquer nível | - | Paralelo reativo |
| **6.2** | 5.x (ciclos) | - | Sequencial periódico |
| **6.3** | Qualquer nível | - | Paralelo proativo |
| **6.4** | Cliente solicita | - | Sequencial (Offboarding) |
| **7.1** | Ciclo mensal | 6.4 (se suspensão) | Loop de faturamento |
| **7.2** | D-60 vencimento | Renovação ou 6.4 | Loop de renovação |
| **7.3** | Oportunidade IA | 2.1 (parcial) | Paralelo proativo |

---

## Padrões de Fluxo

### 1. Fluxo Sequencial Linear (0.1 → 1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 2.3)
- **Característica:** Um processo só inicia após conclusão do anterior
- **Handoff:** Dados completos transferidos entre processos
- **Exemplo:** Lead qualificado em 1.1 vai direto para reunião em 1.2

### 2. Fluxo Fork (2.1 → [2.2, 2.3] ou 2.3 → [3.1, 3.2, 3.3, 3.4])
- **Característica:** Um processo alimenta múltiplos processos paralelos
- **Sincronização:** Processos podem rodar simultaneamente
- **Exemplo:** Após 2.3, todos os 3.x podem iniciar ao mesmo tempo

### 3. Fluxo de Alimentação Cruzada (3.1 → 3.2 → 3.3)
- **Característica:** Processos paralelos que se alimentam mutuamente
- **Dependencies:** 3.2 precisa de 3.1, 3.3 precisa de 3.1 e 3.2
- **Exemplo:** Keywords (3.1) são necessárias para definir audiência (3.2)

### 4. Fluxo Join ([4.1, 4.3] → 4.2)
- **Característica:** Múltiplos processos convergem para um único
- **Sincronização:** 4.2 precisa aguardar conclusão de 4.1 e 4.3
- **Exemplo:** Campanha só pode ser configurada com anúncios e LP prontos

### 5. Fluxo Loop Contínuo (5.1 ⟲ → 5.2/5.3 → 5.1 ⟲)
- **Característica:** Ciclo infinito de monitoramento e otimização
- **Sincronização:** 5.1 roda diariamente, dispara otimizações quando necessário
- **Exemplo:** Monitoramento detecta anomalia, aciona 5.2, otimiza, retorna para 5.1

### 6. Fluxo Paralelo de Customer Success (6.x ⟲)
- **Característica:** Processos independentes que operam em paralelo a todos os níveis
- **Sincronização:** 6.1 e 6.3 são reativos/proativos, 6.2 é periódico após ciclos 5.x, 6.4 é acionado por cancelamento
- **Exemplo:** Cliente abre ticket (6.1), sistema apresenta resultados (6.2), time agenda alinhamento (6.3), cliente cancela → offboarding (6.4)

### 7. Fluxo de Gestão Financeira (7.x ⟲)
- **Característica:** Processos de gestão do ciclo de vida financeiro do cliente
- **Sincronização:** 7.1 roda mensalmente, 7.2 D-60 antes vencimento, 7.3 detecta oportunidades proativamente
- **Exemplo:** Sistema fatura cliente (7.1), detecta contrato próximo ao fim (7.2), identifica oportunidade de expansão (7.3)

---

## Pontos Críticos de Integração

### 🔴 Gargalos Potenciais

1. **1.3 → 2.1 (Closing → Onboarding)**
   - Alto risco de dados incompletos
   - Necessita validação de contrato e pagamento
   - **Mitigação:** Checklist automático de handoff

2. **2.3 → 3.x (Metas → Planejamento)**
   - Múltiplas dependências paralelas
   - Risco de desalinhamento
   - **Mitigação:** Dashboard centralizado de status

3. **[4.1, 4.3] → 4.2 (Assets → Configuração)**
   - Aguarda múltiplos deliverables
   - Risco de atrasos em cascata
   - **Mitigação:** Tracking de progresso em tempo real

4. **5.1 ⟲ (Monitoramento Contínuo)**
   - Risco de fadiga de alertas (muitos falsos positivos)
   - Sobrecarga de dados sem ação
   - **Mitigação:** IA para filtrar anomalias relevantes, thresholds ajustáveis

5. **5.3 (Testes A/B)**
   - Testes simultâneos podem causar interferência
   - Amostra insuficiente prolonga testes
   - **Mitigação:** Governança de testes, IA para estimar duração

### 🟢 Pontos de Aprovação Cliente

| Nível | Processos com Aprovação | Criticidade |
|-------|------------------------|-------------|
| **1** | 1.2, 1.3 | 🔴 Alta |
| **2** | 2.1, 2.2, 2.3 | 🔴 Alta |
| **3** | 3.1, 3.2, 3.3, 3.4 | 🟡 Média |
| **4** | 4.1, 4.2, 4.3 | 🟢 Baixa |
| **5** | - | ⚪ Nenhuma (automático) |

---

## Fluxo de Dados entre Processos

### Dados Críticos que Transitam:

```
0.1 ───► ICP, Regras IA, Pipeline
         │
1.1 ───► Lead Qualificado, Engajamento
         │
1.2 ───► Proposta, Objeções, Fit
         │
1.3 ───► Contrato, Briefing, Escopo
         │
2.1 ───► Cliente Operacional, Acessos, Integrações
         │
2.2 ───► Análise Mercado, Insights, Estratégia
         │
2.3 ───► Metas, KPIs, Dashboard
         │
         ├──► 3.1: Keywords, Clusters, Métricas
         │
         ├──► 3.2: Personas, Segmentos, Jornada
         │
         ├──► 3.3: Messages, Copies, Briefing
         │
         └──► 3.4: Budget, Lances, Alocação
                   │
                   ├──► 4.1: Criativos, Variações
                   │
                   ├──► 4.2: Estrutura, Tracking
                   │
                   └──► 4.3: LP, Formulários, Integração
                            │
                            └──► 5.1: Campanhas Ativas, Métricas Baseline ⟲
                                  │
                                  ├──► 5.2: Anomalia, Contexto, Otimizações ⟲
                                  │
                                  └──► 5.3: Hipótese, Teste, Aprendizados ⟲
```

---

## Configuração de Storage (window.v5Data)

Cada processo registra seus dados em:
```javascript
window.v5Data['X.Y'] = {
  diagramXML,    // Definição BPMN completa
  nodeDetails,   // Tasks com SLA, tag, descrição
  phases,        // Fases visuais
  zoom,          // Nível de zoom
  storageKey,    // Identificador único
  startLabel,    // Label do evento inicial
  endLabels,     // Labels dos eventos finais
  ...config      // Outras configurações
};
```

### Chaves Registradas:
- `window.v5Data['0.1']` - Pre-SDR
- `window.v5Data['1.1']` - Prospecção SDR
- `window.v5Data['1.2']` - Vendas
- `window.v5Data['1.3']` - Fechamento
- `window.v5Data['2.1']` - Onboarding
- `window.v5Data['2.2']` - Análise Mercado
- `window.v5Data['2.3']` - Metas e KPIs
- `window.v5Data['3.1']` - Keywords
- `window.v5Data['3.2']` - Audiência
- `window.v5Data['3.3']` - Conteúdo
- `window.v5Data['3.4']` - Budget
- `window.v5Data['4.1']` - Anúncios
- `window.v5Data['4.2']` - Campanha
- `window.v5Data['4.3']` - Landing Page
- `window.v5Data['5.1']` - Monitoramento Diário
- `window.v5Data['5.2']` - Otimização de Lances
- `window.v5Data['5.3']` - Testes A/B
- `window.v5Data['6.1']` - Atendimento ao Cliente
- `window.v5Data['6.2']` - Apresentação de Resultados
- `window.v5Data['6.3']` - Reuniões de Alinhamento
- `window.v5Data['6.4']` - Offboarding e Encerramento
- `window.v5Data['7.1']` - Faturamento e Cobrança
- `window.v5Data['7.2']` - Renovação de Contratos
- `window.v5Data['7.3']` - Expansão (Upsell/Cross-sell)

---

## Sugestões de Implementação

### 1. Sistema de Navegação Hierárquica
```javascript
const hierarchy = {
  '0.1': {
    level: 0,
    children: ['1.1']
  },
  '1.1': {
    level: 1,
    parent: '0.1',
    children: ['1.2']
  },
  '1.2': {
    level: 1,
    parent: '1.1',
    children: ['1.3']
  },
  // ... continua
};
```

### 2. Sistema de Transição (Handoff)
```javascript
const transitions = {
  '0.1_to_1.1': {
    from: '0.1',
    to: '1.1',
    requiredData: ['icp', 'pipeline', 'regrasIA'],
    validation: () => { /* validação */ }
  },
  // ... continua
};
```

### 3. Dashboard de Status
```javascript
const processStatus = {
  '0.1': { status: 'completed', progress: 100 },
  '1.1': { status: 'in_progress', progress: 60 },
  '1.2': { status: 'pending', progress: 0 },
  // ... continua
};
```

### 4. Sistema de Notificações
```javascript
const alerts = [
  {
    process: '1.3',
    type: 'approval_pending',
    message: 'Cliente precisa aprovar contrato',
    priority: 'high'
  },
  {
    process: '4.2',
    type: 'waiting_dependencies',
    message: 'Aguardando 4.1 e 4.3',
    priority: 'medium'
  }
];
```

---

## Resumo Visual por Nível

```
NÍVEL 0 (Raiz)         → 1 processo  → Fundação estratégica
NÍVEL 1 (Vendas)       → 3 processos → Funil de vendas
NÍVEL 2 (Estratégico)  → 3 processos → Onboarding + Planejamento
NÍVEL 3 (Tático)       → 4 processos → Planejamento de campanha
NÍVEL 4 (Execução)     → 3 processos → Produção e ativação
NÍVEL 5 (Otimização)   → 3 processos → Monitoramento e melhoria contínua ⟲
NÍVEL 6 (CS)           → 4 processos → Customer Success e relacionamento ⟲
NÍVEL 7 (Financeiro)   → 3 processos → Gestão comercial e financeira ⟲

TOTAL: 24 subprocessos interconectados
```

---

## Legenda de Símbolos

- **→** : Fluxo sequencial direto
- **┌┐└┘** : Containers de processo
- **▼** : Transição de nível
- **│** : Conexão vertical
- **├┤** : Bifurcação/junção
- **🔴** : Criticidade alta
- **🟡** : Criticidade média
- **🟢** : Criticidade baixa
- **🎯** : Objetivo final
