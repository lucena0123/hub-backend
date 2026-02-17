# Incident Playbook (rápido)

## Severidade
- **P1**: sistema indisponível (API/Frontend fora)
- **P2**: funcionalidade crítica degradada
- **P3**: erro parcial com workaround

## Fluxo padrão (10-15 min)
1. Confirmar impacto (quem/onde/desde quando)
2. Capturar evidência (logs + endpoint + tela)
3. Aplicar contenção
4. Validar recuperação
5. Registrar causa e prevenção

---

## Cenário A — API fora
### Sintoma
- `GET /health` falha

### Ações
1. Verificar processo backend (`npm run dev`/logs)
2. Validar conexão DB (`ECONNREFUSED 5433`)
3. Subir infra (`docker compose up -d`)
4. Revalidar `GET /health`

### Escalação
- Se não recuperar em 15 min: abrir P1 e congelar deploys locais

---

## Cenário B — Banco indisponível
### Sintoma
- Erros Prisma/PG, `ECONNREFUSED` ou timeout

### Ações
1. Checar container Postgres/porta 5433
2. Verificar credenciais em `.env`
3. Validar migrações (`prisma migrate`)
4. Se necessário, restaurar backup mais recente

---

## Cenário C — Frontend quebra após mudança de contrato
### Sintoma
- Board/performance com erro de parsing ou tela em branco

### Ações
1. Inspecionar payload real de API
2. Ajustar contrato/tipos ou fallback defensivo
3. Validar páginas críticas via smoke
4. Registrar caso no changelog técnico

---

## Pós-incidente (obrigatório)
- Resumo: causa raiz + correção + prevenção
- Item no backlog para evitar recorrência
- Atualizar docs/checklist se o playbook mudou
