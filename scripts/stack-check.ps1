param(
    [string]$WslDistro = "Ubuntu",
    [string]$BackendBaseUrl = "http://127.0.0.1:8080",
    [string]$FrontendUrl = "http://127.0.0.1:5173",
    [string]$HealthPath = "/health",
    [string]$RegisterPath = "/api/auth/register",
    [string]$LoginPath = "/api/auth/login",
    [string[]]$AuditPaths = @("/api/audits", "/api/audit-logs", "/api/audit/logs")
)

$ErrorActionPreference = "Stop"

function Quote-ForBashSingle {
    param([string]$Value)
    return "'" + ($Value -replace "'", "'\"'\"'") + "'"
}

function Invoke-WslCurl {
    param(
        [string]$Distro,
        [string]$Method,
        [string]$Url,
        [string]$Body = "",
        [hashtable]$Headers = @{}
    )

    $headerArgs = @()
    foreach ($k in $Headers.Keys) {
        $headerArgs += "-H " + (Quote-ForBashSingle "$k: $($Headers[$k])")
    }
    $headerPart = ($headerArgs -join " ")
    $bodyPart = ""
    if ($Body) {
        $bodyPart = "-d " + (Quote-ForBashSingle $Body)
    }

    $qUrl = Quote-ForBashSingle $Url
    $script = "curl -sS -X $Method $headerPart $bodyPart --max-time 15 -w ' HTTPSTATUS:%{http_code}' $qUrl"
    $raw = (& wsl -d $Distro bash -lc $script) | Out-String
    if ($LASTEXITCODE -ne 0) {
        return @{ Code = 0; Body = ""; Raw = $raw }
    }

    $trimmed = $raw.Trim()
    $m = [regex]::Match($trimmed, "HTTPSTATUS:(\d{3})$")
    if (-not $m.Success) {
        return @{ Code = 0; Body = $trimmed; Raw = $trimmed }
    }

    $code = [int]$m.Groups[1].Value
    $body = $trimmed.Substring(0, $trimmed.Length - $m.Value.Length).Trim()
    return @{ Code = $code; Body = $body; Raw = $trimmed }
}

function Try-ExtractToken {
    param([string]$Body)
    if (-not $Body) { return $null }
    try {
        $obj = $Body | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        return $null
    }

    if ($obj.token) { return [string]$obj.token }
    if ($obj.accessToken) { return [string]$obj.accessToken }
    if ($obj.jwt) { return [string]$obj.jwt }
    if ($obj.data -and $obj.data.token) { return [string]$obj.data.token }
    if ($obj.data -and $obj.data.accessToken) { return [string]$obj.data.accessToken }
    if ($obj.user -and $obj.user.token) { return [string]$obj.user.token }
    return $null
}

$checks = New-Object System.Collections.Generic.List[object]
function Add-Check {
    param(
        [string]$Name,
        [bool]$Pass,
        [string]$Detail
    )
    $checks.Add([PSCustomObject]@{
            Name   = $Name
            Pass   = $Pass
            Detail = $Detail
        })
}

$healthUrl = "$BackendBaseUrl$HealthPath"
$frontendRoot = $FrontendUrl
$registerUrl = "$BackendBaseUrl$RegisterPath"
$loginUrl = "$BackendBaseUrl$LoginPath"

$health = Invoke-WslCurl -Distro $WslDistro -Method "GET" -Url $healthUrl
Add-Check -Name "Backend health" -Pass ($health.Code -ge 200 -and $health.Code -lt 300) -Detail "HTTP $($health.Code) em $healthUrl"

$front = Invoke-WslCurl -Distro $WslDistro -Method "GET" -Url $frontendRoot
Add-Check -Name "Frontend root" -Pass ($front.Code -ge 200 -and $front.Code -lt 400) -Detail "HTTP $($front.Code) em $frontendRoot"

$email = "ops." + (Get-Date -Format "yyyyMMddHHmmss") + "@local.test"
$password = "Ops@123456"
$registerPayload = @{
    email    = $email
    password = $password
    name     = "Ops Check"
} | ConvertTo-Json -Compress

$register = Invoke-WslCurl -Distro $WslDistro -Method "POST" -Url $registerUrl -Body $registerPayload -Headers @{ "Content-Type" = "application/json" }
$registerPass = ($register.Code -eq 200 -or $register.Code -eq 201 -or $register.Code -eq 409)
Add-Check -Name "Auth register bootstrap" -Pass $registerPass -Detail "HTTP $($register.Code) em $registerUrl"

$token = Try-ExtractToken -Body $register.Body
if (-not $token) {
    $loginPayload = @{
        email    = $email
        password = $password
    } | ConvertTo-Json -Compress
    $login = Invoke-WslCurl -Distro $WslDistro -Method "POST" -Url $loginUrl -Body $loginPayload -Headers @{ "Content-Type" = "application/json" }
    Add-Check -Name "Auth login fallback" -Pass ($login.Code -eq 200 -or $login.Code -eq 201) -Detail "HTTP $($login.Code) em $loginUrl"
    $token = Try-ExtractToken -Body $login.Body
}
else {
    Add-Check -Name "Auth token no register" -Pass $true -Detail "Token recebido no response de register"
}

if (-not $token) {
    Add-Check -Name "Token disponivel para auditoria" -Pass $false -Detail "Sem token de autenticao para testar endpoints de auditoria"
}
else {
    Add-Check -Name "Token disponivel para auditoria" -Pass $true -Detail "Token pronto para chamadas autenticadas"
    foreach ($path in $AuditPaths) {
        $url = "$BackendBaseUrl$path"
        $audit = Invoke-WslCurl -Distro $WslDistro -Method "GET" -Url $url -Headers @{ "Authorization" = "Bearer $token" }
        $ok = ($audit.Code -ge 200 -and $audit.Code -lt 300)
        Add-Check -Name "Audit endpoint $path" -Pass $ok -Detail "HTTP $($audit.Code) em $url"
    }
}

Write-Host ""
Write-Host "Resumo dos checks:"
foreach ($c in $checks) {
    $status = if ($c.Pass) { "PASS" } else { "FAIL" }
    Write-Host "[$status] $($c.Name) - $($c.Detail)"
}

$fails = @($checks | Where-Object { -not $_.Pass })
Write-Host ""
if ($fails.Count -eq 0) {
    Write-Host "RESULTADO FINAL: PASS"
    exit 0
}
else {
    Write-Host "RESULTADO FINAL: FAIL ($($fails.Count) item(ns) com falha)"
    exit 1
}
