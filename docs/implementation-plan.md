# Plano de Implementacao

Sistema BPMN com 24 subprocessos. Abordagem incremental: processos criticos primeiro.

**Objetivo:** Plataforma escalavel para marketing/vendas B2B, inicialmente 2 clientes, capacidade 50+.

## Stack (detalhes)

### Frontend
- Next.js 14 (App Router), TailwindCSS, shadcn/ui
- Graficos: Recharts
- Visualizacao BPMN: bpmn-js
- Estado: Zustand + React Query

### Backend
- Node.js 20+, Fastify, TypeScript
- Validacao: Zod
- Auth: JWT + Refresh Tokens

### Banco de Dados
- PostgreSQL 16 (dados estruturados)
- Redis 7 (locks, sessions, cache)
- Storage: AWS S3 / Cloudflare R2

### Integracoes
- Meta Ads: `facebook-nodejs-business-sdk`
- Google Ads: `google-ads-api`
- Analytics: `@google-analytics/data`
- Emails: Resend

### DevOps
- Docker + Docker Compose (local)
- Deploy: Vercel (frontend) + Railway (backend)
- CI/CD: GitHub Actions
- Monitoramento: Sentry + Axiom

## Schema do Banco (Prisma)

```prisma
model Client {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  tier          String   // "premium", "standard", "basic"
  status        String   // "active", "suspended", "churned"
  contractStart DateTime
  contractEnd   DateTime?
  budget        Float
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  processes     ProcessInstance[]
  campaigns     Campaign[]
  metrics       Metric[]
  @@map("clients")
}

model ProcessInstance {
  id            String   @id @default(uuid())
  processId     String   // "5.2", "6.1", etc
  version       String   // "1.0.0"
  status        String   // "running", "completed", "failed", "paused"
  priority      Int      @default(5)
  clientId      String
  client        Client   @relation(fields: [clientId], references: [id])
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  expectedSla   String
  slaBreached   Boolean  @default(false)
  currentPhase  String?
  currentTask   String?
  state         Json
  tasks         Task[]
  @@map("process_instances")
  @@index([clientId, status, processId])
}

model Task {
  id                String   @id @default(uuid())
  taskId            String
  name              String
  lane              String
  status            String   // "pending", "in_progress", "completed", "failed"
  priority          Int      @default(5)
  processInstanceId String
  processInstance   ProcessInstance @relation(fields: [processInstanceId], references: [id])
  assignedTo        String?
  startedAt         DateTime?
  completedAt       DateTime?
  durationMs        Int?
  input             Json?
  output            Json?
  error             String?
  @@map("tasks")
  @@index([processInstanceId, status, assignedTo])
}

model Campaign {
  id          String   @id @default(uuid())
  externalId  String   @unique
  platform    String   // "meta", "google"
  name        String
  status      String
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  budget      Float
  spent       Float    @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  metrics     Metric[]
  @@map("campaigns")
  @@index([clientId, platform])
}

model Metric {
  id          String    @id @default(uuid())
  date        DateTime
  clientId    String
  client      Client    @relation(fields: [clientId], references: [id])
  campaignId  String?
  campaign    Campaign? @relation(fields: [campaignId], references: [id])
  impressions Int       @default(0)
  clicks      Int       @default(0)
  conversions Int       @default(0)
  spent       Float     @default(0)
  revenue     Float     @default(0)
  ctr         Float?
  cpc         Float?
  cpa         Float?
  roas        Float?
  createdAt   DateTime  @default(now())
  @@map("metrics")
  @@unique([clientId, campaignId, date])
  @@index([clientId, date])
}

model AuditEvent {
  id              String   @id @default(uuid())
  eventType       String
  processId       String?
  clientId        String
  userId          String
  userRole        String
  resource        Json
  action          String
  changes         Json?
  metadata        Json
  complianceFlags Json
  timestamp       DateTime @default(now())
  @@map("audit_events")
  @@index([clientId, eventType, timestamp])
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  role         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@map("users")
}
```

## Roadmap Semanal

### Semana 1: Fundacao
- Setup monorepo (Turborepo)
- Configurar Next.js + Fastify
- PostgreSQL + Prisma + Redis (Docker Compose)
- Schema completo do banco
- Auth JWT
- **Entregavel:** Sistema rodando localmente com login

### Semana 2: BPMN Engine Core
- BPMNParser (le arquivos *-v5-data.js)
- BPMNExecutor (executa tasks sequencialmente)
- Maquina de estados (pending->running->completed)
- Scheduler para processos recorrentes
- Integrar QueueManager
- Endpoints: start, status, complete task
- **Entregavel:** Engine funcional executando processos simples

### Semana 3: Integracao Meta Ads
- Setup Meta App + credenciais
- MetaAdsService: getCampaigns, getInsights, updateBudget, updateBidStrategy
- Job diario de sincronizacao
- Salvar metricas no banco
- **Entregavel:** Dados reais do Meta Ads dos 2 clientes

### Semana 4: Processo 5.1 (Monitoramento)
- Implementar 29 tasks do processo 5.1
- Alertas automaticos (orcamento esgotado, ROAS baixo)
- Integrar SystemMonitor
- Dashboard basico no frontend
- Notificacoes (email/Slack)
- **Entregavel:** Processo 5.1 rodando diariamente com alertas

### Semana 5: Frontend Dashboard
- Dashboard principal (health, processos ativos, tarefas, metricas)
- Tela de processos (visualizacao BPMN com bpmn-js, status, timeline)
- Tela de tarefas (fila, atribuicao, conclusao)
- Graficos com Recharts
- **Entregavel:** Dashboard funcional e profissional

### Semana 6: Processo 5.2 (Otimizacao)
- Implementar 34 tasks do processo 5.2
- Algoritmo otimizacao: tendencias 7d, sugestoes budget, sugestoes pausa
- Integrar Meta Ads para aplicar mudancas
- Aprovacao manual antes de aplicar
- Integrar LockManager
- **Entregavel:** Sistema otimizando campanhas automaticamente

### Semana 7: Processo 6.2 (Apresentacao)
- Implementar 35 tasks do processo 6.2
- Gerador de relatorios (PDF ou web)
- Storytelling com IA (analise performance, insights, proximos passos)
- Envio automatico mensal
- Portal do cliente
- **Entregavel:** Relatorios mensais gerados automaticamente

### Semana 8: Processos 2.1 + 7.1
- Implementar processo 2.1 Onboarding (32 tasks) + workflow aprovacoes
- Implementar processo 7.1 Faturamento (35 tasks) + integracao faturamento
- Notificacoes de cobranca
- **Entregavel:** Onboarding e faturamento funcional

### Semanas 9-10: Producao
- Integrar 6 modulos de infraestrutura
- CI/CD (GitHub Actions)
- Deploy: Vercel (frontend) + Railway (backend + DB) + Upstash (Redis)
- Sentry (monitoramento)
- Testes com 2 clientes reais
- **Entregavel:** Sistema em producao com 5 processos funcionais

## Marcos de Sucesso

| Marco | Criterio |
|-------|---------|
| Semana 4 | 5.1 diario + dados Meta Ads + alertas |
| Semana 8 | 5 processos (5.1, 5.2, 6.2, 2.1, 7.1) + dashboard + 2 clientes |
| Semana 10 | Producao + todos os modulos infra + proximos 3 processos planejados |

## Dependencias (npm)

```bash
# Backend
fastify @fastify/cors @fastify/jwt
prisma @prisma/client
zod redis
facebook-nodejs-business-sdk

# Frontend
@tanstack/react-query zustand
recharts bpmn-js
```
