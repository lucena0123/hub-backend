param(
    [string]$WslDistro = "Ubuntu",
    [switch]$KeepDocker = $true,
    [string]$BackendPattern = "npm run dev.*backend|backend.*npm run dev",
    [string]$FrontendPattern = "npm run dev.*frontend|frontend.*npm run dev"
)

$ErrorActionPreference = "Stop"

function Convert-ToWslPath {
    param([string]$WindowsPath)
    $full = [System.IO.Path]::GetFullPath($WindowsPath)
    if ($full -notmatch "^[A-Za-z]:\\") {
        throw "Caminho Windows invalido para conversao WSL: $WindowsPath"
    }
    $drive = $full.Substring(0, 1).ToLowerInvariant()
    $rest = $full.Substring(2).Replace("\", "/")
    return "/mnt/$drive$rest"
}

function Quote-ForBashSingle {
    param([string]$Value)
    return "'" + ($Value -replace "'", "'\"'\"'") + "'"
}

function Invoke-Wsl {
    param(
        [string]$Distro,
        [string]$Script
    )
    & wsl -d $Distro bash -lc $Script
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao executar no WSL ($Distro)."
    }
}

$repoWin = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$repoWsl = Convert-ToWslPath $repoWin
$logsWsl = "$repoWsl/.ops-logs"
$qRepo = Quote-ForBashSingle $repoWsl
$qLogs = Quote-ForBashSingle $logsWsl
$qBackendPattern = Quote-ForBashSingle $BackendPattern
$qFrontendPattern = Quote-ForBashSingle $FrontendPattern

Write-Host "Encerrando backend/frontend no WSL ..."
Invoke-Wsl -Distro $WslDistro -Script @"
set +e
if [ -f $qLogs/backend.pid ]; then
  kill "\$(cat $qLogs/backend.pid)" 2>/dev/null
  rm -f $qLogs/backend.pid
  echo "backend: pid file encerrado"
fi
if [ -f $qLogs/frontend.pid ]; then
  kill "\$(cat $qLogs/frontend.pid)" 2>/dev/null
  rm -f $qLogs/frontend.pid
  echo "frontend: pid file encerrado"
fi
pkill -f $qBackendPattern && echo "backend: encerrado por pattern" || true
pkill -f $qFrontendPattern && echo "frontend: encerrado por pattern" || true
"@

if (-not $KeepDocker) {
    Write-Host "Parando Docker stack (docker compose down) ..."
    Invoke-Wsl -Distro $WslDistro -Script "set -e; cd $qRepo; docker compose down"
}
else {
    Write-Host "KeepDocker ativo: containers Docker mantidos."
}

Write-Host ""
Write-Host "Status rapido apos stop:"
Invoke-Wsl -Distro $WslDistro -Script @"
set +e
if pgrep -f $qBackendPattern >/dev/null 2>&1; then
  echo "backend processo: ainda ativo"
else
  echo "backend processo: parado"
fi
if pgrep -f $qFrontendPattern >/dev/null 2>&1; then
  echo "frontend processo: ainda ativo"
else
  echo "frontend processo: parado"
fi
if command -v docker >/dev/null 2>&1; then
  echo ""
  echo "docker compose ps:"
  cd $qRepo && docker compose ps || true
fi
"@
