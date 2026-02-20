param(
  [string]$Vault = "LinaAssistant",
  [string]$Item = "N8N",
  [switch]$WriteEnvFile,
  [string]$OutFile = ".env.dispatch.generated"
)

$op = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\op.exe"
if (!(Test-Path $op)) {
  Write-Error "1Password CLI (op) não encontrado em $op"
  exit 1
}

if (-not $env:OP_SERVICE_ACCOUNT_TOKEN) {
  Write-Error "OP_SERVICE_ACCOUNT_TOKEN não está definido no ambiente."
  exit 1
}

$rawUrl = & $op read "op://$Vault/$Item/add more/dominio"
if (-not $rawUrl) {
  Write-Error "Não foi possível ler o campo dominio do item $Item no vault $Vault."
  exit 1
}

$base = ($rawUrl -replace '/home/workflows.*$','').TrimEnd('/')
$wa = "$base/webhook/hub-dispatch-whatsapp"
$gm = "$base/webhook/hub-dispatch-gmail"

$lines = @(
  "COMMERCIAL_DISPATCH_WHATSAPP_WEBHOOK_URL=`"$wa`"",
  "COMMERCIAL_DISPATCH_GMAIL_WEBHOOK_URL=`"$gm`""
)

$lines | ForEach-Object { Write-Output $_ }

if ($WriteEnvFile) {
  Set-Content -Path $OutFile -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
  Write-Output "Arquivo gerado: $OutFile"
}
