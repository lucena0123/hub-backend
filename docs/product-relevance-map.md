# Hub - Mapa de Relevancia e Evolucao do Produto

## Objetivo
Este documento registra a leitura atual do Hub como produto.

- `Hoje`: peso misto entre importancia de negocio e profundidade real da implementacao no repo.
- `Ideal`: distribuicao esperada para um sistema completo de gestao de agencia de marketing.
- `Percentual`: peso estrategico do modulo no produto, nao tamanho de codigo.

## Leitura Executiva
O Hub hoje ja opera como um sistema relevante para a rotina de agencia, mas esta concentrado demais em aquisicao, performance e otimizacao.

- O bloco `Performance + Otimizacao + Comercial` soma `46%` da relevancia atual.
- Esse bloco continua central no estado ideal, mas cai para `38%` porque entram modulos ausentes hoje.
- A fotografia correta e: `forte em operacao de marketing e vendas`, mas ainda `incompleto como ERP/OS de agencia`.

## Modulos Existentes Hoje
Os modulos abaixo possuem evidencia real de produto hoje, com base principalmente em:

- navegacao principal em `frontend/components/navigation/app-sidebar.tsx`
- clientes de API exportados em `frontend/lib/api/client.ts`
- rotas registradas em `backend/src/app.ts`

| Modulo existente | Evidencia atual no produto | Papel no Hub hoje |
| --- | --- | --- |
| Gestao de clientes e contas | `/clients`, detalhes de conta, campanhas, contexto por cliente | Base estrutural do produto |
| Comercial / CRM de leads | `/comercial`, configuracoes comerciais, forms publicos, dispatch, agendamento | Frente comercial e pipeline de conversao |
| Performance e analytics | `/performance`, `/summary`, KPIs, creative library, breakdowns, business metrics | Leitura operacional de resultado |
| Otimizacao operacional | `/optimization/board`, `/optimization/settings`, `/optimization/effectiveness`, `/tasks`, `/meta-ops` | Diagnostico e execucao de melhorias |
| Relatorios e visao executiva | dashboard geral, summary, executive, geracao de reports | Sintese para decisao |
| Processos / BPMN / workflow | `/processes`, BPMN progress, tasks operacionais | Orquestracao de fluxo interno |
| Alertas e notificacoes | `/alerts`, badge, unread count, anomalies | Camada transversal de monitoramento |
| Integracoes e sincronizacao | Meta sync, Meta discovery, filas, workers, Google Calendar, Evolution | Infra operacional critica |
| Diagnostico criativo / IA | creative linter, copy suggestions, AI insights, audience/compliance/benchmark | Acelerador de analise e criacao |
| Plataforma / acesso / admin | auth, settings, health, queue status | Governanca, acesso e suporte tecnico |

## Comparativo Antes x Depois
| Modulo | Situacao hoje | Relevancia hoje | Relevancia ideal | Direcao |
| --- | --- | ---: | ---: | --- |
| Performance e analytics | Muito forte e muito visivel no produto | `16%` | `13%` | Continua core, mas deixa de dominar o sistema sozinho |
| Otimizacao operacional | Muito forte, com board, regras, tasks e proposals | `15%` | `11%` | Continua core, mas reequilibra peso dentro do produto |
| Comercial / CRM de leads | Forte, com pipeline, dispatch, briefing e scheduling | `15%` | `14%` | Continua muito relevante como frente comercial da agencia |
| Gestao de clientes e contas | Bem presente, mas menos profunda que performance/comercial | `11%` | `10%` | Permanece base estrutural do produto |
| Relatorios e visao executiva | Presente em varias telas e APIs | `10%` | `8%` | Continua importante, mas mais como camada de leitura do negocio |
| Integracoes e sincronizacao | Forte no backend e essencial para operacao | `10%` | `8%` | Mantem papel critico, mas como infraestrutura de suporte |
| Processos / BPMN / workflow | Existe, mas ainda com centralidade menor | `8%` | `8%` | Mantem peso estavel; pode virar espinha operacional se amadurecer |
| Alertas e notificacoes | Relevante para operacao diaria, mas complementar | `6%` | `5%` | Continua importante, porem como mecanismo transversal |
| Diagnostico criativo / IA | Existe e agrega valor, mas nao sustenta o produto sozinho | `5%` | `4%` | Fica como acelerador, nao como eixo principal |
| Plataforma / acesso / admin | Necessario, mas pouco visivel como modulo de negocio | `4%` | `4%` | Mantem peso estavel |
| Financeiro / cobranca / contratos | Praticamente ausente como modulo estruturado | `0%` | `7%` | Principal lacuna para virar gestao completa de agencia |
| Gestao de entregas / projetos | Praticamente ausente como modulo proprio | `0%` | `5%` | Precisa existir para cobrir producao e execucao da agencia |
| CS / onboarding / retencao | Hoje aparece diluido em comercial e processos | `0%` | `3%` | Precisa ganhar identidade propria no produto |

## Cobertura Atual da Navegacao
O menu principal atual ja cobre os modulos mais relevantes do estado atual:

| Grupo de navegacao | Entradas atuais | Modulo principal |
| --- | --- | --- |
| Operacoes | Dashboard, Resumo, Meta Ops | Relatorios + Otimizacao |
| Clientes | Contas, Processos | Gestao de clientes + Workflow |
| Otimizacao | Kanban Board, Configuracoes, Efetividade | Otimizacao operacional |
| Comercial | Pipeline de Leads | Comercial / CRM |
| Diagnostico | Creative Linter, Alertas, Intervencoes | IA + Alertas + Operacao |
| Relatorios | Executivo, Performance | Relatorios + Analytics |

## Cobertura Atual da Superficie de API
O frontend consome uma superficie de API que reforca a leitura acima:

| Grupo de API consumido pelo frontend | Modulo associado |
| --- | --- |
| `clients`, `campaigns`, `lead-tracking` | Gestao de clientes e contas |
| `commercial` | Comercial / CRM de leads |
| `analytics`, `action-proposals`, `optimization` | Performance e Otimizacao |
| `dashboard`, `reports` | Relatorios e visao executiva |
| `processes`, `tasks` | Processos / workflow |
| `alerts`, `notifications` | Alertas e notificacoes |
| `meta-sync`, `meta-discovery` | Integracoes e sincronizacao |
| `auth`, `health` | Plataforma / acesso / admin |

## Lacunas Para Virar Sistema Completo de Agencia
Tres frentes ainda nao existem como modulos maduros no produto.

### 1. Financeiro / cobranca / contratos
Hoje ha sinais parciais em status comerciais e fluxo operacional, mas nao existe modulo proprio de negocio.

Precisa incluir:

- contratos e propostas estruturadas
- cobranca, faturamento e status financeiro do cliente
- renovacao e inadimplencia
- relacao entre receita, contrato e conta atendida

### 2. Gestao de entregas / projetos
Hoje o Hub tem processos e tarefas, mas nao um modulo claro de producao da agencia.

Precisa incluir:

- projetos por cliente
- backlog e entregas
- responsaveis, prioridade e prazos
- status de execucao por squad ou area

### 3. CS / onboarding / retencao
Hoje o assunto aparece diluido em comercial e BPMN, mas nao como frente propria.

Precisa incluir:

- onboarding do cliente apos venda
- health score e risco de churn
- marcos de acompanhamento
- retencao, renovacao e expansao

## Mapa de Evolucao do Hub
### Estado atual
`Hub operacional de marketing e vendas`, forte em:

- clientes
- comercial
- performance
- otimizacao
- relatorios

### Estado alvo
`Sistema completo de gestao de agencia`, com distribuicao mais equilibrada entre:

- frente comercial
- operacao de campanhas
- producao e entregas
- customer success
- financeiro
- visao executiva

### Prioridade de evolucao
1. Consolidar o nucleo atual sem inflar novas frentes sobre uma base confusa.
2. Manter `Integracoes`, `Alertas`, `Diagnostico IA` e `Admin` como camadas transversais, nao como eixos de produto.
3. Adicionar os tres modulos ausentes em ordem:
   1. `Financeiro / cobranca / contratos`
   2. `Gestao de entregas / projetos`
   3. `CS / onboarding / retencao`

## Regras de Interpretacao
- Reducao percentual em modulo forte nao significa perda de importancia; significa reequilibrio do produto total.
- `Comercial` foi tratado como modulo real e relevante, nao como experimento.
- `Financeiro`, `Projetos` e `CS` entram no estado ideal porque sao obrigatorios para um sistema de agencia realmente completo.
- Este documento representa a visao de produto atual do repo; nao substitui backlog, priorizacao ou plano de implementacao detalhado.
