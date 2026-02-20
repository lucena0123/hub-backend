param(
  [string[]]$PublicUrls = @(
    'http://localhost:3001/health',
    'http://localhost:3000/',
    'http://localhost:3000/login',
    'http://localhost:3000/performance',
    'http://localhost:3000/optimization/board',
    'http://localhost:3000/clients'
  ),
  [string[]]$AuthUrls = @(
    'http://localhost:3001/api/optimization/audit?limit=5',
    'http://localhost:3001/api/optimization/audit/summary?sinceHours=24'
  ),
  [switch]$SkipAuth
)

$failed = @()

function Test-Url {
  param(
    [string]$Url,
    [hashtable]$Headers = $null
  )

  try {
    if ($null -ne $Headers) {
      $res = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 12
    } else {
      $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 12
    }

    $ok = $res.StatusCode -ge 200 -and $res.StatusCode -lt 400
    if ($ok) {
      Write-Host "PASS $($res.StatusCode) $Url" -ForegroundColor Green
    } else {
      Write-Host "FAIL $($res.StatusCode) $Url" -ForegroundColor Red
      $script:failed += $Url
    }
  }
  catch {
    Write-Host "FAIL ERR $Url :: $($_.Exception.Message)" -ForegroundColor Red
    $script:failed += $Url
  }
}

foreach ($url in $PublicUrls) {
  Test-Url -Url $url
}

if (-not $SkipAuth) {
  try {
    $email = "smoke$(Get-Random)@local.test"
    $password = 'Smoke123!'
    $body = @{ name = 'Smoke User'; email = $email; password = $password } | ConvertTo-Json
    $register = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/register' -Method Post -ContentType 'application/json' -Body $body
    $token = $register.token

    if (-not $token) {
      throw 'Token não retornado pelo register'
    }

    $headers = @{ Authorization = "Bearer $token" }
    Write-Host "AUTH PASS (register): $email" -ForegroundColor Cyan

    foreach ($url in $AuthUrls) {
      Test-Url -Url $url -Headers $headers
    }
  }
  catch {
    Write-Host "FAIL AUTH :: $($_.Exception.Message)" -ForegroundColor Red
    $failed += 'AUTH_SETUP'
  }
}

Write-Host ""
if ($failed.Count -eq 0) {
  Write-Host 'SMOKE RESULT: PASS' -ForegroundColor Green
  exit 0
}

Write-Host "SMOKE RESULT: FAIL ($($failed.Count) endpoint(s))" -ForegroundColor Red
$failed | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
exit 1
