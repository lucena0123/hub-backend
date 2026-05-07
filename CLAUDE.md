# Hub - Sistema de Automacao B2B

> Contexto operacional para agentes de IA trabalhando neste repositorio.

## Raiz Do Projeto

- Raiz oficial: `E:\hub-backend`
- Backend: `backend/`
- Frontend: `frontend/`
- O frontend e um submodulo Git separado. Sempre confira o estado dos dois repositorios antes de alterar arquivos:

```powershell
git status --short --branch
git -C frontend status --short --branch
```

## Stack

- Backend: Node.js 20+, TypeScript strict, Fastify, Prisma, PostgreSQL, Redis e BullMQ.
- Frontend: Next.js App Router, React, TypeScript, TailwindCSS, shadcn/ui, Recharts e Zustand.
- Testes backend: Vitest.
- Banco local e Redis: `docker-compose.yml` na raiz.

## Regras De Trabalho

- Preserve mudancas locais existentes. Nunca reverta alteracoes do usuario sem pedido explicito.
- Nao leia, copie, imprima ou resuma valores de `.env`.
- Trate `frontend/` como repositorio separado: commits do frontend acontecem dentro de `frontend/`; o ponteiro do submodulo so deve ser atualizado depois.
- Nao adicione logs, screenshots, backups ou diretorios temporarios na raiz do repositorio.
- Prefira mudancas pequenas, com verificacao apos cada etapa.
- Nao altere contratos publicos de API sem teste de compatibilidade.

## Arquitetura Esperada

### Backend

- Rotas Fastify devem ficar finas: validam entrada, chamam services/use-cases e formatam resposta HTTP.
- Regras de negocio ficam em services ou modulos de dominio.
- Acesso a dados deve ter fronteira clara: Prisma para entidades modeladas; `pg` direto apenas quando houver motivo operacional ou query especifica.
- Composicao da aplicacao deve ficar separada de registro de rotas e criacao de services.

Dominios principais:

- `commercial`
- `analytics`
- `meta-sync`
- `meta-governance`
- `optimization`
- `finance`
- `projects`
- `customer-success`

### Frontend

- Rotas em `app/` devem ser composicoes finas.
- Codigo de dominio deve viver em `features/`.
- Componentes reutilizaveis devem ficar em `components/`.
- Chamadas HTTP devem ficar em `lib/api/client`.
- Formatters, mappers e tipos devem ficar fora de componentes grandes.

## Comandos De Verificacao

Backend:

```powershell
cd E:\hub-backend\backend
npm test
npm run build
```

Frontend:

```powershell
cd E:\hub-backend\frontend
npm run lint
npm run build
```

Infra local:

```powershell
cd E:\hub-backend
docker compose up -d
```

## Refactor Priorities

1. Manter higiene da raiz e do submodulo.
2. Separar composicao backend em registro de rotas e grupos de services.
3. Reduzir arquivos grandes com testes de caracterizacao antes de extrair comportamento.
4. Modularizar frontend por feature sem alterar rotas do App Router.
5. Documentar qualquer decisao sobre Prisma vs `pg` antes de padronizar acesso a dados.
