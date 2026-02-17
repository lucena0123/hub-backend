# Base 100% pronta para operacao (runbook rapido)

Este guia padroniza o ciclo de operacao local no Windows com servicos rodando no WSL (`Ubuntu`).

## Pre-requisitos

- Windows com WSL instalado.
- Distro `Ubuntu` disponivel no WSL.
- Docker e Docker Compose funcionando dentro do WSL.
- Dependencias de `backend` e `frontend` ja instaladas.

## 1) Subir stack

No root do repo (`projects/Hub`), execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stack-start.ps1
```

Opcoes uteis:

```powershell
# Nao sobe docker compose
powershell -ExecutionPolicy Bypass -File .\scripts\stack-start.ps1 -SkipDocker

# Customizar comandos de dev server
powershell -ExecutionPolicy Bypass -File .\scripts\stack-start.ps1 -BackendCmd "npm run dev" -FrontendCmd "npm run dev"
```

Logs gerados em:

- `.ops-logs/backend-dev.log`
- `.ops-logs/frontend-dev.log`

## 2) Validar stack (checks rapidos)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stack-check.ps1
```

O check valida:

- `health` do backend.
- raiz do frontend.
- bootstrap de autenticacao via `register` (com fallback de `login`).
- endpoints de auditoria autenticados.
- resumo final com `RESULTADO FINAL: PASS` ou `FAIL`.

Opcoes uteis:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stack-check.ps1 `
  -BackendBaseUrl "http://127.0.0.1:8080" `
  -FrontendUrl "http://127.0.0.1:5173" `
  -AuditPaths "/api/audits","/api/audit-logs"
```

## 3) Parar stack

Padrao: para backend/frontend e **mantem** Docker ligado (`-KeepDocker` true por padrao).

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stack-stop.ps1
```

Para derrubar tambem o `docker compose`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stack-stop.ps1 -KeepDocker:$false
```

## Criterios de pronto (base 100%)

Considere a base pronta para uso operacional quando:

1. `stack-start.ps1` finaliza sem erro e mostra backend/frontend como `UP`.
2. `stack-check.ps1` retorna `RESULTADO FINAL: PASS`.
3. `stack-stop.ps1` encerra processos de app com sucesso.
4. Logs em `.ops-logs` mostram inicializacao sem erro critico.
