# Teste — Confiabilidade do Dashboard (Meta / Performance)

Este passo-a-passo valida os pontos que mais afetam **confiança** no dashboard:

- **Campanha default** (não cair em campanha sem entrega no período)
- **Ordenação determinística** das campanhas no summary
- **Empty-states** claros quando não há entrega (campanha/período)
- **CPL consistente** para campanhas de Mensagens (custo por contato)
- **Status** (excellent/good/fair/poor) levando em conta CPL/CTR
- Operações básicas (ex.: **deletar cliente** sem “Network Error”)

## 1) Subir infraestrutura (Postgres/Redis)

No diretório raiz:

```bash
docker compose up -d
```

## 2) Rodar backend e frontend

Backend (porta definida em `backend/.env` via `PORT`; padrão `3001`, mas no nosso setup pode ser `3003`):

```bash
cd backend
npm run dev
```

Frontend (porta `3000` por padrão):

```bash
cd frontend
npm run dev
```

## 3) Dados de teste

Escolha um dos caminhos:

### A) Mock/Seed (não depende da Meta)

No backend:

```bash
cd backend
npm run seed:mock
```

### B) Sync real da Meta (recomendado para validar “Mensagens”)

Pré-requisitos:
- `META_ACCESS_TOKEN` configurado no `backend/.env`
- Cliente com `metaAdAccountId` preenchido (ex.: via tela **Editar Cliente**)

Opcional (via API):

```bash
curl -X POST "http://localhost:<PORT>/api/metrics/sync/meta" \
  -H "Content-Type: application/json" \
  --data '{"syncLevel":"full","async":true,"clientId":"<clientId>"}'
```

## 4) Validar via API (sanity checks)

Health:

```bash
curl "http://localhost:<PORT>/health"
```

Campanhas + ordem + métricas agregadas:

```bash
curl "http://localhost:<PORT>/api/clients/<clientId>/performance-summary?period=30d"
```

Esperado:
- `campaigns[0]` é a campanha com **maior entrega** no período (spend/conversas/impressões).
- Para campanhas de **Mensagens** com `totalLeads=0` e `totalMessagingConversations>0`, o `avgCpl` **não** deve ficar 0 (deve bater com `totalSpend/totalMessagingConversations`).
- `status` não deve ficar sempre `poor` quando `avgCtr` e `avgCpl` estão dentro do esperado.

Histórico de sync (se usando Meta):

```bash
curl "http://localhost:<PORT>/api/metrics/sync/history?platform=meta&accountId=<metaAdAccountId>&limit=5"
```

## 5) Validar no dashboard (UI)

1. Acesse `http://localhost:3000/clients`
2. Abra um cliente e depois `Performance`

### 5.1 Default de campanha (sem tela “zerada”)

Esperado ao abrir:
- A campanha selecionada por padrão tem entrega no período **e os cards aparecem preenchidos**.

### 5.2 Trocar para uma campanha sem entrega (empty-states)

No seletor de campanha, escolha uma campanha sem entrega no período (ex.: seed/antiga).

Esperado:
- Cards mostram mensagens do tipo **“Sem dados para a campanha X no período Y”**
- O usuário entende que é **escopo/período/campanha** (não “bug silencioso”).

Cards cobertos:
- Tendência (gráfico)
- Lead Gen
- Health
- Ad Sets
- Ads/Criativos
- Demografia/Posicionamentos
- Temporal (Período e Última semana)
- Métricas de Negócio

### 5.3 CPL em campanhas de Mensagens

Esperado:
- “CPL” exibido no dashboard (Lead Gen / gráficos / Library) reflete **custo por contato** (ex.: conversas) quando não há leads.

## 6) Regressão — Deletar cliente sem “Network Error”

Crie um cliente de teste (via UI ou API) e delete em seguida.

Via API:

```bash
curl -X POST "http://localhost:<PORT>/api/clients" \
  -H "Content-Type: application/json" \
  --data '{"name":"Temp QA","email":"temp.qa@local.test","tier":"basic","status":"inactive","budget":0,"contractStart":"2026-01-01"}'
```

Depois delete pelo `id` retornado:

```bash
curl -X DELETE "http://localhost:<PORT>/api/clients/<tempClientId>"
```

Esperado:
- A UI não exibe “Network Error” ao deletar (CORS/métodos OK).

