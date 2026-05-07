# Cria o repo rlm-system no GitHub via gh CLI e da push
# Saida: console + E:\sync-rlm-log.txt

$logFile = "E:\sync-rlm-log.txt"
"" | Out-File $logFile

function Log {
    param($msg, $color = "White")
    Write-Host $msg -ForegroundColor $color
    Add-Content -Path $logFile -Value $msg
}

Log "Inicio: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Cyan"
Log "================================================================"

# 1. Verifica se gh CLI esta instalado
$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Log "gh CLI nao encontrado. Instalando via winget..." "Yellow"
    winget install --id GitHub.cli --silent --accept-package-agreements --accept-source-agreements 2>&1 | ForEach-Object { Log "  $_" }

    # Reload PATH para sessao atual
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    $ghPath = Get-Command gh -ErrorAction SilentlyContinue
    if (-not $ghPath) {
        Log "Falhou instalacao via winget. Tente manualmente: https://cli.github.com" "Red"
        exit 1
    }
    Log "gh CLI instalado em: $($ghPath.Source)" "Green"
} else {
    Log "gh CLI encontrado em: $($ghPath.Source)" "Green"
}

Log ""
Log "Versao do gh: $(gh --version | Select-Object -First 1)"

# 2. Verifica status de autenticacao
Log ""
Log "[Auth] Verificando..." "Cyan"
$authStatus = gh auth status 2>&1
$authStatus | ForEach-Object { Log "  $_" }

if ($LASTEXITCODE -ne 0) {
    Log "" "Yellow"
    Log "Voce precisa fazer login no gh CLI agora." "Yellow"
    Log "O comando 'gh auth login' vai abrir um prompt interativo:" "Yellow"
    Log "  - Selecione: GitHub.com" "Yellow"
    Log "  - Protocolo: HTTPS" "Yellow"
    Log "  - Authenticate Git: Yes" "Yellow"
    Log "  - How to auth: Login with a web browser" "Yellow"
    Log "  - Cole o codigo no navegador e autoriza" "Yellow"
    Log "" "Yellow"
    Log "Iniciando login..." "Cyan"

    gh auth login --hostname github.com --git-protocol https --web

    if ($LASTEXITCODE -ne 0) {
        Log "Login falhou. Abortando." "Red"
        exit 1
    }
}

# 3. Cria repo (privado, vazio) e da push
Log ""
Log "================================================================"
Log "[rlm-system] Criando repo privado e dando push..." "Cyan"

Push-Location "E:\RLM - PROJETO\rlm-system"
try {
    # Remove o remote existente para o gh nao reclamar
    git remote remove origin 2>$null

    Log "  Executando: gh repo create lucena0123/rlm-system --private --source=. --remote=origin --push" "Gray"

    $createOutput = gh repo create lucena0123/rlm-system --private --source=. --remote=origin --push 2>&1
    $createOutput | ForEach-Object { Log "  $_" }

    if ($LASTEXITCODE -eq 0) {
        Log ""
        Log "RLM-SYSTEM: OK!" "Green"
        Log "Repo: https://github.com/lucena0123/rlm-system" "Green"
    } else {
        Log ""
        Log "Falhou na criacao/push. Diagnostico abaixo:" "Red"

        # Tenta diagnosticar
        Log "  Status do repo apos tentativa:"
        git remote -v 2>&1 | ForEach-Object { Log "    $_" }
        Log "  Tentando push manual..."
        git push -u origin master 2>&1 | ForEach-Object { Log "    $_" }
    }
} finally {
    Pop-Location
}

Log ""
Log "================================================================"
Log "FIM. Log completo: $logFile" "Cyan"
