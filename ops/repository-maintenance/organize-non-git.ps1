# Organiza pastas sem git em E:\ por categoria
# Cria _docs, _sites, _tools, _archive, _scratch, _media e move pastas
# Deleta pastas vazias/abandonadas
# Log: E:\organize-non-git-log.txt

$logFile = "E:\organize-non-git-log.txt"
"" | Out-File $logFile

function Log {
    param($msg, $color = "White")
    Write-Host $msg -ForegroundColor $color
    Add-Content -Path $logFile -Value $msg
}

Log "Inicio: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Cyan"
Log "================================================================"

# ============ SAFETY: cwd ============
$cwd = (Get-Location).Path
if ($cwd -ne "E:\") {
    Log "AVISO: cwd e $cwd. Recomendado rodar de E:\\. Continuando mesmo assim." "Yellow"
}

# ============ CRIAR PASTAS GUARDA-CHUVA ============
Log ""
Log "[SETUP] Criando pastas de categorias" "Cyan"
$categorias = @("_docs", "_sites", "_tools", "_archive", "_scratch", "_media")
foreach ($c in $categorias) {
    $p = "E:\$c"
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Path $p | Out-Null
        Log "  Criada: $p" "Green"
    } else {
        Log "  Ja existe: $p" "Gray"
    }
}

# ============ DELETAR VAZIAS/QUASE-VAZIAS ============
Log ""
Log "[DELETE] Pastas vazias ou abandonadas (<10 arquivos)" "Cyan"
$paraDeletar = @(
    "E:\CostaeLucena",
    "E:\LandPageMatheusLucena",
    "E:\PC-Hardware",
    "E:\Processos",
    "E:\importantes",
    "E:\SaasManutencao"
)
foreach ($p in $paraDeletar) {
    if (Test-Path $p) {
        try {
            Remove-Item $p -Recurse -Force -ErrorAction Stop
            Log "  Deletado: $p" "Green"
        } catch {
            Log "  ERRO ao deletar $p : $_" "Red"
        }
    } else {
        Log "  Nao existe: $p" "Gray"
    }
}

# ============ MOVES POR CATEGORIA ============
Log ""
Log "[MOVE] Reorganizando por categoria" "Cyan"

$moves = @(
    # _docs
    @{from="E:\Contratos"; to="E:\_docs\contratos"},
    @{from="E:\Parecer Tecnico"; to="E:\_docs\parecer-tecnico"},
    @{from="E:\Projeto Instalacoes"; to="E:\_docs\projeto-instalacoes"},
    @{from="E:\Projeto Instalações"; to="E:\_docs\projeto-instalacoes"},
    @{from="E:\proejto eletrico residencial"; to="E:\_docs\projeto-eletrico-residencial"},
    @{from="E:\projeto residencial 2"; to="E:\_docs\projeto-residencial-2"},

    # _sites
    @{from="E:\Site Matheus"; to="E:\_sites\site-matheus"},
    @{from="E:\Sites"; to="E:\_sites\sites"},

    # _tools
    @{from="E:\LexOffice"; to="E:\_tools\lexoffice"},
    @{from="E:\n8n"; to="E:\_tools\n8n"},
    @{from="E:\OpenClaude"; to="E:\_tools\openclaude"},
    @{from="E:\Skills"; to="E:\_tools\skills"},
    @{from="E:\MACOS"; to="E:\_tools\macos"},

    # _archive (versoes antigas/abandonadas)
    @{from="E:\RLM"; to="E:\_archive\rlm-old"},
    @{from="E:\Projetonovo"; to="E:\_archive\projeto-novo"},
    @{from="E:\ERP"; to="E:\_archive\erp"},
    @{from="E:\Gestao"; to="E:\_archive\gestao"},
    @{from="E:\Manutencao"; to="E:\_archive\manutencao"},
    @{from="E:\Manutenção"; to="E:\_archive\manutencao"},

    # _scratch (rascunhos / restos)
    @{from="E:\Tibia Bot"; to="E:\_scratch\tibia-bot"},
    @{from="E:\data"; to="E:\_scratch\data"},
    @{from="E:\AntiGravity\crochetin-astro"; to="E:\_scratch\crochetin-astro"},
    @{from="E:\Projetos\Xpckill"; to="E:\_scratch\xpckill"},

    # _media
    @{from="E:\Imagens"; to="E:\_media\imagens"},
    @{from="E:\imagens carrossel"; to="E:\_media\imagens-carrossel"},
    @{from="E:\OBS"; to="E:\_media\obs"}
)

$results = @()
foreach ($m in $moves) {
    if (-not (Test-Path $m.from)) {
        # Skip silencioso (caso de pastas com variação de nome - alguns from podem não existir)
        continue
    }
    Log ""
    Log "  $($m.from)  -->  $($m.to)"

    if (Test-Path $m.to) {
        Log "    SKIP: destino ja existe" "Yellow"
        $results += [PSCustomObject]@{From=$m.from; To=$m.to; Status="SKIP-destino-existente"}
        continue
    }

    try {
        Move-Item -Path $m.from -Destination $m.to -Force -ErrorAction Stop
        Log "    OK" "Green"
        $results += [PSCustomObject]@{From=$m.from; To=$m.to; Status="OK"}
    } catch {
        Log "    ERRO: $_" "Red"
        $results += [PSCustomObject]@{From=$m.from; To=$m.to; Status="FAIL"}
    }
}

# ============ LIMPAR PAIS QUE FICARAM VAZIOS ============
Log ""
Log "[CLEANUP] Removendo pastas-pai vazias (AntiGravity, Projetos)" "Cyan"
$paisVazios = @("E:\AntiGravity", "E:\Projetos")
foreach ($p in $paisVazios) {
    if (Test-Path $p) {
        $items = Get-ChildItem $p -Force -ErrorAction SilentlyContinue
        if ($items.Count -eq 0) {
            try {
                Remove-Item $p -Force
                Log "  Removida (vazia): $p" "Green"
            } catch {
                Log "  Falhou remover $p : $_" "Yellow"
            }
        } else {
            Log "  $p ainda tem $($items.Count) item(s):" "Yellow"
            $items | ForEach-Object { Log "    - $($_.Name)" "Gray" }
        }
    }
}

# ============ RESUMO ============
Log ""
Log "================================================================"
Log "RESUMO" "Cyan"
Log "================================================================"
$results | Format-Table -AutoSize | Out-String | ForEach-Object { Log $_ }

Log ""
Log "Estado final em E:\\ (pastas top-level):" "Cyan"
Get-ChildItem E:\ -Directory -Force | Sort-Object Name | ForEach-Object {
    $name = $_.Name
    $marker = if ($name.StartsWith("_")) { "[GROUP]" } elseif (Test-Path "E:\$name\.git") { "[REPO] " } else { "[DIR]  " }
    Log "  $marker $name"
}

Log ""
Log "FIM. Log: $logFile" "Cyan"
