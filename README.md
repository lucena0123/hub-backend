# Hub - Sistema de Automacao B2B (Marketing & Vendas)

Plataforma de automacao para operacoes de marketing e vendas B2B, com foco em performance, otimizacao baseada em dados e suporte a analise com IA. O projeto integra coleta de metricas, playbooks de otimizacao, monitoramento e geracao de relatorios, com backend robusto e frontend moderno.

## Visao geral
- **Backend**: API Fastify com servicos de negocio, processamento de tarefas e integracao com Meta Ads.
- **Frontend**: App Next.js (submodulo) para dashboards, performance e operacoes.
- **Dados**: PostgreSQL + Prisma, Redis para cache e filas (BullMQ).
- **IA**: Geracao de insights e conteudo (relatorios, copy, resumos) com telemetria e cache.

## Principais capacidades
- Otimizacao de campanhas e criativos via playbook (regras e scores)
- Insights de copy e compliance (creative linter)
- Relatorios semanais e mensais com resumo IA
- Detecao de anomalias e alertas
- Sincronizacao com Meta Ads (campanhas, adsets, ads, metrics)

## Estrutura do repositorio
```
Hub/
├── backend/                  # API Fastify
├── frontend/                 # Next.js App (submodulo)
└── docs/                     # Documentacao
```

## Stack
- **Runtime**: Node.js 20+
- **Backend**: Fastify 5, TypeScript
- **Frontend**: Next.js 16 (App Router), React 19
- **DB**: PostgreSQL 16, Prisma
- **Cache/Filas**: Redis 7, BullMQ
- **UI**: TailwindCSS 4, shadcn/ui, Recharts

## Setup rapido (dev)
Requisitos: Node.js 20+, Docker Desktop.

1. Subir banco e Redis
```bash
docker compose up -d
```

2. Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

3. Frontend (submodulo)
```bash
cd frontend
npm install
npm run dev
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:3000`

## Submodulo frontend
O frontend e mantido em repositorio separado e referenciado como submodulo. Para atualizar o ponteiro no repo principal:
```bash
git -C frontend pull
git add frontend
git commit -m "chore: update frontend submodule"
```

## Documentacao
- Playbook: `docs/playbook.md`
- Testes: `docs/testing.md`
- Prompts IA: `docs/ai-prompts.md`

## Comandos comuns
Backend:
- `npm run dev`
- `npm test`
- `npx prisma studio`

Frontend:
- `npm run dev`
- `npm run build`

## Observabilidade e IA
Execucoes de IA sao registradas na tabela `ai_outputs` com status, latencia, payload e hash de input, permitindo auditoria e cache de respostas recentes.

## Licenca
Privado. Uso interno.
