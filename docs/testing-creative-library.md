# Teste — Biblioteca de Criativos (Etapa 6)

Este passo-a-passo serve para validar a **Biblioteca de Criativos** (agrupada por snapshot) no dashboard, mesmo sem depender do sync real da Meta.

## 1) Subir infraestrutura (Postgres/Redis)

No diretório raiz:

```bash
docker compose up -d
```

## 2) Seed de dados mock (inclui criativos)

No backend:

```bash
cd backend
npm run seed:mock
```

Isso cria campanhas/métricas e também popula:
- `ad_creative_snapshots`
- `ad_creative_metrics`
- `adset_metrics`

## 3) Rodar backend e frontend

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

## 4) Validar no dashboard

1. Acesse `http://localhost:3000/clients`
2. Abra um cliente e depois `Performance`
3. Procure o card **Biblioteca de Criativos**

O card deve mostrar:
- status (winner/fadiga/loser/neutro)
- deltas **7d vs 7d**
- insights de **CTAs** e **Títulos**

## 5) Validar via API (opcional)

Com um `clientId`, teste:

```bash
curl "http://localhost:<PORT>/api/clients/<clientId>/creative-library?period=30d"
```

Para escopo por campanha:

```bash
curl "http://localhost:<PORT>/api/clients/<clientId>/creative-library?period=30d&campaignId=<campaignId>"
```
