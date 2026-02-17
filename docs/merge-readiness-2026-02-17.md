# Merge Readiness — Hub (2026-02-17)

## Branch
- Atual: `claude-work`
- HEAD: `f844ac7`

## Estado
- Working tree limpo
- Push remoto atualizado
- Smoke local validado (incluindo auditoria autenticada)

## Entregas no pacote
- Robustez das rotas de optimization
- Auditoria operacional (`/audit`, `/audit/summary`, filtros, sinceHours)
- Compatibilidade com schema real de `audit_events`
- Documentação operacional (release checklist + incident playbook + backlog)
- Smoke script auth-aware

## Pós-merge (rápido)
1. Subir infra (`docker compose up -d`)
2. Backend/Frontend `npm run dev`
3. Rodar `powershell -ExecutionPolicy Bypass -File .\scripts\smoke-local.ps1`
4. Validar board e painel de auditoria na UI
