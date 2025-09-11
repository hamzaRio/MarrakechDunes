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

# Test 5: Authentication Check (should return 401 when not logged in)
$TestResults.Total++
Write-Info "Testing: Authentication Check (Unauthenticated)"
Write-Info "  URL: GET $FrontendUrl/api/auth/user"

try {
    $response = Invoke-WebRequest -Uri "$FrontendUrl/api/auth/user" -Method "GET" -TimeoutSec $TimeoutSec -UseBasicParsing
    if ($response.StatusCode -eq 401) {
        Write-Success "Authentication Check (Unauthenticated) - Status: 401 (Expected)"
        $TestResults.Passed++
    } else {
        Write-Warning "Authentication Check (Unauthenticated) - Unexpected status: $($response.StatusCode)"
        $TestResults.Failed++
        $TestResults.Failures += @{
            Test = "Authentication Check (Unauthenticated)"
            Url = "$FrontendUrl/api/auth/user"
            Error = "Expected 401, got $($response.StatusCode)"
        }
    }
} catch {
    if ($_.Exception.Message -like "*401*") {
        Write-Success "Authentication Check (Unauthenticated) - Status: 401 (Expected)"
        $TestResults.Passed++
    } else {
        Write-Error "Authentication Check (Unauthenticated) - Error: $($_.Exception.Message)"
        $TestResults.Failed++
        $TestResults.Failures += @{
            Test = "Authentication Check (Unauthenticated)"
            Url = "$FrontendUrl/api/auth/user"
            Error = $_.Exception.Message
        }
    }
}

# Test 6: Admin Login Test (with real credentials)
$TestResults.Total++
Write-Info "Testing: Admin Login Test"
Write-Info "  URL: POST $FrontendUrl/api/auth/login"

$loginSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    # Try to login with admin credentials (using environment variables or defaults)
    $adminUsername = if ($env:ADMIN_USERNAME) { $env:ADMIN_USERNAME } else { "ahmed" }
    $adminPassword = if ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "Marrakech@2025" }
    
    $loginBody = @{
        username = $adminUsername
        password = $adminPassword
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "$FrontendUrl/api/auth/login" -Method "POST" -TimeoutSec $TimeoutSec -UseBasicParsing -WebSession $loginSession -ContentType "application/json" -Body $loginBody
    
    if ($loginResponse.StatusCode -eq 200) {
        $loginData = $loginResponse.Content | ConvertFrom-Json
        Write-Info "  Login successful: $($loginData.user.username) ($($loginData.user.role))"
        
        # Test auth/user after login
        $authResponse = Invoke-WebRequest -Uri "$FrontendUrl/api/auth/user" -Method "GET" -TimeoutSec $TimeoutSec -UseBasicParsing -WebSession $loginSession
        if ($authResponse.StatusCode -eq 200) {
            $authData = $authResponse.Content | ConvertFrom-Json
            Write-Success "Admin Login Test - Status: 200, User: $($authData.username), Role: $($authData.role)"
            $TestResults.Passed++
            
            # Test protected admin endpoint
            $adminResponse = Invoke-WebRequest -Uri "$FrontendUrl/api/admin/bookings" -Method "GET" -TimeoutSec $TimeoutSec -UseBasicParsing -WebSession $loginSession
            if ($adminResponse.StatusCode -eq 200) {
                Write-Success "Admin Protected Route Test - Status: 200 (Access granted)"
            } else {
                Write-Warning "Admin Protected Route Test - Status: $($adminResponse.StatusCode)"
            }
            
            # Test logout
            $logoutResponse = Invoke-WebRequest -Uri "$FrontendUrl/api/auth/logout" -Method "POST" -TimeoutSec $TimeoutSec -UseBasicParsing -WebSession $loginSession
            if ($logoutResponse.StatusCode -eq 200) {
                Write-Success "Admin Logout Test - Status: 200 (Logout successful)"
                
                # Test auth/user after logout (should return 401)
                try {
                    $postLogoutAuth = Invoke-WebRequest -Uri "$FrontendUrl/api/auth/user" -Method "GET" -TimeoutSec $TimeoutSec -UseBasicParsing -WebSession $loginSession
                    Write-Warning "Post-Logout Auth Test - Unexpected status: $($postLogoutAuth.StatusCode)"
                } catch {
                    if ($_.Exception.Message -like "*401*") {
                        Write-Success "Post-Logout Auth Test - Status: 401 (Expected - user logged out)"
                    } else {
                        Write-Warning "Post-Logout Auth Test - Error: $($_.Exception.Message)"
                    }
                }
            } else {
                Write-Warning "Admin Logout Test - Status: $($logoutResponse.StatusCode)"
            }
        } else {
            Write-Warning "Admin Login Test - Auth check failed: $($authResponse.StatusCode)"
            $TestResults.Failed++
            $TestResults.Failures += @{
                Test = "Admin Login Test"
                Url = "$FrontendUrl/api/auth/user"
                Error = "Expected 200 after login, got $($authResponse.StatusCode)"
            }
        }
    } else {
        Write-Warning "Admin Login Test - Login failed: $($loginResponse.StatusCode)"
        $TestResults.Failed++
        $TestResults.Failures += @{
            Test = "Admin Login Test"
            Url = "$FrontendUrl/api/auth/login"
            Error = "Login returned $($loginResponse.StatusCode)"
        }
    }
} catch {
    Write-Error "Admin Login Test - Error: $($_.Exception.Message)"
    $TestResults.Failed++
    $TestResults.Failures += @{
        Test = "Admin Login Test"
        Url = "$FrontendUrl/api/auth/login"
        Error = $_.Exception.Message
    }
}

# Test 7: Protected Route Access (Unauthenticated)
$TestResults.Total++
Write-Info "Testing: Protected Route Access (Unauthenticated)"
Write-Info "  URL: GET $FrontendUrl/api/admin/bookings"

try {
    $protectedResponse = Invoke-WebRequest -Uri "$FrontendUrl/api/admin/bookings" -Method "GET" -TimeoutSec $TimeoutSec -UseBasicParsing
    Write-Warning "Protected Route Test - Unexpected status: $($protectedResponse.StatusCode)"
    $TestResults.Failed++
    $TestResults.Failures += @{
        Test = "Protected Route Access (Unauthenticated)"
        Url = "$FrontendUrl/api/admin/bookings"
        Error = "Expected 401/403, got $($protectedResponse.StatusCode)"
    }
} catch {
    if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*403*") {
        Write-Success "Protected Route Access (Unauthenticated) - Status: 401/403 (Expected - access denied)"
        $TestResults.Passed++
    } else {
        Write-Error "Protected Route Access (Unauthenticated) - Error: $($_.Exception.Message)"
        $TestResults.Failed++
        $TestResults.Failures += @{
            Test = "Protected Route Access (Unauthenticated)"
            Url = "$FrontendUrl/api/admin/bookings"
            Error = $_.Exception.Message
        }
    }
}

# Test 8: Asset Fetch
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
