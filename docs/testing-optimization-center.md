# Teste — Centro de Otimização + Copy Lab

Este passo-a-passo valida o **Centro de Otimização** (playbook + regras por tema) e o **Copy Lab** (sugestões de copy por snapshot) no dashboard.

## 1) Subir infraestrutura (Postgres/Redis)

No diretório raiz:

```bash
docker compose up -d
```

## 2) Garantir migração do Copy Lab (apenas 1x)

Aplicar a migration `019` no Postgres:

```bash
psql -h localhost -p 5433 -U bpmn -d bpmn_system -f backend/src/database/migrations/019_create_creative_copy_insights.sql
```

## 2.1) (Opcional) Garantir migração de budgets de AdSets (ABO)

Se a conta usa **ABO** (budget no adset), aplique também a migration `020`:

```bash
psql -h localhost -p 5433 -U bpmn -d bpmn_system -f backend/src/database/migrations/020_create_adsets.sql
```

## 3) Seed de dados mock (inclui criativos)

No backend:

```bash
cd backend
npm run seed:mock
```

## 4) Rodar backend e frontend

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

## 5) Validar no dashboard

1. Acesse `http://localhost:3000/clients`
2. Abra um cliente e depois `Performance`
3. Procure a seção **Centro de Otimização**
4. Valide:
   - Tema detectado (ex.: Trabalhista / Passageiro Aéreo / Salário Maternidade)
   - Targets do tema (CPL bom/ok/ruim, qualificação mínima, etc.)
   - Lista de alertas/ações (refresh/pause/scale/track)
   - Botão para ver o JSON completo do playbook
5. No bloco **Sugestões de Copy (IA)**:
   - Selecione um criativo (winner/fadiga/loser) e clique em **Gerar sugestões**
   - Mesmo sem `OPENAI_API_KEY` (ou com quota indisponível), o sistema devolve fallback com sugestões.

## 6) Validar via API (opcional)

Playbook:

```bash
curl "http://localhost:<PORT>/api/playbooks/optimization-center"
```

Centro de otimização por cliente:

```bash
curl "http://localhost:<PORT>/api/clients/<clientId>/optimization-center?period=30d"
```

Copy insights:

```bash
curl "http://localhost:<PORT>/api/creative-snapshots/<snapshotId>/copy-insights"
curl -X POST "http://localhost:<PORT>/api/creative-snapshots/<snapshotId>/copy-insights" -H "Content-Type: application/json" --data "{\"force\":true}"
```
