param(
  [string]$ApiUrl = 'http://localhost:3001',
  [string]$FrontendUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'
$failed = @()

function Test-Url {
  param(
    [string]$Label,
    [string]$Url
  )

  try {
    $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 12
    if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 400) {
      Write-Host "PASS $($res.StatusCode) $Label" -ForegroundColor Green
    } else {
      Write-Host "FAIL $($res.StatusCode) $Label" -ForegroundColor Red
      $script:failed += $Label
    }
  }
  catch {
    Write-Host "FAIL ERR $Label :: $($_.Exception.Message)" -ForegroundColor Red
    $script:failed += $Label
  }
}

Write-Host '== Cross-screen check ==' -ForegroundColor Cyan
Test-Url -Label 'API /health' -Url "$ApiUrl/health"
Test-Url -Label 'Frontend /' -Url "$FrontendUrl/"
Test-Url -Label 'Frontend /clients' -Url "$FrontendUrl/clients"
Test-Url -Label 'Frontend /performance' -Url "$FrontendUrl/performance"
Test-Url -Label 'Frontend /optimization/board' -Url "$FrontendUrl/optimization/board"
Test-Url -Label 'Frontend /optimization/settings' -Url "$FrontendUrl/optimization/settings"
Test-Url -Label 'Frontend /optimization/effectiveness' -Url "$FrontendUrl/optimization/effectiveness"

Write-Host ''
if ($failed.Count -eq 0) {
  Write-Host 'CROSS SCREEN RESULT: PASS' -ForegroundColor Green
  exit 0
}

Write-Host "CROSS SCREEN RESULT: FAIL ($($failed.Count))" -ForegroundColor Red
$failed | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
exit 1
