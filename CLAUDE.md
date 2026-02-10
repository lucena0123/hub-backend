# Hub - Sistema de Automação B2B (Marketing & Vendas)

> **Contexto Oficial para IA (Claude/Gemini/Copilot)**
> Última Auditoria: 08/02/2026

## 1. Estado Atual do Sistema
**Status Geral:** ~75% Funcional (Backend Avançado / Frontend Estável)
**Ambiente:** Desenvolvimento Local (Docker Compose)

### Módulos Críticos Auditados
| Módulo | Status | Detalhes Técnicos |
| :--- | :--- | :--- |
| **Backend Core** | ✅ Estável | Fastify 5.2, 21 Rotas, 35+ Services. Modular e Tipado. |
| **Optimization Center** | ✅ Novo | Engine de regras completo (`metrics/optimization-playbook`). Suporte a Temas. |
| **Creative Linter** | ✅ Novo | IA de validação de copy (`creative-linter.ts`). Score 0-100. |
| **Meta Sync** | ✅ Produção | Sincroniza Campanhas/AdSets/Ads/Insights. Graph API v20. |
| **BPMN Engine** | ⚠️ Parcial | Estrutura de dados v5 pronta, execução visual manual. Falta runner automático. |
| **Automação** | ✅ Novo | `auto-approval-service.ts` e Workflows de ação (`action_workflow`). |

## 2. Tech Stack & Decisões
- **Runtime:** Node.js 20+ (Backend), React 19 / Next.js 16.1 (Frontend)
- **Frameworks:** Fastify (API), Next.js App Router (UI), Prisma (ORM)
- **Banco de Dados:** PostgreSQL 16 (28 Migrations), Redis 7 (Cache/Queue)
- **Linguagem:** TypeScript 5.x (Strict mode)
- **Design System:** TailwindCSS 4, shadcn/ui, Recharts
- **Integrações:** Meta Ads Graph API v20, Puppeteer (Relatórios)

## 3. Arquitetura de Diretórios
```
Hub/
├── backend/                  # API Fastify
│   ├── src/
│   │   ├── services/         # Lógica de Negócio (Optimization, Sync, Dashboard)
│   │   ├── routes/           # 21 Arquivos de Rota (Separation of Concerns)
│   │   └── plugins/          # Fastify Plugins (Services, Auth)
│   ├── prisma/               # Prisma Schema + Migrations + Seed
├── frontend/                 # Next.js App (Submódulo)
│   ├── app/                  # Pages: clients, performance, alerts, reports
│   └── components/           # UI: dashboard, charts, forms
└── docs/                     # Documentação de Referência
    ├── architecture.md       # Regras de Negócio BPMN
    ├── infrastructure.md     # Design Técnico (Queue, Lock, Audit)
    ├── playbook.md           # Regras do Optimization Center
    └── testing.md            # Guia de Testes & QA
```

## 4. Banco de Dados (Schema Crítico)
Tabelas Chave (Total 28 migrations):
- **Core:** `clients`, `users`, `campaigns`
- **Analytics:** `campaign_metrics`, `adset_metrics`, `ad_creative_metrics`
- **Optimization:** `action_workflow`, `auto_approval_history`, `anomaly_detections`
- **Creative:** `ad_creative_snapshots`, `creative_copy_insights`

## 5. Comandos de Desenvolvimento
```bash
# Backend
cd backend
npm run dev          # Porta 3001 (ou env PORT)
npm run seed:mock    # Popula dados fake para testes
npx prisma migrate dev # Aplica migrations pendentes

# Frontend
cd frontend
npm run dev          # Porta 3000

# Infra
docker compose up -d # Sobe Postgres e Redis
```

## 6. Convenções de Código
- **Services:** Singleton pattern via Plug-in de injeção (`req.services.nome`).
- **Commits:** Semantic Commits (feat, fix, docs, chore).
- **Datas:** ISO 8601 UTC no Backend, formatado local no Frontend.
- **Validação:** Zod para tudo (Input API, Configs, Env).

## 7. Roadmap & Backlog (Linear)
O roadmap futuro é gerenciado no **Linear**.
Projeto: [Hub - Infrastructure & Scale](https://linear.app/lucena0123/project/hub-infrastructure-and-scale-weeks-7-10-6c22e70bbe95)

Principais Épicos:
- **LUC-55:** Relatórios & Storytelling IA
- **LUC-56:** Financeiro (Onboarding & Faturamento)
- **LUC-57:** Infraestrutura de Produção

