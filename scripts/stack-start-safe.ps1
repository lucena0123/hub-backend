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

function Invoke-Wsl {
    param([string]$Distro, [string]$Script)
    & wsl -d $Distro bash -lc $Script
    if ($LASTEXITCODE -ne 0) { throw "Falha ao executar no WSL ($Distro)." }
}

function Wait-PostgresReady {
    param(
        [string]$Distro,
        [int]$TimeoutSeconds = 90
    )

    $start = Get-Date
    while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSeconds) {
        try {
            $health = & wsl -d $Distro bash -lc "docker inspect --format='{{.State.Health.Status}}' bpmn-postgres 2>/dev/null || echo unknown"
            if ($health -match "healthy") {
                $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 5433 -WarningAction SilentlyContinue
                if ($tcp.TcpTestSucceeded) {
                    Write-Host "Postgres pronto (healthy + porta 5433)."
                    return
                }
            }
        }
        catch {}

        Start-Sleep -Seconds 3
    }

    throw "Postgres nao ficou pronto dentro de $TimeoutSeconds s."
}

function Start-HostProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command,
        [string]$PidFile,
        [string]$LogFile,
        [int]$RetryCount = 1
    )

    if (Test-Path $PidFile) {
        $storedPid = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($storedPid) {
            try {
                $proc = Get-Process -Id ([int]$storedPid) -ErrorAction Stop
                if (-not $proc.HasExited) {
                    Write-Host "${Name}: ja estava ativo (pid $storedPid)"
                    return
                }
            }
            catch {}
        }
        Remove-Item $PidFile -ErrorAction SilentlyContinue
    }

    $runner = @"
Set-Location '$WorkingDirectory'
$Command *>> '$LogFile'
"@

    $attempt = 0
    do {
        $attempt += 1
        $proc = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile", "-Command", $runner -WindowStyle Hidden -PassThru
        $proc.Id | Set-Content -Path $PidFile -Encoding ascii
        Start-Sleep -Seconds 2
        if (-not $proc.HasExited) {
            Write-Host "${Name}: iniciado (pid $($proc.Id))"
            return
        }

        Write-Host "${Name}: tentativa $attempt falhou (processo encerrou ao iniciar)." -ForegroundColor Yellow
        Remove-Item $PidFile -ErrorAction SilentlyContinue
        if ($attempt -lt $RetryCount) {
            Start-Sleep -Seconds 3
        }
    } while ($attempt -lt $RetryCount)

    throw "${Name}: nao foi possivel iniciar apos $RetryCount tentativas."
}

$repoWin = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$repoWsl = Convert-ToWslPath $repoWin
$logsWin = Join-Path $repoWin ".ops-logs"
$backendWin = Join-Path $repoWin $BackendDir
$frontendWin = Join-Path $repoWin $FrontendDir

if (-not (Test-Path $frontendWin)) {
    $fallbackFrontend = Join-Path $repoWin "frontend"
    if (Test-Path $fallbackFrontend) {
        Write-Host "FrontendDir '$FrontendDir' não encontrado. Usando fallback local 'frontend'." -ForegroundColor Yellow
        $frontendWin = $fallbackFrontend
    }
    else {
        throw "FrontendDir inválido: '$FrontendDir'. Informe um caminho existente relativo ao repo Hub."
    }
}

New-Item -ItemType Directory -Path $logsWin -Force | Out-Null

if (-not $SkipDocker) {
    Write-Host "Subindo servicos Docker via WSL (docker compose up -d) ..."
    Invoke-Wsl -Distro $WslDistro -Script "set -e; cd '$repoWsl'; docker compose up -d"
    Wait-PostgresReady -Distro $WslDistro
}
else {
    Write-Host "SkipDocker ativo: docker compose nao sera iniciado."
}

$wslHasNode = $false
try {
    $nodeProbe = & wsl -d $WslDistro bash -lc "command -v node >/dev/null 2>&1 && echo OK || echo NO"
    $wslHasNode = ($nodeProbe -match "OK")
}
catch {
    $wslHasNode = $false
}

if ($wslHasNode) {
    Write-Host "Node detectado no WSL; use stack-start.ps1 legado se quiser processos no WSL."
}
else {
    Write-Host "Node nao detectado no WSL; iniciando backend/frontend no host Windows."
}

Start-HostProcess -Name "backend" -WorkingDirectory $backendWin -Command $BackendCmd -PidFile (Join-Path $logsWin "backend.pid") -LogFile (Join-Path $logsWin "backend-dev.log") -RetryCount 3
Start-HostProcess -Name "frontend" -WorkingDirectory $frontendWin -Command $FrontendCmd -PidFile (Join-Path $logsWin "frontend.pid") -LogFile (Join-Path $logsWin "frontend-dev.log") -RetryCount 2

Write-Host ""
Write-Host "Status rapido:"
foreach ($name in @("backend", "frontend")) {
    $pidFile = Join-Path $logsWin "$name.pid"
    if (Test-Path $pidFile) {
        $storedPid = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
        try {
            $p = Get-Process -Id ([int]$storedPid) -ErrorAction Stop
            if (-not $p.HasExited) {
                Write-Host "$name processo: UP (pid $storedPid)"
                continue
            }
        }
        catch {}
    }
    Write-Host "$name processo: DOWN"
}

Write-Host ""
Write-Host "docker compose ps:"
try {
    Invoke-Wsl -Distro $WslDistro -Script "cd '$repoWsl' && docker compose ps || true"
}
catch {
    Write-Host "(nao foi possivel consultar docker compose ps)"
}

Write-Host ""
Write-Host "Logs:"
Write-Host " - $logsWin\backend-dev.log"
Write-Host " - $logsWin\frontend-dev.log"
