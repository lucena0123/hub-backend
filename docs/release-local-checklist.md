# Release Local Checklist (Hub)

## 1) Pré-check
- [ ] `git pull` na branch alvo
- [ ] `.env` válido no backend e frontend (`NEXT_PUBLIC_API_URL`)
- [ ] Docker/WSL e serviços (Postgres/Redis) ativos

## 2) Infra
- [ ] `docker compose up -d`
- [ ] Validar portas: Postgres `5433`, Redis `6379`

## 3) Backend
- [ ] `cd backend && npm install`
- [ ] `npx prisma generate`
- [ ] `npx prisma migrate deploy` (ou `migrate dev` em dev)
- [ ] (Opcional) restore/seed conforme ambiente
- [ ] `npm run dev`
- [ ] Health check: `GET http://localhost:3001/health` = 200

## 4) Frontend
- [ ] `cd hub-frontend && npm install`
- [ ] `npm run dev`
- [ ] `GET http://localhost:3000/` = 200

## 5) Smoke obrigatório
- [ ] `/`
- [ ] `/login`
- [ ] `/performance`
- [ ] `/optimization/board`
- [ ] `/clients`
- [ ] `GET /api/optimization/audit?limit=5`
- [ ] `GET /api/optimization/audit/summary?sinceHours=24`

## 6) Critério de pronto
- [ ] Sem erro crítico no backend log
- [ ] Board carrega sem falha de contrato
- [ ] Auditoria retorna eventos e resumo
- [ ] Roteamento Telegram operacional (Geral/Projetos/Pessoal)
