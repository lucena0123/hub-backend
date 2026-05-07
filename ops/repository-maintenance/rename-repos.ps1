# Renomeia repos no GitHub, atualiza descricoes e ajusta remotes locais
# Pre-requisito: gh CLI autenticado (ja foi feito)
# Log: E:\rename-log.txt

$logFile = "E:\rename-log.txt"
"" | Out-File $logFile

function Log {
    param($msg, $color = "White")
    Write-Host $msg -ForegroundColor $color
    Add-Content -Path $logFile -Value $msg
}

# Definicoes: oldName, newName, description, localPath (vazio se nao tem local)
$repos = @(
    @{
        old = "Hub"
        new = "hub-backend"
        desc = "Sistema BPMN Revenue Operations - Backend Fastify + Orchestration"
        localPath = "E:\Hub"
    },
    @{
        old = "hub-frontend"
        new = "hub-frontend"  # nao renomeia, so atualiza desc
        desc = "Frontend Next.js do sistema BPMN Revenue Operations"
        localPath = ""
    },
    @{
        old = "lucena-forms"
        new = "hub-forms"
        desc = "Formulario publico de onboarding para clientes da Lucena Solucoes Digitais"
        localPath = "E:\Hub-Forms\lucena-forms"
    },
    @{
        old = "ProjetoEnergia"
        new = "gridrisk"
        desc = "Plataforma de risco e infraestrutura eletrica baseada em dados publicos da ANEEL (BDGD + DEC/FEC)"
        localPath = "E:\GridEnergy\ProjetoEnergia"
    },
    @{
        old = "Marketing"
        new = "lucena-marketing-site"
        desc = "Landing page de marketing juridico para escritorios de advocacia (React + Vite + Tailwind 4)"
        localPath = "E:\Marketing"
    },
    @{
        old = "LUCENA"
        new = "lucena-presentation"
        desc = "Apresentacao animada da Lucena Solucoes Digitais (GitHub Pages)"
        localPath = "E:\Teste\LUCENA"
    },
    @{
        old = "Crochetin-landpage"
        new = "crochetin-landing"
        desc = "Landing page do Crochetin (Astro v2 - performance e acessibilidade otimizadas)"
        localPath = "E:\AntiGravity\Crochetin-landpage"
    },
    @{
        old = "LinkCrochetin"
        new = "crochetin-linktree"
        desc = "Link tree do Crochetin (Astro)"
        localPath = ""
    },
    @{
        old = "certificados-rlm"
        new = "rlm-certificates"
        desc = "Sistema de emissao e verificacao de certificados de treinamento NR para a RLM (Flask + Playwright + ICP-Brasil)"
        localPath = "E:\Proejto Certificado"
    },
    @{
        old = "rlm-system"
        new = "rlm-system"  # nao renomeia, so desc
        desc = "Sistema de gestao RLM v2 (monorepo Next.js com apps/web e packages)"
        localPath = "E:\RLM - PROJETO\rlm-system"
    },
    @{
        old = "lucena-lead-automation"
        new = "lead-automation"
        desc = "Automacao de descoberta e qualificacao de leads via Google Places + SerpAPI + Google Sheets"
        localPath = "E:\lucena-lead-automation"
    }
)

Log "Inicio: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Cyan"
Log "================================================================"

$summary = @()

foreach ($r in $repos) {
    $old = $r.old
    $new = $r.new
    $desc = $r.desc
    $local = $r.localPath
    $newUrl = "https://github.com/lucena0123/$new.git"

    Log ""
    Log "----- $old -> $new -----" "Cyan"

    $renameOk = $true
    $descOk = $true
    $remoteOk = $true

    # 1. Rename (se necessario)
    if ($old -ne $new) {
        Log "  Renomeando..."
        $out = gh repo rename $new -R "lucena0123/$old" --yes 2>&1
        $out | ForEach-Object { Log "    $_" }
        if ($LASTEXITCODE -ne 0) { $renameOk = $false }
    } else {
        Log "  (mesmo nome, sem rename)"
    }

    # 2. Atualiza descricao
    Log "  Atualizando descricao..."
    $out = gh repo edit "lucena0123/$new" --description $desc 2>&1
    $out | ForEach-Object { Log "    $_" }
    if ($LASTEXITCODE -ne 0) { $descOk = $false }

    # 3. Atualiza remote local (se houver)
    if ($local -and (Test-Path $local)) {
        Log "  Atualizando remote local em: $local"
        Push-Location $local
        try {
            $currentRemote = git remote get-url origin 2>$null
            Log "    Antes: $currentRemote"
            git remote set-url origin $newUrl 2>&1 | ForEach-Object { Log "    $_" }
            $newRemote = git remote get-url origin 2>$null
            Log "    Depois: $newRemote"
        } catch {
            $remoteOk = $false
        } finally {
            Pop-Location
        }
    } elseif ($local) {
        Log "  (pasta local nao existe: $local)" "Yellow"
    } else {
        Log "  (sem pasta local)"
    }

    # Resumo
    $status = if ($renameOk -and $descOk -and $remoteOk) { "OK" } else { "PARCIAL" }
    $color = if ($status -eq "OK") { "Green" } else { "Yellow" }
    Log "  RESULTADO: $status" $color

    $summary += [PSCustomObject]@{
        Repo = "$old -> $new"
        Rename = if ($renameOk) { "OK" } else { "FAIL" }
        Description = if ($descOk) { "OK" } else { "FAIL" }
        LocalRemote = if ($remoteOk) { "OK" } else { "FAIL" }
    }
}

Log ""
Log "================================================================"
Log "RESUMO FINAL" "Cyan"
Log "================================================================"
$summary | Format-Table -AutoSize | Out-String | ForEach-Object { Log $_ }

Log ""
Log "FIM. Log: $logFile" "Cyan"
