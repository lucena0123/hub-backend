# Contexto do Projeto

Ultima atualizacao: 2026-02-01

## Estado Geral: ~70% funcional

Plataforma de analytics, reporting e gestao de campanhas **operacional em producao local**. Faltam: motor BPMN, Google Ads, GA4, notificacoes e IA.

---

## Backend: O Que Existe (43 arquivos TS, ~6.400 linhas)

### Server (server-pg.ts, 123 linhas)
- Fastify 5.2.0 em 0.0.0.0:3001
- Plugins: @fastify/cors, @fastify/helmet (CSP off), @fastify/jwt (24h)
- Plugin custom `servicesPlugin` instancia 8 services + pool PG + Redis
- Error handler global, graceful shutdown (SIGINT/SIGTERM)
- Logger: pino (pino-pretty em dev)

### Rotas: 33 endpoints em 13 arquivos

| Arquivo | Endpoints | Status |
|---------|-----------|--------|
| health.routes.ts | GET `/`, GET `/health` (DB+Redis check) | Funcional |
| auth.routes.ts | POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me` | Funcional |
| client.routes.ts | GET/POST/PUT/DELETE `/api/clients`, GET `/api/clients/:id`, GET `/api/clients/:id/performance-summary` | Funcional, com audit log |
| campaign.routes.ts | GET/POST/PUT/DELETE `/api/campaigns`, GET `/api/campaigns/:id` | Funcional, com cache Redis |
| metrics.routes.ts | GET `/api/campaigns/:id/metrics`, GET `/:id/performance-summary`, POST `/api/metrics/import` (batch 1000), POST `/api/metrics/entry` | Funcional |
| meta-sync.routes.ts | POST `/api/metrics/sync/meta` (campaign/adset/ad/full), GET `/api/metrics/sync/history`, GET `/:id` | **Mais complexo (721 linhas)**, producao |
| meta-discovery.routes.ts | GET `/api/meta/test`, GET `/api/meta/accounts`, GET `/:accountId/info`, GET `/:accountId/campaigns` | Funcional |
| dashboard.routes.ts | GET `/api/dashboard/overview` (60s cache), GET `/api/dashboard/stats`, GET `/api/alerts` | Funcional |
| bpmn.routes.ts | GET/POST/PUT `/api/clients/:id/bpmn-progress`, GET `/api/bpmn/subprocess/:id/clients` | Funcional (tracking manual) |
| report.routes.ts | POST `/api/reports/generate/:clientId`, GET `/:clientId/history`, GET `/:reportId/download` | Funcional (PDF via Puppeteer) |
| process.routes.ts | GET `/api/processes` (limit 50), GET `/:id` (com tasks), GET `/api/tasks` (limit 100) | Funcional |
| lead-tracking.routes.ts | POST `/api/lead-tracking`, GET/DELETE `/api/campaigns/:id/lead-tracking`, GET `/lead-summary` | Funcional |
| analytics.routes.ts | GET `/:id/adset-metrics`, GET `/:id/ad-metrics`, GET `/:id/breakdowns/:type`, GET `/:id/temporal-analysis`, GET `/:id/business-metrics` | Funcional, avancado |

### Services: 11 implementados

| Service | Linhas | O Que Faz |
|---------|--------|-----------|
| MetaAdsService | 371 | Fetch Meta Graph API v20.0 (campaigns, adsets, ads, breakdowns). Retry backoff, throttling 100ms, timeout 30s, paginacao max 100 requests |
| MetricsService | 428 | Calculos CTR/CPC/CPL/CPA/ROAS/CPM, metricas diarias, performance summary por campanha e por cliente |
| DashboardService | 222 | Agrega clients, campaigns, performance (30d), BPMN progress, reports, recent activity |
| ReportGenerator | 171 | Gera PDF via Puppeteer (A4, 20mm margins), salva em `./reports/`, metadata no banco |
| BPMNTracker | 244 | Tracking manual de progresso BPMN por cliente (subprocessos 4.1-5.3 hardcoded) |
| LeadTrackingService | 224 | CRUD lead tracking, calcula qualification rate, closing rate, ROI, cost per contract |
| SyncHistoryService | 185 | Tracking de operacoes sync Meta Ads (success/partial/failed, duracao, metricas) |
| CacheService | 62 | Redis get/set/invalidate/invalidatePattern (TTL default 300s) |
| PerformanceAlertService | ~150 | Gera alertas por ROAS, CTR, CPL, budget thresholds |
| ClientAudit | 121 | Audit log para operacoes CRUD de clientes |
| MockMetrics | 223 | Seed: 3 campanhas teste, 30 dias de metricas, BPMN progress inicial |

### Validators: 7 schemas Zod
auth (register/login), client (create/update + CPF/CNPJ), campaign (create/update), bpmn (init/update), report, metrics-import, meta-sync (com syncLevel enum)

### Config
- `database.ts`: PG pool hardcoded (localhost:5433, bpmn_system, bpmn/dev123, max 20)
- `redis.ts`: env REDIS_URL ou localhost:6379
- `env.ts`: PORT 3001, JWT_SECRET com default dev

### Middleware
- `auth.ts`: authenticate (JWT verify) + optionalAuth (silently continues)
- `audit.ts`: createAuditLog + ClientAudit class (logCreate/Update/Delete)

---

## Frontend: O Que Existe (Next.js 16.1.6, React 19.2.3)

### 9 Paginas (todas funcionais, zero stubs)

| Pagina | O Que Faz |
|--------|-----------|
| `/` (dashboard) | Stats, ROAS, investimento, BPMN progress, recent activity. Auto-refresh 30s |
| `/clients` | Tabela com nome, email, tier, status, budget, datas. CRUD completo + delete modal |
| `/clients/new` | Formulario com Zod + react-hook-form. CPF/CNPJ validation, tier auto-preview |
| `/clients/[id]` | 4 tabs: Overview, Campaigns, Processes, Edit. Links para Performance e Reports |
| `/clients/[id]/performance` | **Pagina mais complexa.** Period selector, campaign selector, 11 componentes: chart, lead tracking, health card, adset/creative tables, demographics, temporal, business metrics, BPMN tracker |
| `/clients/[id]/reports` | Lista relatorios, download PDF, botao gerar novo (modal month/year) |
| `/processes` | Tabela processos com auto-refresh 15s, status badges, priority colors, progress bar |
| `/alerts` | Filtro por categoria (roas/ctr/budget/cpl/conversions/bpmn), severity badges |

### 26 Componentes (todos funcionais)
- **UI (8):** badge, button, card, input, label, select, table, tabs
- **Navigation (1):** Top nav com links + AlertBadge + versao
- **Dashboard (2):** stats-card, recent-processes
- **Performance (12):** campaign-table, adset-table, creative-performance-table, demographics-chart, temporal-analysis, business-metrics-card, campaign-health-card, lead-gen-metrics-card, lead-tracking-form, bpmn-progress-tracker, metrics-card, performance-chart (Recharts LineChart dual axes)
- **Reports (1):** report-generator (modal PDF)
- **Alerts (2):** alert-card, alert-badge

### API Client (lib/api/client.ts): 40+ funcoes
Axios para todas as rotas do backend. Base URL: `NEXT_PUBLIC_API_URL || http://localhost:3001`

### Types: 18 interfaces
Client, Campaign, ProcessInstance, Task, DashboardStats, DashboardOverview, PerformanceAlert, DailyMetric, PerformanceSummary, ClientPerformanceSummary, BPMNProgress, MonthlyReport, LeadTrackingData, CampaignAd, MetricsPeriod, LeadGenMetrics, HealthStatus, AlertsResponse

---

## Banco de Dados: 16 Migrations

```
003: campaign_metrics (impressions, clicks, spend, conversions, ROAS, CTR, CPC, CPL + 25 colunas)
004: campaign_ads (mapeamento campanha/ad)
005: client_bpmn_progress (tracking BPMN por cliente)
006: monthly_reports (metadata relatorios PDF)
007: sync_history (historico sync Meta Ads)
008: campaign_lead_tracking (metricas de lead)
009: Lead metrics adicionados a campaign_metrics
010: Health score + quality rankings em campaign_metrics
011: adset_metrics (metricas por Ad Set)
012: ad_creative_metrics (metricas por criativo + video stats p25-p100)
013: metrics_breakdowns (demografico, plataforma, device)
014: business_metrics_config (CAC, LTV, ROI config por cliente)
015: ad_creative_snapshots (snapshots de copy/CTA/URL + suporte a dynamic creative)
016: ad_creative_metrics (creative_id + creative_snapshot_id)
```

**Tabelas existentes:** clients, users, campaigns, campaign_metrics, campaign_ads, adset_metrics, ad_creative_metrics, ad_creative_snapshots, metrics_breakdowns, campaign_lead_tracking, client_bpmn_progress, monthly_reports, sync_history, process_instances, tasks, audit_events, business_metrics_config

---

## O Que Falta Implementar

### P0 - Critico (sem isso o produto nao escala)

- [ ] **BPMN Engine** - Motor de execucao. Os 24 subprocessos existem em `processos/*.js` mas nao sao executaveis. Precisa: parser dos v5-data.js, executor de tasks, state machine (pending->running->completed->failed), scheduler para loops (5.1 diario). Hoje o tracking e manual via bpmn.routes.ts
- [ ] **Background Jobs / Worker** - Nao ha sistema de jobs. Processos recorrentes (monitoramento diario, faturamento mensal, renovacao D-60) precisam de scheduler (ex: BullMQ + Redis)
- [ ] **DB credentials via env vars** - Credenciais hardcoded em config/database.ts. Bloqueio para deploy em producao

### P1 - Alto impacto (expande capacidade do produto)

- [ ] **Google Ads Integration** - Zero codigo. Mesmo padrao do MetaAdsService
- [ ] **GA4 Integration** - Zero codigo. Dados de conversao e comportamento no site
- [ ] **Email/Notificacoes** - Resend mencionado mas sem implementacao. Necessario para alertas, relatorios, cobranca
- [ ] **Rate Limiting** - Nenhum rate limit no servidor. Risco em producao
- [ ] **Orquestracao** - Queue Manager, Capacity Manager, Lock Manager (design em docs/infrastructure.md, zero codigo)

### P2 - Melhorias (diferenciais competitivos)

- [ ] **IA/OpenAI** - Insights automaticos, storytelling de relatorios, deteccao de anomalias
- [ ] **WebSocket** - Notificacoes tempo real (alertas, conclusao de sync)
- [ ] **Audit Trail completo** - O middleware de audit existe (ClientAudit) mas nao cobre todos os eventos do sistema
- [ ] **System Monitor** - Health score por processo, SLA tracking (design pronto)
- [ ] **Version Manager** - Canary deploy de processos (design pronto)
- [ ] **Portal do Cliente** - Acesso externo para cliente ver seus dados/relatorios
- [ ] **Testes automatizados** - Zero testes unitarios ou de integracao

---

## Decisoes Tecnicas

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| ORM | pg nativo (nao Prisma) | Controle total sobre queries SQL, migrations manuais. Prisma esta no package.json mas nao e usado |
| Framework backend | Fastify 5.2.0 | Performance, schema-based validation, plugin system |
| Arquitetura backend | Modular (13 route files, 11 services, plugins) | Refatorado de monolito server-pg.ts em 2026-02-01 |
| Meta Ads API | Graph API v20.0 | Suporte a breakdowns, action types, video metrics |
| Frontend framework | Next.js 16.1.6 (App Router) | SSR, file-based routing, React 19 |
| UI | TailwindCSS 4 + shadcn/ui + Radix primitives | Componentes acessiveis, customizaveis |
| Charts | Recharts 3.7.0 | Declarativo, React-native, dual-axis support |
| Forms | react-hook-form 7.71 + Zod 4.3 | Validacao type-safe, performance |
| Cache | Redis com TTL 300s + invalidation patterns | Evita dados stale apos sync Meta |
| Reports | HTML->PDF via Puppeteer 24.36 | Layout flexivel, A4, CSS completo |
| Auth | JWT (@fastify/jwt) + bcryptjs | Stateless, 24h expiration |
| Sync | Fetch nativo com retry/backoff/throttling | Sem dependencia extra, controle total |

## Configuracao (.env)

```bash
# Backend - Funcionais
META_ACCESS_TOKEN=          # Obrigatorio para sync Meta Ads
META_AD_ACCOUNT_ID=         # Obrigatorio para sync Meta Ads
META_API_VERSION=v20.0      # Default v20.0
JWT_SECRET=                 # Default: 'bpmn-system-dev-secret-change-in-production'
REDIS_URL=                  # Default: redis://localhost:6379
PORT=3001                   # Default: 3001
FRONTEND_URL=               # Default: http://localhost:3000 (CORS)

# Backend - Nao implementados
OPENAI_API_KEY=             # Para features de IA (futuro)
RESEND_API_KEY=             # Para emails (futuro)
DATABASE_URL=               # Nao usado (credenciais hardcoded em config/database.ts)

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Divida Tecnica

1. **Credenciais DB hardcoded** em `config/database.ts` (host, port, user, pass) - bloqueia deploy
2. **Prisma no package.json** mas nao usado - remover dependencia orfã
3. **Zero testes** - nenhum teste unitario, integracao ou e2e
4. **Zero rate limiting** - servidor aberto sem protecao
5. **BPMN tracking manual** - subprocessos hardcoded (4.1-5.3) no BPMNTracker, sem engine real
6. **Sem .env.example** no backend - dificulta onboarding de dev
7. **server-simple.ts** existe no src/ mas nao e usado - arquivo orfão

## Repositorios

| Repo | Branch | Remote |
|------|--------|--------|
| Hub (principal) | `claude-work` | github.com/lucena0123/Hub.git |
| hub-frontend (submodule) | `codex-work` | github.com/lucena0123/hub-frontend.git |

## Proxima Prioridade Sugerida

1. **Resolver DB credentials** (P0) - Mover para env vars, criar .env.example
2. **BPMN Engine MVP** (P0) - Parser v5-data.js + executor basico + state machine
3. **Background Jobs** (P0) - BullMQ + Redis para processos recorrentes
4. **Rate Limiting** (P1) - @fastify/rate-limit
5. **Google Ads** (P1) - Mesmo padrao MetaAdsService
6. **Testes** (P2) - Vitest para services, supertest para rotas
