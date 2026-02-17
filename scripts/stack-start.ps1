param(
    [string]$WslDistro = "Ubuntu",
    [switch]$SkipDocker,
    [string]$BackendDir = "backend",
    [string]$FrontendDir = "frontend",
    [string]$BackendCmd = "npm run dev",
    [string]$FrontendCmd = "npm run dev"
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
$backendWsl = "$repoWsl/$BackendDir"
$frontendWsl = "$repoWsl/$FrontendDir"

$qRepo = Quote-ForBashSingle $repoWsl
$qLogs = Quote-ForBashSingle $logsWsl
$qBackend = Quote-ForBashSingle $backendWsl
$qFrontend = Quote-ForBashSingle $frontendWsl
$qBackendCmd = Quote-ForBashSingle $BackendCmd
$qFrontendCmd = Quote-ForBashSingle $FrontendCmd

Write-Host "Preparando estrutura de logs em $logsWsl ..."
Invoke-Wsl -Distro $WslDistro -Script "mkdir -p $qLogs"

if (-not $SkipDocker) {
    Write-Host "Subindo servicos Docker (docker compose up -d) ..."
    Invoke-Wsl -Distro $WslDistro -Script "set -e; cd $qRepo; docker compose up -d"
}
else {
    Write-Host "SkipDocker ativo: docker compose nao sera iniciado."
}

Write-Host "Iniciando backend em modo detached ..."
Invoke-Wsl -Distro $WslDistro -Script @"
set -e
mkdir -p $qLogs
if [ -f $qLogs/backend.pid ] && kill -0 "\$(cat $qLogs/backend.pid)" 2>/dev/null; then
  echo "backend: ja estava ativo (pid \$(cat $qLogs/backend.pid))"
else
  nohup bash -lc "cd $qBackend && $BackendCmd" > $qLogs/backend-dev.log 2>&1 < /dev/null &
  echo \$! > $qLogs/backend.pid
  echo "backend: iniciado (pid \$(cat $qLogs/backend.pid))"
fi
"@

Write-Host "Iniciando frontend em modo detached ..."
Invoke-Wsl -Distro $WslDistro -Script @"
set -e
mkdir -p $qLogs
if [ -f $qLogs/frontend.pid ] && kill -0 "\$(cat $qLogs/frontend.pid)" 2>/dev/null; then
  echo "frontend: ja estava ativo (pid \$(cat $qLogs/frontend.pid))"
else
  nohup bash -lc "cd $qFrontend && $FrontendCmd" > $qLogs/frontend-dev.log 2>&1 < /dev/null &
  echo \$! > $qLogs/frontend.pid
  echo "frontend: iniciado (pid \$(cat $qLogs/frontend.pid))"
fi
"@

Write-Host ""
Write-Host "Status rapido:"
Invoke-Wsl -Distro $WslDistro -Script @"
set +e
echo "backend pid: \$(cat $qLogs/backend.pid 2>/dev/null || echo '-')" 
echo "frontend pid: \$(cat $qLogs/frontend.pid 2>/dev/null || echo '-')"
if [ -f $qLogs/backend.pid ] && kill -0 "\$(cat $qLogs/backend.pid)" 2>/dev/null; then
  echo "backend processo: UP"
else
  echo "backend processo: DOWN"
fi
if [ -f $qLogs/frontend.pid ] && kill -0 "\$(cat $qLogs/frontend.pid)" 2>/dev/null; then
  echo "frontend processo: UP"
else
  echo "frontend processo: DOWN"
fi
if command -v docker >/dev/null 2>&1; then
  echo ""
  echo "docker compose ps:"
  cd $qRepo && docker compose ps || true
fi
"@

Write-Host ""
Write-Host "Logs:"
Write-Host " - $repoWin\.ops-logs\backend-dev.log"
Write-Host " - $repoWin\.ops-logs\frontend-dev.log"
