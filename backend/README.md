# BPMN System - Backend API

Backend API construída com Fastify + TypeScript + Prisma + PostgreSQL

## 🚀 Quick Start

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar .env e adicionar credenciais
```

### 3. Subir banco de dados (Docker)

```bash
# Voltar para raiz do projeto
cd ..

# Subir PostgreSQL e Redis
docker-compose up -d

# Verificar se está rodando
docker-compose ps
```

### 4. Rodar migrations do Prisma

```bash
cd backend

# Gerar Prisma Client
npm run prisma:generate

# Criar tabelas no banco
npm run prisma:migrate

# Popular com dados iniciais (seed)
npm run prisma:seed
```

### 5. Iniciar servidor

```bash
npm run dev
```

O servidor estará rodando em: **http://localhost:3001**

## 📁 Estrutura do Projeto

```
backend/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   ├── seed.ts            # Dados iniciais
│   └── migrations/        # Migrations (gerado)
├── src/
│   ├── server.ts          # Servidor principal
│   ├── api/               # Rotas HTTP (futuro)
│   ├── engine/            # BPMN Engine (futuro)
│   ├── infrastructure/    # Módulos já criados (futuro)
│   ├── integrations/      # APIs externas (futuro)
│   └── services/          # Lógica de negócio (futuro)
├── package.json
├── tsconfig.json
└── .env
```

## 🔌 Endpoints Disponíveis

### Health Check

```bash
GET /health
```

Retorna status dos serviços (database, redis)

### Dashboard Stats

```bash
GET /api/dashboard/stats
```

Retorna estatísticas gerais:
- Total de clientes
- Clientes ativos
- Processos rodando
- Tarefas pendentes
- Tarefas completadas hoje

### Clients

```bash
# Listar todos
GET /api/clients

# Buscar por ID
GET /api/clients/:id

# Criar novo
POST /api/clients
Body: {
  "name": "Cliente X",
  "email": "contato@clientex.com",
  "tier": "premium",
  "status": "active",
  "contractStart": "2024-01-01",
  "budget": 10000
}
```

### Processes

```bash
# Listar todos
GET /api/processes

# Buscar por ID (com tasks)
GET /api/processes/:id
```

### Tasks

```bash
# Listar todas
GET /api/tasks

# Filtrar por status
GET /api/tasks?status=pending
GET /api/tasks?status=in_progress
GET /api/tasks?status=completed
```

## 🧪 Testando a API

### Usando curl:

```bash
# Health Check
curl http://localhost:3001/health

# Listar clientes
curl http://localhost:3001/api/clients

# Dashboard stats
curl http://localhost:3001/api/dashboard/stats

# Criar cliente
curl -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Novo Cliente",
    "email": "novo@cliente.com",
    "tier": "standard",
    "status": "active",
    "contractStart": "2024-12-01",
    "budget": 5000
  }'
```

### Usando Postman/Insomnia:

Importar collection em: `/docs/api-collection.json` (criar futuramente)

## 🗄️ Prisma Studio

Interface visual para o banco de dados:

```bash
npm run prisma:studio
```

Abre em: **http://localhost:5555**

## 🔐 Autenticação (Futuro)

O sistema usa JWT para autenticação. Credenciais após seed:

- **Admin**: admin@bpmnsystem.com / admin123
- **Tráfego**: trafego@bpmnsystem.com / user123
- **CS**: cs@bpmnsystem.com / user123

Endpoint de login (a implementar):

```bash
POST /api/auth/login
Body: {
  "email": "admin@bpmnsystem.com",
  "password": "admin123"
}
```

## 📊 Dados de Seed

Após rodar `npm run prisma:seed`, você terá:

- ✅ 3 usuários (admin, tráfego, cs)
- ✅ 2 clientes (Cliente A Corp, Cliente B Ltd)
- ✅ 3 campanhas
- ✅ 21 métricas (7 dias × 3 campanhas)
- ✅ 1 processo de exemplo (5.1 - Monitoramento)
- ✅ 3 tasks do processo
- ✅ 1 versão de processo

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Roda servidor em watch mode

# Produção
npm run build            # Compila TypeScript
npm start                # Roda servidor compilado

# Prisma
npm run prisma:generate  # Gera Prisma Client
npm run prisma:migrate   # Roda migrations
npm run prisma:studio    # Abre interface visual
npm run prisma:seed      # Popula banco com dados iniciais
```

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Reiniciar
docker-compose restart postgres

# Ver logs
docker-compose logs postgres
```

### Erro: "Redis connection failed"

```bash
# Reiniciar Redis
docker-compose restart redis

# Verificar
docker-compose logs redis
```

### Erro: "Port 3001 already in use"

```bash
# Mudar porta no .env
PORT=3002

# Ou matar processo na porta
# Windows
netstat -ano | findstr :3001
taskkill /PID [PID] /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Reset completo do banco

```bash
# Parar servidor
# Apagar migrations
rm -rf prisma/migrations

# Resetar banco
npx prisma migrate reset

# Rodar migrations novamente
npm run prisma:migrate

# Popular
npm run prisma:seed
```

## 📈 Próximos Passos

1. **Semana 2:** Implementar BPMN Engine
2. **Semana 3:** Integração com Meta Ads API
3. **Semana 4:** Processo 5.1 completo
4. **Semana 5:** Autenticação JWT
5. **Semana 6:** Deploy em produção

Ver [PLANO-IMPLEMENTACAO-SISTEMA.md](../PLANO-IMPLEMENTACAO-SISTEMA.md) para mais detalhes.

## 📚 Documentação

- [Prisma Docs](https://www.prisma.io/docs)
- [Fastify Docs](https://www.fastify.io/docs/latest/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Suporte

Dúvidas? Abra uma issue ou consulte a documentação principal no diretório raiz do projeto.
