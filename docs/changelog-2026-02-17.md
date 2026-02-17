# Changelog — 2026-02-17 (Hub backend)

## Principais entregas

### Auditoria operacional (API)
- Endpoint de trilha de eventos: `GET /api/optimization/audit`
- Endpoint de resumo: `GET /api/optimization/audit/summary`
- Filtros adicionados: `clientId`, `action`, `eventType`, `sinceHours`, `limit`
- Compatibilidade com schema real de `audit_events`

### Robustez das rotas de otimização
- Contratos de resposta padronizados (`TASK_UPDATED`, `RULE_SIMULATED`, `RULE_EXECUTED`)
- Validação defensiva com `safeParse`
- Payloads de erro consistentes (`code`, `error`, `details`)
- Suporte expandido de status (`in_progress`, `failed`)
- Tratamento de cliente inexistente (`CLIENT_NOT_FOUND`) para evitar erro de FK/500

### Operação
- Checklist de release local criado (`docs/release-local-checklist.md`)
- Playbook de incidentes criado (`docs/incident-playbook.md`)
- Backlog da próxima rodada criado (`docs/backlog-next-round.md`)
- Script de smoke local criado (`scripts/smoke-local.ps1`)

## Commits de referência
- `53d959a` feat(api): support sinceHours filter on optimization audit endpoints
- `3e8a2d9` feat(api): add optimization audit summary endpoint
- `d52ef77` feat(api): allow action/eventType filtering on optimization audit endpoint
- `84b67c6` feat(api): add optimization audit endpoint and enrich audit context
- `f106109` feat(api): make optimization audit compatible with current audit_events schema
- `11079fd` feat(api): harden optimization routes with client checks and audit logs
- `f178387` feat(api): add safer validation flow for optimization routes
- `5a3f6b8` feat(api): expand task status handling and standardize optimization error payloads
- `2563e14` feat(api): standardize optimization route responses for tasks and run-rule
- `a628013` docs(ops): add local release checklist, incident playbook and next-round backlog
- `0b474c9` chore(ops): add local smoke test script for critical routes
