# Simple test script for MarrakechDunes
param(
    [string]$BaseUrl = "https://marrakechdunes.onrender.com"
)

Write-Host "Testing MarrakechDunes endpoints..." -ForegroundColor Cyan

# Test 1: Health Check
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Health Check: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Activities API
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/activities" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Activities API: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Activities API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Auth User (should return 401)
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/user" -UseBasicParsing -TimeoutSec 10
    Write-Host "❌ Auth User: Expected 401, got $($response.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Message -like "*401*") {
        Write-Host "✅ Auth User: Correctly returned 401" -ForegroundColor Green
    } else {
        Write-Host "❌ Auth User: Unexpected error - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Login with Ahmed
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $loginBody = @{
        username = "ahmed"
        password = "Marrakech@2025"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -WebSession $session -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "✅ Login with Ahmed: $($data.username) - $($data.role)" -ForegroundColor Green
        
        # Test 5: Auth User after login
        try {
            $authResponse = Invoke-WebRequest -Uri "$BaseUrl/api/auth/user" -WebSession $session -UseBasicParsing -TimeoutSec 10
            if ($authResponse.StatusCode -eq 200) {
                $authData = $authResponse.Content | ConvertFrom-Json
                Write-Host "✅ Auth User after login: $($authData.username) - $($authData.role)" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ Auth User after login failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Login with Ahmed failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Login with Ahmed error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest completed!" -ForegroundColor Cyan
