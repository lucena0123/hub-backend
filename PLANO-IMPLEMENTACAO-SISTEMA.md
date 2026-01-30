# Plano de Implementação - Sistema BPMN Próprio

## Visão Geral

Sistema completo de automação baseado na arquitetura BPMN com 24 subprocessos, construído do zero como aplicação própria.

**Objetivo:** Construir plataforma escalável para gerenciar processos de marketing e vendas B2B, inicialmente para 2 clientes, com capacidade de escalar para 50+.

**Timeline:** 8-10 semanas (com IA)
**Abordagem:** Incremental - implementar processos críticos primeiro

---

## Stack Tecnológica Definida

### Frontend
```
Framework: Next.js 14 (App Router)
UI: TailwindCSS + shadcn/ui
Gráficos: Recharts
Visualização BPMN: bpmn-js (biblioteca oficial)
Estado: Zustand + React Query
```

### Backend
```
Runtime: Node.js 20+
Framework: Fastify (mais rápido que Express)
Linguagem: TypeScript
Validação: Zod
Auth: JWT + Refresh Tokens
```

### Banco de Dados
```
Principal: PostgreSQL 16 (dados estruturados)
Cache: Redis 7 (locks, sessions, cache)
Storage: AWS S3 / Cloudflare R2 (arquivos)
```

### BPMN Engine
```
Opção 1: bpmn-engine (lightweight, Node.js)
Opção 2: Custom engine baseado nos arquivos *-v5-data.js
Recomendado: Custom engine (maior controle)
```

### Integrações
```
Meta Ads: facebook-nodejs-business-sdk
Google Ads: google-ads-api
Analytics: @google-analytics/data
Emails: Resend (transacionais)
```

### DevOps
```
Container: Docker + Docker Compose
Deploy: Vercel (frontend) + Railway (backend)
CI/CD: GitHub Actions
Monitoramento: Sentry + Axiom
```

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  /app                                                       │
│  ├── /dashboard           # Dashboard principal            │
│  ├── /processes           # Visualizador BPMN              │
│  ├── /tasks               # Fila de tarefas                │
│  ├── /clients             # Gestão de clientes             │
│  ├── /analytics           # Métricas e relatórios          │
│  └── /settings            # Configurações                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────┴──────────────────────────────────────┐
│              BACKEND (Node.js + Fastify)                    │
│  /src                                                       │
│  ├── /api                 # Rotas HTTP                     │
│  ├── /engine              # BPMN Engine Custom             │
│  │   ├── executor.ts     # Executa processos              │
│  │   ├── parser.ts       # Lê arquivos *-v5-data.js       │
│  │   ├── state.ts        # Gerencia estados               │
│  │   └── scheduler.ts    # Cron jobs e triggers           │
│  ├── /infrastructure      # Módulos existentes             │
│  │   ├── queue-manager.ts                                  │
│  │   ├── capacity-manager.ts                               │
│  │   ├── lock-manager.ts                                   │
│  │   ├── audit-trail-manager.ts                            │
│  │   ├── system-monitor.ts                                 │
│  │   └── version-manager.ts                                │
│  ├── /integrations       # APIs externas                   │
│  │   ├── meta-ads.ts                                       │
│  │   ├── google-ads.ts                                     │
│  │   └── analytics.ts                                      │
│  ├── /database            # Prisma ORM                     │
│  │   ├── schema.prisma                                     │
│  │   └── migrations/                                       │
│  └── /services            # Lógica de negócio             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│               BANCO DE DADOS                                │
│  PostgreSQL                                                 │
│  ├── clients              # Clientes                       │
│  ├── processes            # Instâncias de processos        │
│  ├── tasks                # Tarefas individuais            │
│  ├── process_versions     # Versionamento                  │
│  ├── audit_events         # Audit trail                    │
│  ├── campaigns            # Campanhas Meta/Google          │
│  ├── metrics              # Métricas diárias               │
│  └── users                # Usuários do sistema            │
│                                                             │
│  Redis                                                      │
│  ├── sessions             # Sessões de usuário             │
│  ├── locks                # Locks distribuídos             │
│  ├── cache                # Cache de queries               │
│  └── queues               # Filas de tarefas               │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Pastas do Projeto

```
/bpmn-system
│
├── /apps
│   ├── /web                      # Frontend Next.js
│   │   ├── /app
│   │   │   ├── /dashboard
│   │   │   ├── /processes
│   │   │   ├── /tasks
│   │   │   └── /api             # API routes (opcional)
│   │   ├── /components
│   │   │   ├── /ui              # shadcn components
│   │   │   ├── /dashboard
│   │   │   ├── /bpmn
│   │   │   └── /charts
│   │   ├── /lib
│   │   │   ├── api-client.ts
│   │   │   └── utils.ts
│   │   └── package.json
│   │
│   └── /api                      # Backend Fastify
│       ├── /src
│       │   ├── /api              # Rotas HTTP
│       │   │   ├── /clients
│       │   │   ├── /processes
│       │   │   ├── /tasks
│       │   │   └── /metrics
│       │   ├── /engine           # BPMN Engine
│       │   │   ├── executor.ts
│       │   │   ├── parser.ts
│       │   │   ├── state-machine.ts
│       │   │   └── scheduler.ts
│       │   ├── /infrastructure   # Módulos já criados
│       │   │   ├── queue-manager.ts
│       │   │   ├── capacity-manager.ts
│       │   │   ├── lock-manager.ts
│       │   │   ├── audit-trail-manager.ts
│       │   │   ├── system-monitor.ts
│       │   │   └── version-manager.ts
│       │   ├── /integrations
│       │   │   ├── meta-ads.ts
│       │   │   ├── google-ads.ts
│       │   │   └── analytics.ts
│       │   ├── /database
│       │   │   ├── schema.prisma
│       │   │   ├── client.ts
│       │   │   └── migrations/
│       │   ├── /services
│       │   │   ├── process.service.ts
│       │   │   ├── task.service.ts
│       │   │   └── client.service.ts
│       │   ├── /utils
│       │   └── server.ts
│       ├── .env
│       └── package.json
│
├── /packages                     # Código compartilhado
│   ├── /types                    # TypeScript types
│   │   ├── process.types.ts
│   │   ├── task.types.ts
│   │   └── client.types.ts
│   ├── /bpmn-definitions         # Processos BPMN
│   │   ├── subprocesso-0.1-v5-data.js
│   │   ├── subprocesso-1.1-v5-data.js
│   │   └── ... (todos os 24)
│   └── /config
│       └── constants.ts
│
├── docker-compose.yml            # PostgreSQL + Redis local
├── .gitignore
├── turbo.json                    # Turborepo config
└── package.json                  # Workspace root
```

---

## Schema do Banco de Dados (Prisma)

```prisma
// database/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CLIENTES
// ============================================================================

model Client {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  tier         String   // "premium", "standard", "basic"
  status       String   // "active", "suspended", "churned"
  contractStart DateTime
  contractEnd   DateTime?
  budget       Float

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relações
  processes    ProcessInstance[]
  campaigns    Campaign[]
  metrics      Metric[]

  @@map("clients")
}

// ============================================================================
// PROCESSOS BPMN
// ============================================================================

model ProcessInstance {
  id              String   @id @default(uuid())
  processId       String   // "5.2", "6.1", etc
  version         String   // "1.0.0"
  status          String   // "running", "completed", "failed", "paused"
  priority        Int      @default(5)

  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])

  startedAt       DateTime @default(now())
  completedAt     DateTime?
  expectedSla     String   // "2h", "1d", etc
  slaBreached     Boolean  @default(false)

  // State da execução
  currentPhase    String?
  currentTask     String?
  state           Json     // Estado atual do processo

  // Relações
  tasks           Task[]

  @@map("process_instances")
  @@index([clientId])
  @@index([status])
  @@index([processId])
}

// ============================================================================
// TAREFAS
// ============================================================================

model Task {
  id              String   @id @default(uuid())
  taskId          String   // ID da task no BPMN
  name            String
  lane            String   // Responsável
  status          String   // "pending", "in_progress", "completed", "failed"
  priority        Int      @default(5)

  processInstanceId String
  processInstance   ProcessInstance @relation(fields: [processInstanceId], references: [id])

  assignedTo      String?  // userId
  startedAt       DateTime?
  completedAt     DateTime?
  durationMs      Int?

  input           Json?    // Dados de entrada
  output          Json?    // Dados de saída
  error           String?

  @@map("tasks")
  @@index([processInstanceId])
  @@index([status])
  @@index([assignedTo])
}

// ============================================================================
// CAMPANHAS (META/GOOGLE ADS)
// ============================================================================

model Campaign {
  id              String   @id @default(uuid())
  externalId      String   @unique // ID do Meta/Google
  platform        String   // "meta", "google"
  name            String
  status          String   // "active", "paused", "archived"

  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])

  budget          Float
  spent           Float    @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relações
  metrics         Metric[]

  @@map("campaigns")
  @@index([clientId])
  @@index([platform])
}

// ============================================================================
// MÉTRICAS DIÁRIAS
// ============================================================================

model Metric {
  id              String   @id @default(uuid())
  date            DateTime

  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])

  campaignId      String?
  campaign        Campaign? @relation(fields: [campaignId], references: [id])

  // Métricas
  impressions     Int      @default(0)
  clicks          Int      @default(0)
  conversions     Int      @default(0)
  spent           Float    @default(0)
  revenue         Float    @default(0)

  // Calculados
  ctr             Float?   // Click-through rate
  cpc             Float?   // Cost per click
  cpa             Float?   // Cost per acquisition
  roas            Float?   // Return on ad spend

  createdAt       DateTime @default(now())

  @@map("metrics")
  @@unique([clientId, campaignId, date])
  @@index([clientId])
  @@index([date])
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

model AuditEvent {
  id              String   @id @default(uuid())
  eventType       String

  processId       String?
  clientId        String
  userId          String
  userRole        String

  resource        Json     // { type, id, name }
  action          String
  changes         Json?    // { before, after }

  metadata        Json     // { ipAddress, userAgent, etc }
  complianceFlags Json     // { gdpr, lgpd, etc }

  timestamp       DateTime @default(now())

  @@map("audit_events")
  @@index([clientId])
  @@index([eventType])
  @@index([timestamp])
}

// ============================================================================
// USUÁRIOS DO SISTEMA
// ============================================================================

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String
  role            String   // "admin", "gestor_trafego", "cs", etc
  passwordHash    String

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("users")
}
```

---

## Plano de Implementação Detalhado

### **Semana 1: Fundação**

**Objetivo:** Setup inicial do projeto + banco de dados

**Tarefas:**
1. Criar monorepo com Turborepo
2. Configurar Next.js (frontend) e Fastify (backend)
3. Configurar PostgreSQL + Prisma
4. Configurar Redis local (Docker Compose)
5. Criar schema do banco completo
6. Setup de autenticação JWT
7. Criar primeiro endpoint: `POST /api/auth/login`

**Entregável:** Sistema rodando localmente com login funcional

---

### **Semana 2: BPMN Engine Core**

**Objetivo:** Engine capaz de ler e executar processos BPMN

**Tarefas:**
1. Criar `BPMNParser` que lê arquivos `*-v5-data.js`
2. Criar `BPMNExecutor` que executa tasks sequencialmente
3. Implementar máquina de estados (pending → running → completed)
4. Criar scheduler para processos recorrentes (5.1 diário)
5. Integrar com `QueueManager` (módulo já criado)
6. Criar endpoints:
   - `POST /api/processes/start` - Inicia processo
   - `GET /api/processes/:id` - Status do processo
   - `POST /api/processes/:id/tasks/:taskId/complete` - Completa task

**Entregável:** Engine funcional que executa processos simples

---

### **Semana 3: Integração Meta Ads API**

**Objetivo:** Conectar sistema com Meta Ads para coletar dados reais

**Tarefas:**
1. Setup Meta App e obter credenciais
2. Implementar `MetaAdsService`:
   - `getCampaigns()`
   - `getCampaignInsights()`
   - `updateBudget()`
   - `updateBidStrategy()`
3. Criar job diário que sincroniza dados
4. Salvar métricas na tabela `metrics`
5. Criar endpoints:
   - `GET /api/integrations/meta/campaigns`
   - `GET /api/integrations/meta/insights`

**Entregável:** Sistema coletando dados reais do Meta Ads dos 2 clientes

---

### **Semana 4: Processo 5.1 (Monitoramento)**

**Objetivo:** Primeiro processo funcional end-to-end

**Tarefas:**
1. Implementar todas as 29 tasks do processo 5.1
2. Criar alertas automáticos (orçamento esgotado, ROAS baixo)
3. Integrar com `SystemMonitor` (módulo já criado)
4. Criar dashboard básico no frontend
5. Implementar notificações (email/Slack)

**Entregável:** Processo 5.1 rodando diariamente e gerando alertas

---

### **Semana 5: Frontend Dashboard**

**Objetivo:** Interface visual para acompanhar processos

**Tarefas:**
1. Dashboard principal:
   - Health score do sistema
   - Processos ativos
   - Tarefas pendentes
   - Métricas dos clientes (ROAS, CPA, etc)
2. Tela de processos:
   - Visualização BPMN com bpmn-js
   - Status de cada task
   - Timeline de execução
3. Tela de tarefas:
   - Fila de tarefas pendentes
   - Atribuir tasks a usuários
   - Marcar como concluída
4. Gráficos com Recharts

**Entregável:** Dashboard funcional e visualmente profissional

---

### **Semana 6: Processo 5.2 (Otimização)**

**Objetivo:** Segundo processo - otimização de campanhas

**Tarefas:**
1. Implementar 34 tasks do processo 5.2
2. Criar algoritmo de otimização:
   - Análise de tendências (últimos 7 dias)
   - Sugestões de ajuste de budget
   - Sugestões de pausa de campanhas ruins
3. Integrar com Meta Ads para aplicar mudanças
4. Criar aprovação manual antes de aplicar
5. Integrar com `LockManager` (evitar conflitos)

**Entregável:** Sistema otimizando campanhas automaticamente

---

### **Semana 7: Processo 6.2 (Apresentação de Resultados)**

**Objetivo:** Relatórios automáticos para clientes

**Tarefas:**
1. Implementar 35 tasks do processo 6.2
2. Criar gerador de relatórios (PDF ou web)
3. Storytelling com IA (OpenAI GPT-4):
   - Análise de performance
   - Insights e recomendações
   - Próximos passos
4. Agendar envio automático (mensal)
5. Portal do cliente (acesso externo)

**Entregável:** Relatórios mensais gerados automaticamente

---

### **Semana 8: Processos 2.1 (Onboarding) e 7.1 (Billing)**

**Objetivo:** Onboarding de novos clientes + faturamento

**Tarefas:**
1. Implementar processo 2.1 (32 tasks)
2. Workflow de aprovações do cliente
3. Implementar processo 7.1 (35 tasks)
4. Integração com sistema de faturamento
5. Notificações de cobrança

**Entregável:** Novos clientes podem ser onboarded pelo sistema

---

### **Semana 9-10: Infraestrutura e Refinamentos**

**Objetivo:** Deploy em produção + polimento

**Tarefas:**
1. Integrar todos os 6 módulos de infraestrutura:
   - QueueManager
   - CapacityManager
   - LockManager
   - AuditTrailManager
   - SystemMonitor
   - VersionManager
2. Setup de CI/CD (GitHub Actions)
3. Deploy em produção:
   - Frontend: Vercel
   - Backend: Railway/Render
   - DB: Railway PostgreSQL
   - Redis: Upstash
4. Configurar monitoramento (Sentry)
5. Documentação
6. Testes com os 2 clientes reais

**Entregável:** Sistema em produção com 5 processos funcionais

---

## Próximos 24 Horas - Quick Start

### O Que Fazer Agora:

**1. Setup do Ambiente (2h)**
```bash
# Criar estrutura do projeto
mkdir bpmn-system
cd bpmn-system
npm init -y

# Instalar Turborepo
npx create-turbo@latest

# Criar apps
cd apps
npx create-next-app@latest web --typescript --tailwind --app
mkdir api && cd api && npm init -y
```

**2. Docker Compose para PostgreSQL + Redis (30min)**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: bpmn
      POSTGRES_PASSWORD: dev123
      POSTGRES_DB: bpmn_system
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**3. Configurar Prisma (1h)**
```bash
cd apps/api
npm install prisma @prisma/client
npx prisma init
# Copiar schema que forneci acima para schema.prisma
npx prisma migrate dev --name init
```

**4. Criar Backend Básico (2h)**
```typescript
// apps/api/src/server.ts
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date() };
});

fastify.post('/api/clients', async (request, reply) => {
  const client = await prisma.client.create({
    data: request.body
  });
  return client;
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001 });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

**5. Criar Dashboard Inicial (2h)**
```tsx
// apps/web/app/dashboard/page.tsx
export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">BPMN Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl">Processos Ativos</h2>
          <p className="text-4xl font-bold mt-4">0</p>
        </div>
        <div className="border rounded-lg p-6">
          <h2 className="text-xl">Tarefas Pendentes</h2>
          <p className="text-4xl font-bold mt-4">0</p>
        </div>
        <div className="border rounded-lg p-6">
          <h2 className="text-xl">Clientes Ativos</h2>
          <p className="text-4xl font-bold mt-4">2</p>
        </div>
      </div>
    </div>
  );
}
```

---

## Comandos Úteis

```bash
# Instalar dependências
npm install fastify @fastify/cors @fastify/jwt
npm install prisma @prisma/client
npm install zod
npm install redis

# Frontend
npm install @tanstack/react-query zustand
npm install recharts bpmn-js

# Meta Ads
npm install facebook-nodejs-business-sdk

# Desenvolvimento
npm run dev          # Roda tudo
npm run db:migrate   # Roda migrations
npm run db:studio    # Abre Prisma Studio
```

---

## Métricas de Sucesso

**Semana 4:**
- ✅ Processo 5.1 rodando diariamente
- ✅ Dados reais do Meta Ads sendo coletados
- ✅ Alertas sendo gerados

**Semana 8:**
- ✅ 5 processos funcionais (5.1, 5.2, 6.2, 2.1, 7.1)
- ✅ Dashboard completo
- ✅ 2 clientes sendo gerenciados pelo sistema

**Semana 10:**
- ✅ Sistema em produção
- ✅ Todos os módulos de infraestrutura integrados
- ✅ Próximos 3 processos planejados

---

## Próximos Passos

1. **Confirmar stack tecnológica** - Você concorda com Next.js + Fastify + PostgreSQL?
2. **Setup inicial** - Quer que eu crie os arquivos de configuração base?
3. **Priorização** - Processos 5.1 → 5.2 → 6.2 → 2.1 → 7.1 faz sentido?

Pronto para começar? 🚀
