# Guia de Testes e QA

> **Protocolos Unificados de Teste**
> Abrange: Infraestrutura, Dashboard, Optimization Center e Creative Library.

---

## 1. Setup do Ambiente de Testes
Antes de iniciar qualquer bateria de testes, garanta que o ambiente local está configurado.

### 1.1 Infraestrutura
```bash
# Iniciar Banco de Dados e Redis
docker compose up -d

# Popular Dados de Teste (Mock Seeds)
cd backend
npm run seed:mock
```

### 1.2 Rodar Aplicação
```bash
# Backend (Porta 3001)
cd backend && npm run dev

# Frontend (Porta 3000)
cd frontend && npm run dev
```

---

## 2. Cenários de Teste

### 2.1 Confiabilidade do Dashboard (Performance)
**Objetivo:** Garantir que métricas e gráficos carreguem corretamente, mesmo com dados parciais.

| Cenário | Ação | Resultado Esperado |
| :--- | :--- | :--- |
| **Campanha Default** | Acessar `/clients/:id/performance` | A campanha com maior entrega deve vir selecionada. |
| **Sem Dados** | Selecionar período sem métricas | Exibir "Empty States" claros em todos os cards. |
| **Métrica CPL** | Verificar campanhas de Mensagem | CPL deve refletir Custo por Conversa corretamente. |
| **Deleção** | Deletar cliente de teste via UI | Sucesso imediato, sem erro de rede. |

### 2.2 Optimization Center & Playbook
**Objetivo:** Validar se as regras de otimização estão gerando propostas corretas.

**Validação Manual:**
1. Acesse a aba **Optimization Center** no dashboard do cliente.
2. Verifique se o **Tema** foi detectado corretamente (ex: "Trabalhista").
3. Confirme se os cards de métricas (CPL, Frequência) respeitam os limites do tema.
4. Teste o botão **"Gerar Sugestões"** no Copy Lab (deve retornar insights de IA ou fallback).

**Validação via API:**
```bash
# Verificar diagnósticos
curl "http://localhost:3001/api/clients/<ID>/optimization-center?period=30d"
```

### 2.3 Creative Library & Linter
**Objetivo:** Garantir que a análise de criativos e validação de copy funcionem.

**Passos:**
1. Navegue até a **Creative Library**.
2. Filtre por "Winners" (deve mostrar Top 20% performers).
3. Abra um criativo e verifique a aba **Copy Analysis**.
4. Insera um texto com termo proibido ("garantido") e verifique se o Linter bloqueia/alerta.

---

## 3. Testes Automatizados (Backend)
O projeto utiliza `vitest` (ou compatível) para testes de serviço.

```bash
# Rodar todos os testes
npm test

# Rodar testes específicos do Task Generator
npm test backend/src/services/optimization-playbook/task-generator.test.ts
```

## 4. Migrations Específicas para Teste
Caso precise resetar ou preparar o banco para recursos específicos:

```bash
# Creative Copy Insights (Linter Tables)
psql -f backend/src/database/migrations/019_create_creative_copy_insights.sql

# Weekly Summaries
psql -f backend/src/database/migrations/027_create_weekly_summaries.sql
```
