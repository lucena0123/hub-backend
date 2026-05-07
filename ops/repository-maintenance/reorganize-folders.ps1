# Reorganiza E:/ com estrutura flat alinhada ao GitHub
# IMPORTANTE: rodar com PowerShell aberto em E:\, NAO em nenhuma pasta que vai ser movida
# Pre-req: parar Docker, dev servers, fechar VSCode/Cursor com workspace aberto
# Log: E:\reorganize-log.txt

$logFile = "E:\reorganize-log.txt"
"" | Out-File $logFile

function Log {
    param($msg, $color = "White")
    Write-Host $msg -ForegroundColor $color
    Add-Content -Path $logFile -Value $msg
}

function Test-FolderLocked {
    param($path)
    if (-not (Test-Path $path)) { return $false }
    try {
        # Tenta criar arquivo temporario - se a pasta esta locked, falha
        $testFile = Join-Path $path ".lock-test-$(Get-Random).tmp"
        New-Item -Path $testFile -ItemType File -Force -ErrorAction Stop | Out-Null
        Remove-Item $testFile -Force -ErrorAction Stop
        return $false
    } catch {
        return $true
    }
}

# ============ SAFETY CHECKS ============
$cwd = (Get-Location).Path
Log "CWD atual: $cwd"
Log "================================================================"

$pastasParaMover = @("E:\Hub", "E:\Hub-Forms\lucena-forms", "E:\GridEnergy\ProjetoEnergia",
                     "E:\Marketing", "E:\Teste\LUCENA", "E:\AntiGravity\Crochetin-landpage",
                     "E:\Proejto Certificado", "E:\RLM - PROJETO\rlm-system",
                     "E:\lucena-lead-automation")

foreach ($p in $pastasParaMover) {
    if ($cwd -like "$p*") {
        Log "ERRO: voce esta dentro de '$p' - pasta sera movida. Saia primeiro (cd E:\)" "Red"
        exit 1
    }
}

# ============ BACKUP DOS ARQUIVOS CRITICOS ============
Log ""
Log "[BACKUP] Salvando configs criticos antes de mover" "Cyan"
$backupDir = "E:\_reorganize-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$arquivosCriticos = @(
    "E:\Hub\CLAUDE.md",
    "E:\Hub\.git\config",
    "E:\RLM - PROJETO\rlm-system\CLAUDE.md",
    "E:\RLM - PROJETO\rlm-system\.git\config",
    "E:\RLM - PROJETO\rlm-system\docker-compose.yml"
)
foreach ($f in $arquivosCriticos) {
    if (Test-Path $f) {
        $rel = $f.Replace("E:\","").Replace("\","_").Replace(":","")
        Copy-Item $f "$backupDir\$rel" -Force
        Log "  Backup: $f" "Gray"
    }
}
Log "  Backups em: $backupDir" "Green"

# ============ DELETAR DUPLICATAS ============
Log ""
Log "[DELETE] Duplicatas Crochetin antigas" "Cyan"
$duplicatas = @("E:\Projetos\Crochetin-landpage", "E:\Projetos\Crochetin-landpage - 2")
foreach ($d in $duplicatas) {
    if (Test-Path $d) {
        try {
            Remove-Item $d -Recurse -Force -ErrorAction Stop
            Log "  Deletado: $d" "Green"
        } catch {
            Log "  ERRO ao deletar $d : $_" "Red"
        }
    } else {
        Log "  Nao existe: $d" "Gray"
    }
}

# ============ MOVES ============
Log ""
Log "[MOVE] Renomeando/movendo pastas" "Cyan"

$moves = @(
    @{from="E:\Hub"; to="E:\hub-backend"},
    @{from="E:\Hub-Forms\lucena-forms"; to="E:\hub-forms"},
    @{from="E:\GridEnergy\ProjetoEnergia"; to="E:\gridrisk"},
    @{from="E:\Marketing"; to="E:\lucena-marketing-site"},
    @{from="E:\Teste\LUCENA"; to="E:\lucena-presentation"},
    @{from="E:\AntiGravity\Crochetin-landpage"; to="E:\crochetin-landing"},
    @{from="E:\Proejto Certificado"; to="E:\rlm-certificates"},
    @{from="E:\RLM - PROJETO\rlm-system"; to="E:\rlm-system"},
    @{from="E:\lucena-lead-automation"; to="E:\lead-automation"}
)

$moveResults = @()
foreach ($m in $moves) {
    Log ""
    Log "  $($m.from)  -->  $($m.to)"

    if (-not (Test-Path $m.from)) {
        Log "    SKIP: origem nao existe" "Yellow"
        $moveResults += [PSCustomObject]@{From=$m.from; To=$m.to; Status="SKIP-origem-inexistente"}
        continue
    }
    if (Test-Path $m.to) {
        Log "    SKIP: destino ja existe" "Yellow"
        $moveResults += [PSCustomObject]@{From=$m.from; To=$m.to; Status="SKIP-destino-existente"}
        continue
    }

    if (Test-FolderLocked $m.from) {
        Log "    ERRO: pasta locked (algum processo segura). Para Docker/IDEs/dev servers." "Red"
        $moveResults += [PSCustomObject]@{From=$m.from; To=$m.to; Status="LOCKED"}
        continue
    }

    try {
        Move-Item -Path $m.from -Destination $m.to -Force -ErrorAction Stop
        Log "    OK" "Green"
        $moveResults += [PSCustomObject]@{From=$m.from; To=$m.to; Status="OK"}
    } catch {
        Log "    ERRO: $_" "Red"
        $moveResults += [PSCustomObject]@{From=$m.from; To=$m.to; Status="FAIL: $_"}
    }
}

# ============ CLONE REPOS GITHUB-ONLY ============
Log ""
Log "[CLONE] Repos do GitHub que nao tinham copia local" "Cyan"

$clones = @(
    @{repo="lucena0123/hub-frontend"; dest="E:\hub-frontend"},
    @{repo="lucena0123/crochetin-linktree"; dest="E:\crochetin-linktree"}
)

foreach ($c in $clones) {
    if (Test-Path $c.dest) {
        Log "  $($c.dest) ja existe, pulando" "Gray"
        continue
    }
    Log "  Clonando $($c.repo) -> $($c.dest)..."
    git clone "https://github.com/$($c.repo).git" $c.dest 2>&1 | ForEach-Object { Log "    $_" }
    if ($LASTEXITCODE -eq 0) {
        Log "    OK" "Green"
    } else {
        Log "    FAIL" "Red"
    }
}

# ============ ATUALIZA CLAUDE.md ============
Log ""
Log "[CLAUDE.md] Atualizando referencias de path" "Cyan"

# Hub CLAUDE.md (agora em hub-backend)
$hubCM = "E:\hub-backend\CLAUDE.md"
if (Test-Path $hubCM) {
    $content = Get-Content $hubCM -Raw -Encoding UTF8
    # Sem mudancas grandes necessarias no Hub - paths internos sao relativos
    Log "  $hubCM existe (paths internos relativos, sem alteracao)" "Gray"
}

# rlm-system CLAUDE.md (agora em rlm-system)
$rlmCM = "E:\rlm-system\CLAUDE.md"
if (Test-Path $rlmCM) {
    $content = Get-Content $rlmCM -Raw -Encoding UTF8
    $original = $content
    # Substituir referencias antigas
    $content = $content -replace 'E:\\Proejto Certificado', 'E:\rlm-certificates'
    $content = $content -replace '`E:\\Proejto Certificado`', '`E:\rlm-certificates`'
    $content = $content -replace '\.\./\.\./Proejto Certificado', '../rlm-certificates'

    if ($content -ne $original) {
        Set-Content -Path $rlmCM -Value $content -Encoding UTF8 -NoNewline
        Log "  Atualizado: $rlmCM" "Green"
    } else {
        Log "  Sem mudancas em $rlmCM" "Gray"
    }
}

# docker-compose.yml do rlm-system (path do Flask sidecar)
$dcYml = "E:\rlm-system\docker-compose.yml"
if (Test-Path $dcYml) {
    $content = Get-Content $dcYml -Raw -Encoding UTF8
    $original = $content
    $content = $content -replace 'context: \.\./\.\./Proejto Certificado', 'context: ../rlm-certificates'
    if ($content -ne $original) {
        Set-Content -Path $dcYml -Value $content -Encoding UTF8 -NoNewline
        Log "  Atualizado: $dcYml" "Green"
    } else {
        Log "  Sem mudancas em $dcYml" "Gray"
    }
}

# ============ LIMPAR PASTAS PAI VAZIAS ============
Log ""
Log "[CLEANUP] Removendo pastas-pai vazias" "Cyan"

$paisVazios = @("E:\Hub-Forms", "E:\GridEnergy", "E:\Teste", "E:\RLM - PROJETO")
foreach ($p in $paisVazios) {
    if (Test-Path $p) {
        $items = Get-ChildItem $p -Force | Where-Object { $_.Name -ne "." -and $_.Name -ne ".." }
        if ($items.Count -eq 0) {
            try {
                Remove-Item $p -Force
                Log "  Removido (vazio): $p" "Green"
            } catch {
                Log "  Falhou remover $p : $_" "Yellow"
            }
        } else {
            Log "  $p ainda tem $($items.Count) item(s), mantendo" "Yellow"
            $items | ForEach-Object { Log "    - $($_.Name)" "Gray" }
        }
    }
}

# ============ RESUMO ============
Log ""
Log "================================================================"
Log "RESUMO" "Cyan"
Log "================================================================"
$moveResults | Format-Table -AutoSize | Out-String | ForEach-Object { Log $_ }

Log ""
Log "Estado final em E:\ (apenas pastas com git ou nomes-alvo):" "Cyan"
$alvos = @("hub-backend","hub-frontend","hub-forms","gridrisk","lucena-marketing-site",
           "lucena-presentation","crochetin-landing","crochetin-linktree",
           "rlm-certificates","rlm-system","lead-automation")
foreach ($a in $alvos) {
    $p = "E:\$a"
    if (Test-Path $p) {
        $hasGit = Test-Path "$p\.git"
        $marker = if ($hasGit) { "(.git)" } else { "(SEM GIT)" }
        Log "  OK $a $marker" "Green"
    } else {
        Log "  -- $a (nao existe)" "Yellow"
    }
}

Log ""
Log "FIM. Log: $logFile" "Cyan"
Log "Backup: $backupDir" "Cyan"
