param(
  [string]$Distro = 'Ubuntu'
)

$ErrorActionPreference = 'Stop'
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$reportPath = Join-Path (Get-Location) "docs/ops-validation-latest.md"

function Section($title) {
  "`n## $title`n"
}

$lines = @()
$lines += "# Ops Validation Report"
$lines += "- Generated at: $timestamp"
$lines += "- Distro: $Distro"

try {
  $dockerPs = wsl -d $Distro -e bash -lc "docker ps --format '{{.Names}}|{{.Status}}'"
  $lines += Section 'Docker Containers'
  if ($dockerPs) {
    $dockerPs | ForEach-Object {
      $parts = $_ -split '\|',2
      if ($parts.Count -eq 2) { $lines += "- $($parts[0]): $($parts[1])" }
    }
  } else {
    $lines += '- Nenhum container em execução.'
  }
}
catch {
  $lines += Section 'Docker Containers'
  $lines += "- Falha ao consultar Docker: $($_.Exception.Message)"
}

$lines += Section 'Smoke'
try {
  $smokeOutput = powershell -ExecutionPolicy Bypass -File .\scripts\smoke-local.ps1 2>&1
  $smokeOutput | ForEach-Object { $lines += "- $_" }
}
catch {
  $lines += "- Falha ao rodar smoke: $($_.Exception.Message)"
}

$lines += Section 'Conclusion'
if ($smokeOutput -match 'SMOKE RESULT: PASS') {
  $lines += '- PASS: stack e rotas criticas validadas.'
} else {
  $lines += '- FAIL: revisar saída do smoke acima.'
}

$lines -join "`n" | Set-Content -Path $reportPath -Encoding UTF8
Write-Output "REPORT_OK $reportPath"
