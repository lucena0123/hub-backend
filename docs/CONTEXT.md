# Contexto do Projeto

Ultima atualizacao: 2026-02-01

## Estado Geral: ~65% funcional

A plataforma de analytics/reporting esta **operacional**. O motor BPMN e integracoes adicionais ainda nao foram implementados.

## O Que Ja Funciona

### Backend (14 rotas, 13 services, 14 migrations)

**Autenticacao:**
- JWT completo (register, login, token 24h, bcryptjs)

**CRUD completo:**
- Clients, Campaigns, Metrics, Reports (PDF via Puppeteer)

**Meta Ads Integration (producao):**
- Campanhas, AdSets, Ads, Breakdowns (demografico, device, plataforma)
- 25+ action types parseados (purchases, leads, messaging, link clicks, etc.)
- Retry com exponential backoff, throttling (100ms delay, 30s timeout)
- Dry-run mode para testes seguros
- Historico de sync com tracking detalhado
- Cache invalidation apos sync

**Analytics:**
- Dashboard agregado (clientes, campanhas, ROAS, investimento, BPMN progress)
- Performance alerts (ROAS, CTR, CPL, budget thresholds)
- Lead tracking (qualificacoes, closings, revenue)
- Metricas de campanha com 25+ KPIs

**Infraestrutura:**
- PostgreSQL (pg driver nativo, pool max 20 conexoes)
- Redis (cache com invalidation patterns)
- Validacao com Zod (8 schemas)
- Fastify modular (config, plugins, routes, middleware, services)

### Frontend (8 paginas, 20+ componentes)

**Paginas funcionais:**
- `/` - Dashboard com stats, ROAS, investimento, BPMN progress
- `/clients` - Lista com tabela, filtros, CRUD
- `/clients/new` - Formulario de criacao
- `/clients/[id]` - Detalhe do cliente
- `/clients/[id]/performance` - Metricas e graficos de performance
- `/clients/[id]/reports` - Historico e geracao de relatorios
- `/processes` - Visualizacao BPMN (UI existe, backend parcial)
- `/alerts` - Alertas de performance com filtros

**Componentes construidos:**
- Dashboard: stats-card, recent-processes
- Performance: campaign-table, adset-table, creative-performance-table, demographics-chart, temporal-analysis, business-metrics-card, campaign-health-card, lead-gen-metrics-card
- Reports: report-generator
- UI: shadcn/ui (card, badge, button, table, tabs, select, label)
- Navigation component

**API Client:** Axios com funcoes para todas as rotas do backend.

### Banco de Dados (14 migrations)

```
001-009: Schema core (clients, campaigns, campaign_metrics, campaign_ads,
         client_bpmn_progress, monthly_reports, sync_history,
         campaign_lead_tracking, lead metrics columns)
010:     Health score e quality rankings em campaign_metrics
011:     adset_metrics (metricas por Ad Set)
012:     ad_creative_metrics (metricas por criativo + video stats)
013:     metrics_breakdowns (demografico, plataforma, device)
014:     business_metrics_config (CAC, LTV, ROI config)
```

## O Que Falta Implementar

### Critico (core do produto)

- [ ] **BPMN Engine** - Motor de execucao de processos (parser, executor, state machine, scheduler). Os 24 subprocessos estao definidos nos arquivos v5-data.js mas nao sao executaveis
- [ ] **Background Jobs** - Sistema de filas para processos recorrentes (5.1 diario, etc.)
- [ ] **Orquestracao** - Queue Manager, Capacity Manager, Lock Manager (design em docs/infrastructure.md, nao implementado)

### Alto impacto

- [ ] **Google Ads Integration** - Nao ha codigo nenhum
- [ ] **GA4 Integration** - Nao ha codigo nenhum
- [ ] **Email/Notificacoes** - Resend configurado em .env mas sem implementacao
- [ ] **Webhooks** - Nao implementado

### Melhorias

- [ ] **IA/OpenAI** - Chave em .env mas sem uso no codigo
- [ ] **Monitoramento (SystemMonitor)** - Design pronto, nao implementado
- [ ] **Audit Trail** - Design pronto, nao implementado
- [ ] **Version Manager** - Design pronto, nao implementado
- [ ] **WebSocket** - Notificacoes em tempo real

## Decisoes Tecnicas Tomadas

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| ORM | pg nativo (nao Prisma) | Controle total sobre queries, migrations SQL manuais |
| Framework backend | Fastify | Performance superior ao Express |
| Arquitetura backend | Modular (routes/plugins/services) | Refatorado de monolito server-pg.ts |
| Meta Ads API | v20.0 | Versao estavel com suporte a breakdowns |
| Frontend | Next.js 14 App Router | SSR + routing nativo |
| Cache | Redis com invalidation | Evita dados stale apos sync |
| Reports | HTML->PDF via Puppeteer | Flexibilidade total de layout |
| Auth | JWT + bcryptjs | Stateless, simples de escalar |

## Configuracao Necessaria (.env)

```bash
# Funcionais (em uso)
META_ACCESS_TOKEN=          # Obrigatorio para sync Meta Ads
META_AD_ACCOUNT_ID=         # Obrigatorio para sync Meta Ads
META_API_VERSION=v20.0      # Opcional (default v20.0)
JWT_SECRET=                 # Opcional (tem default)
REDIS_URL=                  # Opcional (default localhost:6379)

# Configurados mas sem implementacao
OPENAI_API_KEY=             # Para features de IA (futuro)
RESEND_API_KEY=             # Para emails (futuro)

# Hardcoded (config/database.ts)
# PostgreSQL: localhost:5433, db: bpmn_system, user: bpmn, pass: dev123
```

## Divida Tecnica

- Credenciais do banco hardcoded em `config/database.ts` (deveria usar env vars)
- Referencia a Prisma no package.json mas nao e usado (usa pg nativo)
- Pagina `/processes` tem UI mas backend BPMN nao esta completo

## Repositorios

| Repo | Branch | Remote |
|------|--------|--------|
| Hub (principal) | `claude-work` | github.com/lucena0123/Hub.git |
| hub-frontend (submodule) | `codex-work` | github.com/lucena0123/hub-frontend.git |
