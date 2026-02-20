param(
  [string]$BaseUrl = "http://127.0.0.1:3001",
  [string]$Channel = "whatsapp",
  [string]$Secret = "",
  [string]$LeadId = "lead-smoke-test",
  [string]$Recipient = "5511999999999"
)

$uri = "$BaseUrl/api/comercial/relay/$Channel"
$headers = @{ "Content-Type" = "application/json" }
if ($Secret -ne "") {
  $headers["x-relay-secret"] = $Secret
}

$payload = @{
  leadId = $LeadId
  channel = $Channel
  stage = "primeiro_contato"
  templateKey = "smoke_test"
  recipient = $Recipient
  variables = @{ source = "smoke-script" }
  sentAt = (Get-Date).ToString("o")
} | ConvertTo-Json -Depth 5

try {
  $response = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $payload
  Write-Host "Relay smoke OK:" -ForegroundColor Green
  $response | ConvertTo-Json -Depth 5
  exit 0
} catch {
  Write-Host "Relay smoke FAILED:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  if ($_.ErrorDetails.Message) {
    Write-Host $_.ErrorDetails.Message
  }
  exit 1
}
