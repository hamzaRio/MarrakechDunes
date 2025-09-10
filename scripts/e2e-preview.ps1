# MarrakechDunes E2E Preview Script
# Tests deployed frontend (Vercel) and backend (Render) endpoints
# Usage: powershell -ExecutionPolicy Bypass -File "scripts\e2e-preview.ps1" -FrontendUrl "https://marrakech-dunes.vercel.app" -BackendUrl "https://marrakechdunes.onrender.com"

param(
    [string]$FrontendUrl = "https://marrakech-dunes.vercel.app",
    [string]$BackendUrl = "https://marrakechdunes.onrender.com",
    [int]$TimeoutSec = 30
)

# Color functions for output
function Write-Success { param($Message) Write-Host "[PASS] $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "[FAIL] $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }

# Test results tracking
$TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Failures = @()
}

# Generic endpoint testing function with retry logic
function Test-Endpoint {
    param(
        [string]$Method = "GET",
        [string]$Url,
        [string]$Description,
        [object]$Body = $null,
        [int]$Retries = 3,
        [int]$DelaySec = 2
    )
    
    $TestResults.Total++
    Write-Info "Testing: $Description"
    Write-Info "  URL: $Method $Url"
    
    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        try {
            $params = @{
                Uri = $Url
                Method = $Method
                TimeoutSec = $TimeoutSec
                UseBasicParsing = $true
            }
            
            if ($Body) {
                $params.Body = $Body
                $params.ContentType = "application/json"
            }
            
            $response = Invoke-WebRequest @params
            
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                Write-Success "$Description - Status: $($response.StatusCode)"
                $TestResults.Passed++
                return $true
            } else {
                Write-Warning "$Description - Unexpected status: $($response.StatusCode) (attempt $attempt/$Retries)"
            }
        }
        catch {
            $errorMsg = $_.Exception.Message
            if ($attempt -lt $Retries) {
                Write-Warning "$Description - Attempt $attempt/$Retries failed: $errorMsg"
                Write-Info "  Retrying in $DelaySec seconds..."
                Start-Sleep -Seconds $DelaySec
            } else {
                Write-Error "$Description - All attempts failed. Last error: $errorMsg"
                $TestResults.Failed++
                $TestResults.Failures += @{
                    Test = $Description
                    Url = $Url
                    Error = $errorMsg
                }
                return $false
            }
        }
    }
    return $false
}

# Session-aware testing function for endpoints that require cookies
function Test-EndpointWithSession {
    param(
        [string]$Method = "GET",
        [string]$Url,
        [string]$Description,
        [object]$Body = $null,
        [int]$Retries = 3,
        [int]$DelaySec = 2
    )
    
    $TestResults.Total++
    Write-Info "Testing: $Description"
    Write-Info "  URL: $Method $Url"
    
    # Create session for cookie persistence
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    
    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        try {
            $params = @{
                Uri = $Url
                Method = $Method
                TimeoutSec = $TimeoutSec
                UseBasicParsing = $true
                WebSession = $session
            }
            
            if ($Body) {
                $params.Body = $Body
                $params.ContentType = "application/json"
            }
            
            $response = Invoke-WebRequest @params
            
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                Write-Success "$Description - Status: $($response.StatusCode)"
                if ($response.Headers['Set-Cookie']) {
                    Write-Info "  Set-Cookie received: $($response.Headers['Set-Cookie'])"
                }
                if ($session.Cookies.Count -gt 0) {
                    $cookieNames = $session.Cookies | ForEach-Object { $_.Name }
                    Write-Info "  Cookies stored: $($cookieNames -join ', ')"
                }
                $TestResults.Passed++
                return $true
            } else {
                Write-Warning "$Description - Unexpected status: $($response.StatusCode) (attempt $attempt/$Retries)"
            }
        }
        catch {
            $errorMsg = $_.Exception.Message
            if ($attempt -lt $Retries) {
                Write-Warning "$Description - Attempt $attempt/$Retries failed: $errorMsg"
                Write-Info "  Retrying in $DelaySec seconds..."
                Start-Sleep -Seconds $DelaySec
            } else {
                Write-Error "$Description - All attempts failed. Last error: $errorMsg"
                $TestResults.Failed++
                $TestResults.Failures += @{
                    Test = $Description
                    Url = $Url
                    Error = $errorMsg
                }
                return $false
            }
        }
    }
    return $false
}

# Main execution
Write-Host "`nMarrakechDunes E2E Preview Test" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta
Write-Info "Frontend URL: $FrontendUrl"
Write-Info "Backend URL: $BackendUrl"
Write-Info "Timeout: $TimeoutSec seconds"
Write-Info "Retries: 3 attempts with 2-second delay"
Write-Host ""

# Test 1: Backend Health Check
Write-Host "BACKEND HEALTH CHECK" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "$BackendUrl/health" -Description "Backend Health Endpoint"

# Test 2: Backend Activities API
Write-Host "`nBACKEND API TESTS" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "$BackendUrl/api/activities" -Description "Backend Activities API"

# Test 3: Frontend Proxy - Activities
Write-Host "`nFRONTEND PROXY TESTS" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "$FrontendUrl/api/activities" -Description "Frontend Proxy - Activities API"

# Test 4: Session Initialization
Write-Host "`nSESSION & AUTHENTICATION TESTS" -ForegroundColor Yellow
Test-EndpointWithSession -Method "POST" -Url "$FrontendUrl/api/session/init" -Description "Session Initialization"

# Test 5: Authentication Check
Test-EndpointWithSession -Method "GET" -Url "$FrontendUrl/api/auth/user" -Description "Authentication Check"

# Test 6: Asset Fetch
Write-Host "`nASSET SERVING TESTS" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Url "$FrontendUrl/attached_assets/agafaypack1_1751128022717.jpeg" -Description "Asset Fetch via Frontend Proxy"

# Final Summary
Write-Host "`nTEST SUMMARY" -ForegroundColor Magenta
Write-Host "===============" -ForegroundColor Magenta
Write-Info "Total Tests: $($TestResults.Total)"
Write-Success "Passed: $($TestResults.Passed)"
Write-Error "Failed: $($TestResults.Failed)"

if ($TestResults.Failed -gt 0) {
    Write-Host "`nFAILED TESTS:" -ForegroundColor Red
    foreach ($failure in $TestResults.Failures) {
        Write-Error "  • $($failure.Test)"
        Write-Host "    URL: $($failure.Url)" -ForegroundColor Gray
        Write-Host "    Error: $($failure.Error)" -ForegroundColor Gray
    }
    
    Write-Host "`nTROUBLESHOOTING TIPS:" -ForegroundColor Yellow
    Write-Host "  • Check if Render backend is running: $BackendUrl/health" -ForegroundColor Gray
    Write-Host "  • Verify Vercel deployment: $FrontendUrl" -ForegroundColor Gray
    Write-Host "  • Check Vercel rewrites in client/vercel.json" -ForegroundColor Gray
    Write-Host "  • Ensure CORS allows *.vercel.app origins" -ForegroundColor Gray
    Write-Host "  • Verify asset files exist in server/attached_assets/" -ForegroundColor Gray
} else {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Your deployment is ready for production!" -ForegroundColor Green
}

Write-Host "`nQuick Links:" -ForegroundColor Cyan
Write-Host "  Frontend: $FrontendUrl" -ForegroundColor Gray
Write-Host "  Backend: $BackendUrl" -ForegroundColor Gray
Write-Host "  Backend Health: $BackendUrl/health" -ForegroundColor Gray

# Exit with appropriate code
if ($TestResults.Failed -gt 0) {
    exit 1
} else {
    exit 0
}
