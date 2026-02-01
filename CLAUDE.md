# Hub - Sistema de Automacao B2B (Marketing & Vendas)

## Visao Geral

Plataforma de automacao de vendas e marketing B2B baseada em processos BPMN. Gerencia o ciclo completo: geracao de leads, funil de vendas, onboarding, planejamento de campanha, execucao, otimizacao continua, customer success e gestao financeira.

**24 subprocessos** organizados em **8 niveis hierarquicos** (0-7), com **558 tasks** mapeadas.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), TailwindCSS, shadcn/ui, Recharts |
| Backend | Node.js 20+, Fastify, TypeScript, Zod |
| Banco | PostgreSQL 16 (dados), Redis 7 (cache/locks/sessions) |
| Integracoes | Meta Ads API, Google Ads API, GA4 |
| Deploy | Docker, Vercel (frontend), Railway (backend) |

## Estrutura do Projeto

```
Hub/
  backend/                    # API Fastify (TypeScript)
    src/
      config/                 # Configuracao (database, env, redis)
      database/migrations/    # SQL migrations (001-014)
      middleware/              # Auth, CORS, request handling
      plugins/                # Fastify plugins e service init
      routes/                 # Route handlers (14 modulos)
      services/               # Logica de negocio
      types/                  # TypeScript types + Fastify declarations
      utils/                  # Utilidades compartilhadas
      validators/             # Zod schemas
      server-pg.ts            # Entry point do servidor
  frontend/                   # Next.js (submodule -> hub-frontend)
    app/
      clients/                # Gestao de clientes
      alerts/                 # Sistema de alertas
      processes/              # Visualizador BPMN
    components/
      dashboard/              # Dashboard widgets
      performance/            # Tabelas e graficos de performance
      reports/                # Geracao de relatorios
      ui/                     # shadcn components
  processos/                  # Arquivos BPMN (HTML + JS data)
  docs/                       # Documentacao detalhada
    architecture.md           # Arquitetura completa dos 24 processos
    infrastructure.md         # Orquestracao tecnica (filas, locks, audit)
    implementation-plan.md    # Roadmap de implementacao
```

## Convencoes

- **Rotas**: `*.routes.ts` no padrao Fastify plugin
- **Services**: Logica de negocio isolada do HTTP layer
- **Validacao**: Zod schemas em `validators/`
- **Banco**: Migrations SQL sequenciais (001, 002, ...)
- **Frontend**: Submodule separado (`hub-frontend`, branch `codex-work`)
- **Backend**: Branch principal `claude-work`

## Niveis de Processo (Resumo)

| Nivel | Nome | Processos | Tipo |
|-------|------|-----------|------|
| 0 | Pre-SDR | 0.1 | Sequencial |
| 1 | Funil de Vendas | 1.1, 1.2, 1.3 | Sequencial |
| 2 | Onboarding & Estrategia | 2.1, 2.2, 2.3 | Fork |
| 3 | Planejamento Campanha | 3.1, 3.2, 3.3, 3.4 | Paralelo |
| 4 | Execucao | 4.1, 4.2, 4.3 | Join |
| 5 | Otimizacao | 5.1, 5.2, 5.3 | Loop continuo |
| 6 | Customer Success | 6.1, 6.2, 6.3, 6.4 | Paralelo |
| 7 | Gestao Financeira | 7.1, 7.2, 7.3 | Paralelo |

## Documentacao Detalhada

- [docs/architecture.md](docs/architecture.md) - Processos, fluxos, dependencias e dados compartilhados
- [docs/infrastructure.md](docs/infrastructure.md) - Orquestracao (filas, capacidade, locks, audit, monitoring, versioning)
- [docs/implementation-plan.md](docs/implementation-plan.md) - Roadmap semanal, schema do banco, stack detalhada
