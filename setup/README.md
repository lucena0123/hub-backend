# BPMN System - Quick Start Guide

Sistema completo de automação baseado em arquitetura BPMN com 24 subprocessos.

## Pré-requisitos

- Node.js 20+
- Docker & Docker Compose
- Git

## Setup Inicial (15 minutos)

### 1. Criar estrutura do projeto

```bash
# Criar diretório raiz
mkdir bpmn-system
cd bpmn-system

# Copiar arquivos de configuração
cp /path/to/setup/package.json .
cp /path/to/setup/turbo.json .
cp /path/to/setup/docker-compose.yml .
cp /path/to/setup/.gitignore .
cp /path/to/setup/.env.example .env

# Instalar dependências
npm install
```

### 2. Criar apps (Frontend e Backend)

```bash
# Criar pasta apps
mkdir -p apps

# Frontend (Next.js)
cd apps
npx create-next-app@latest web --typescript --tailwind --app --no-eslint
cd ..

# Backend (Fastify)
mkdir -p apps/api/src
cd apps/api
npm init -y
```

### 3. Instalar dependências do backend

```bash
cd apps/api

# Core
npm install fastify @fastify/cors @fastify/jwt @fastify/helmet

# Database
npm install prisma @prisma/client
npm install -D prisma

# Validation & Utils
npm install zod dotenv

# Redis
npm install redis

# TypeScript
npm install -D typescript @types/node ts-node tsx
npx tsc --init
```

### 4. Configurar Prisma

```bash
# Ainda em apps/api
npx prisma init

# Copiar schema do PLANO-IMPLEMENTACAO-SISTEMA.md para:
# apps/api/prisma/schema.prisma
```

### 5. Subir banco de dados

```bash
# Voltar para raiz do projeto
cd ../..

# Subir PostgreSQL e Redis
docker-compose up -d

# Verificar se está rodando
docker-compose ps
```

### 6. Rodar migrations

```bash
# Criar banco e tabelas
npm run db:migrate

# Abrir Prisma Studio (interface visual do DB)
npm run db:studio
```

### 7. Criar servidor básico

Criar `apps/api/src/server.ts`:

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

// Plugins
fastify.register(cors, {
  origin: 'http://localhost:3000'
});

// Routes
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date(),
    database: 'connected'
  };
});

fastify.get('/api/clients', async () => {
  const clients = await prisma.client.findMany();
  return clients;
});

fastify.post('/api/clients', async (request, reply) => {
  const client = await prisma.client.create({
    data: request.body as any
  });
  return client;
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Backend running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

Adicionar script no `apps/api/package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### 8. Rodar o sistema

```bash
# Terminal 1 - Backend
cd apps/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev

# Acessar:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001/health
# Prisma Studio: http://localhost:5555 (se rodou db:studio)
```

## Estrutura do Projeto

```
bpmn-system/
├── apps/
│   ├── web/                # Frontend Next.js
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   └── api/                # Backend Fastify
│       ├── src/
│       │   ├── server.ts
│       │   ├── api/        # Routes
│       │   ├── engine/     # BPMN Engine
│       │   ├── infrastructure/
│       │   └── integrations/
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
├── packages/
│   ├── types/              # Tipos compartilhados
│   └── bpmn-definitions/   # Arquivos *-v5-data.js
├── docker-compose.yml
├── turbo.json
├── package.json
└── .env
```

## Próximos Passos

Após o setup inicial:

1. **Semana 1:** Implementar autenticação JWT
2. **Semana 2:** Criar BPMN Engine
3. **Semana 3:** Integrar Meta Ads API
4. **Semana 4:** Implementar processo 5.1 (Monitoramento)

Ver [PLANO-IMPLEMENTACAO-SISTEMA.md](../PLANO-IMPLEMENTACAO-SISTEMA.md) para detalhes completos.

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Roda tudo (turbo)
npm run build            # Build de produção
npm run lint             # Lint

# Banco de dados
npm run db:migrate       # Cria/atualiza tabelas
npm run db:studio        # Interface visual
npm run db:generate      # Gera Prisma Client

# Docker
docker-compose up -d     # Sobe banco
docker-compose down      # Para banco
docker-compose logs      # Ver logs
```

## Troubleshooting

### Erro de conexão com PostgreSQL
```bash
# Verificar se está rodando
docker-compose ps

# Reiniciar
docker-compose restart postgres
```

### Porta já em uso
```bash
# Mudar porta no docker-compose.yml
ports:
  - "5433:5432"  # Usar 5433 ao invés de 5432

# Atualizar DATABASE_URL no .env
DATABASE_URL="postgresql://bpmn:dev123@localhost:5433/bpmn_system"
```

### Prisma Client desatualizado
```bash
npm run db:generate
```

## Suporte

Ver documentação completa:
- [PLANO-IMPLEMENTACAO-SISTEMA.md](../PLANO-IMPLEMENTACAO-SISTEMA.md)
- [ARQUITETURA-SISTEMA.md](../ARQUITETURA-SISTEMA.md)
- [MAPA-CONEXOES.md](../MAPA-CONEXOES.md)
