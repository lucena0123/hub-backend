param(
  [string]$ApiUrl = 'http://localhost:3001',
  [string]$FrontendUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'
$failed = @()

function Test-Endpoint {
  param(
    [string]$Url,
    [hashtable]$Headers = $null,
    [string]$Label = $Url
  )

  try {
    if ($Headers) {
      $res = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 12
    }
    else {
      $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 12
    }

    if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 400) {
      Write-Host "PASS $($res.StatusCode) $Label" -ForegroundColor Green
    }
    else {
      Write-Host "FAIL $($res.StatusCode) $Label" -ForegroundColor Red
      $script:failed += $Label
    }
  }
  catch {
    Write-Host "FAIL ERR $Label :: $($_.Exception.Message)" -ForegroundColor Red
    $script:failed += $Label
  }
}

Write-Host '== Public checks ==' -ForegroundColor Cyan
Test-Endpoint -Url "$ApiUrl/health" -Label 'API /health'
Test-Endpoint -Url "$FrontendUrl/" -Label 'Frontend /'
Test-Endpoint -Url "$FrontendUrl/performance" -Label 'Frontend /performance'
Test-Endpoint -Url "$FrontendUrl/optimization/board" -Label 'Frontend /optimization/board'

Write-Host ''
Write-Host '== Auth checks ==' -ForegroundColor Cyan

try {
  $email = "stackcheck$(Get-Random)@local.test"
  $password = 'StackCheck123!'
  $body = @{ name = 'Stack Check'; email = $email; password = $password } | ConvertTo-Json

  $register = Invoke-RestMethod -Uri "$ApiUrl/api/auth/register" -Method Post -ContentType 'application/json' -Body $body
  $token = $register.token

  if (-not $token) { throw 'Token não retornado pelo register.' }

  $headers = @{ Authorization = "Bearer $token" }
  Write-Host "AUTH PASS ($email)" -ForegroundColor Cyan

  Test-Endpoint -Url "$ApiUrl/api/optimization/audit?limit=5" -Headers $headers -Label 'API /api/optimization/audit'
  Test-Endpoint -Url "$ApiUrl/api/optimization/audit/summary?sinceHours=24" -Headers $headers -Label 'API /api/optimization/audit/summary'
}
catch {
  Write-Host "FAIL AUTH :: $($_.Exception.Message)" -ForegroundColor Red
  $failed += 'AUTH_SETUP'
}

Write-Host ''
if ($failed.Count -eq 0) {
  Write-Host 'STACK CHECK RESULT: PASS' -ForegroundColor Green
  exit 0
}

Write-Host "STACK CHECK RESULT: FAIL ($($failed.Count))" -ForegroundColor Red
$failed | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
exit 1
