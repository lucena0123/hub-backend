param(
  [string[]]$Urls = @(
    'http://localhost:3001/health',
    'http://localhost:3000/',
    'http://localhost:3000/login',
    'http://localhost:3000/performance',
    'http://localhost:3000/optimization/board',
    'http://localhost:3000/clients',
    'http://localhost:3001/api/optimization/audit?limit=5',
    'http://localhost:3001/api/optimization/audit/summary?sinceHours=24'
  )
)

$failed = @()

foreach ($url in $Urls) {
  try {
    $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 12
    $ok = $res.StatusCode -ge 200 -and $res.StatusCode -lt 400
    if ($ok) {
      Write-Host "PASS $($res.StatusCode) $url" -ForegroundColor Green
    } else {
      Write-Host "FAIL $($res.StatusCode) $url" -ForegroundColor Red
      $failed += $url
    }
  }
  catch {
    Write-Host "FAIL ERR $url :: $($_.Exception.Message)" -ForegroundColor Red
    $failed += $url
  }
}

Write-Host ""
if ($failed.Count -eq 0) {
  Write-Host "SMOKE RESULT: PASS" -ForegroundColor Green
  exit 0
}

Write-Host "SMOKE RESULT: FAIL ($($failed.Count) endpoint(s))" -ForegroundColor Red
$failed | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
exit 1
