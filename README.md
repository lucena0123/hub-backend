# Hub - Sistema de Automacao B2B (Marketing & Vendas)
![Node.js](https://img.shields.io/badge/node-20%2B-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5-3178C6?logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/fastify-5-black?logo=fastify&logoColor=white)
![Next.js](https://img.shields.io/badge/next.js-16-black?logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-7-DC382D?logo=redis&logoColor=white)
![Prisma](https://img.shields.io/badge/prisma-6-2D3748?logo=prisma&logoColor=white)

Plataforma de automacao para operacoes de marketing e vendas B2B com foco em performance, governanca e operacao orientada a dados. O sistema integra coleta de metricas, playbooks de otimizacao, monitoramento e geracao de relatorios com backend robusto e frontend moderno.

Hoje o produto e mais forte em `Clientes`, `Comercial`, `Performance`, `Otimizacao`, `Relatorios` e `Processos`. A evolucao planejada para virar um sistema completo de agencia inclui `Financeiro`, `Gestao de Entregas/Projetos` e `CS/Onboarding/Retencao`.

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
- Pipeline comercial e operacao de leads
- Gestao de clientes, contas e processos operacionais

## Mapa do produto
- Estado atual do produto: `docs/product-relevance-map.md`
- Blueprint BPMN e arquitetura operacional: `docs/architecture.md`

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

## Arquitetura
- **API**: Fastify com camadas de servicos e validacao tipada.
- **Dados**: PostgreSQL via Prisma, com analytics em tabelas de metrics.
- **Cache e filas**: Redis e BullMQ para tarefas e agendamentos.
- **IA**: Camada de prompts e telemetria para outputs e cache.

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
- Relevancia e evolucao do produto: `docs/product-relevance-map.md`

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

## Roadmap
O planejamento e backlog sao acompanhados no Linear.

## Contribuicao
Este repositorio e de uso interno. Padrao de commits semanticos e validacao de PRs quando aplicavel.

## Licenca
Privado. Uso interno.
