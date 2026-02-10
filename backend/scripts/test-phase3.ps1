# Get token
$loginBody = '{"email":"test2@test.com","password":"test1234"}'
$loginResp = Invoke-RestMethod -Uri "http://localhost:3003/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $loginResp.token
Write-Host "Token: $($token.Substring(0,20))..."

$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

# Get a client ID
$clients = Invoke-RestMethod -Uri "http://localhost:3003/api/clients" -Headers $headers
$clientId = $clients[0].id
$clientName = $clients[0].name
Write-Host "`nUsing client: $clientName ($clientId)"

# Test 1: Detect Anomalies
Write-Host "`n=== TEST 1: Detect Anomalies ==="
try {
    $anomalies = Invoke-RestMethod -Uri "http://localhost:3003/api/clients/$clientId/detect-anomalies" -Method POST -Headers $headers -Body "{}"
    Write-Host "Anomalies found: $($anomalies.anomalies.Count)"
    Write-Host "Response keys: $($anomalies.PSObject.Properties.Name -join ', ')"
} catch {
    Write-Host "ERROR: $_"
}

# Test 2: List Anomalies
Write-Host "`n=== TEST 2: List Anomalies ==="
try {
    $list = Invoke-RestMethod -Uri "http://localhost:3003/api/clients/$clientId/anomalies?days=30" -Headers $headers
    Write-Host "Recent anomalies: $($list.anomalies.Count)"
} catch {
    Write-Host "ERROR: $_"
}

# Test 3: Campaign Health
Write-Host "`n=== TEST 3: Campaign Health ==="
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3003/api/clients/$clientId/campaign-health" -Headers $headers
    Write-Host "Overall score: $($health.overallScore)"
    Write-Host "Campaigns: $($health.campaigns.Count)"
    if ($health.campaigns.Count -gt 0) {
        $first = $health.campaigns[0]
        Write-Host "  First: $($first.campaignName) - Score: $($first.score), Grade: $($first.grade)"
    }
} catch {
    Write-Host "ERROR: $_"
}

# Test 4: Executive Dashboard
Write-Host "`n=== TEST 4: Executive Dashboard ==="
try {
    $exec = Invoke-RestMethod -Uri "http://localhost:3003/api/dashboard/executive" -Headers $headers
    Write-Host "Total clients: $($exec.clients.Count)"
    Write-Host "KPI keys: $($exec.kpis.PSObject.Properties.Name -join ', ')"
    if ($exec.clients.Count -gt 0) {
        $c = $exec.clients[0]
        Write-Host "  First: $($c.clientName) - Health: $($c.healthGrade), Spend7d: $($c.spend7d)"
    }
} catch {
    Write-Host "ERROR: $_"
}

# Test 5: Weekly Summary
Write-Host "`n=== TEST 5: Weekly Summary ==="
try {
    $summary = Invoke-RestMethod -Uri "http://localhost:3003/api/clients/$clientId/weekly-summary" -Method POST -Headers $headers -Body "{}"
    Write-Host "AI used: $($summary.aiUsed)"
    Write-Host "Week: $($summary.weekStart) to $($summary.weekEnd)"
    Write-Host "Summary: $($summary.summary.Substring(0, [Math]::Min(100, $summary.summary.Length)))..."
    Write-Host "Highlights: $($summary.highlights.Count)"
    Write-Host "Concerns: $($summary.concerns.Count)"
    Write-Host "Next steps: $($summary.nextSteps.Count)"
} catch {
    Write-Host "ERROR: $_"
}

# Test 6: List Weekly Summaries
Write-Host "`n=== TEST 6: List Weekly Summaries ==="
try {
    $summaries = Invoke-RestMethod -Uri "http://localhost:3003/api/clients/$clientId/weekly-summaries?limit=3" -Headers $headers
    Write-Host "Summaries stored: $($summaries.summaries.Count)"
} catch {
    Write-Host "ERROR: $_"
}

Write-Host "`n=== ALL TESTS COMPLETE ==="
