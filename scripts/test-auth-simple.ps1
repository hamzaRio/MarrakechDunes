# MarrakechDunes Authentication Test Script
param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$AdminPassword = "admin123",
    [string]$SuperadminPassword = "superadmin123",
    [switch]$Remote
)

if ($Remote) {
    $BaseUrl = "https://marrakechdunes.onrender.com"
    Write-Host "Testing REMOTE server: $BaseUrl" -ForegroundColor Yellow
} else {
    Write-Host "Testing LOCAL server: $BaseUrl" -ForegroundColor Green
}

$TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Failures = @()
}

function Write-TestResult {
    param($Test, $Status, $Details = "")
    $TestResults.Total++
    if ($Status -eq "PASS") {
        Write-Host "✅ $Test" -ForegroundColor Green
        $TestResults.Passed++
    } else {
        Write-Host "❌ $Test" -ForegroundColor Red
        Write-Host "   $Details" -ForegroundColor Red
        $TestResults.Failed++
        $TestResults.Failures += @{
            Test = $Test
            Details = $Details
        }
    }
}

Write-Host ""
Write-Host "🔐 MarrakechDunes Authentication Tests" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host ""
Write-Host "1. Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-TestResult "Health Check" "PASS" "Status: $($response.StatusCode)"
    } else {
        Write-TestResult "Health Check" "FAIL" "Expected 200, got $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Health Check" "FAIL" $_.Exception.Message
}

# Test 2: Auth User (Unauthenticated)
Write-Host ""
Write-Host "2. Auth User (Unauthenticated)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/user" -UseBasicParsing -TimeoutSec 10
    Write-TestResult "Auth User (Unauthenticated)" "FAIL" "Expected 401, got $($response.StatusCode)"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-TestResult "Auth User (Unauthenticated)" "PASS" "Correctly returned 401"
    } else {
        Write-TestResult "Auth User (Unauthenticated)" "FAIL" "Expected 401, got $($_.Exception.Response.StatusCode)"
    }
}

# Test 3: Login with Ahmed (Admin)
Write-Host ""
Write-Host "3. Login with Ahmed (Admin)" -ForegroundColor Yellow
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $loginBody = @{
        username = "ahmed"
        password = $AdminPassword
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -WebSession $session -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.username -eq "ahmed" -and $data.role -eq "admin") {
            Write-TestResult "Login with Ahmed" "PASS" "Status: $($response.StatusCode), User: $($data.username), Role: $($data.role)"
        } else {
            Write-TestResult "Login with Ahmed" "FAIL" "Wrong user data: $($data | ConvertTo-Json)"
        }
    } else {
        Write-TestResult "Login with Ahmed" "FAIL" "Expected 200, got $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Login with Ahmed" "FAIL" $_.Exception.Message
}

# Test 4: Auth User (Authenticated as Ahmed)
Write-Host ""
Write-Host "4. Auth User (Authenticated as Ahmed)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/user" -WebSession $session -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.username -eq "ahmed" -and $data.role -eq "admin") {
            Write-TestResult "Auth User (Ahmed)" "PASS" "Status: $($response.StatusCode), User: $($data.username), Role: $($data.role)"
        } else {
            Write-TestResult "Auth User (Ahmed)" "FAIL" "Wrong user data: $($data | ConvertTo-Json)"
        }
    } else {
        Write-TestResult "Auth User (Ahmed)" "FAIL" "Expected 200, got $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Auth User (Ahmed)" "FAIL" $_.Exception.Message
}

# Test 5: Logout
Write-Host ""
Write-Host "5. Logout" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/logout" -Method POST -WebSession $session -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        Write-TestResult "Logout" "PASS" "Status: $($response.StatusCode)"
    } else {
        Write-TestResult "Logout" "FAIL" "Expected 200, got $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Logout" "FAIL" $_.Exception.Message
}

# Test 6: Auth User (After Logout)
Write-Host ""
Write-Host "6. Auth User (After Logout)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/user" -WebSession $session -UseBasicParsing -TimeoutSec 10
    Write-TestResult "Auth User (After Logout)" "FAIL" "Expected 401, got $($response.StatusCode)"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-TestResult "Auth User (After Logout)" "PASS" "Correctly returned 401 after logout"
    } else {
        Write-TestResult "Auth User (After Logout)" "FAIL" "Expected 401, got $($_.Exception.Response.StatusCode)"
    }
}

# Test 7: Login with Nadia (Superadmin)
Write-Host ""
Write-Host "7. Login with Nadia (Superadmin)" -ForegroundColor Yellow
$session2 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $loginBody = @{
        username = "nadia"
        password = $SuperadminPassword
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -WebSession $session2 -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.username -eq "nadia" -and $data.role -eq "superadmin") {
            Write-TestResult "Login with Nadia" "PASS" "Status: $($response.StatusCode), User: $($data.username), Role: $($data.role)"
        } else {
            Write-TestResult "Login with Nadia" "FAIL" "Wrong user data: $($data | ConvertTo-Json)"
        }
    } else {
        Write-TestResult "Login with Nadia" "FAIL" "Expected 200, got $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Login with Nadia" "FAIL" $_.Exception.Message
}

# Test 8: Auth User (Authenticated as Nadia)
Write-Host ""
Write-Host "8. Auth User (Authenticated as Nadia)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/user" -WebSession $session2 -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.username -eq "nadia" -and $data.role -eq "superadmin") {
            Write-TestResult "Auth User (Nadia)" "PASS" "Status: $($response.StatusCode), User: $($data.username), Role: $($data.role)"
        } else {
            Write-TestResult "Auth User (Nadia)" "FAIL" "Wrong user data: $($data | ConvertTo-Json)"
        }
    } else {
        Write-TestResult "Auth User (Nadia)" "FAIL" "Expected 200, got $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Auth User (Nadia)" "FAIL" $_.Exception.Message
}

# Test 9: Login with Yahia (Admin)
Write-Host ""
Write-Host "9. Login with Yahia (Admin)" -ForegroundColor Yellow
$session3 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $loginBody = @{
        username = "yahia"
        password = $AdminPassword
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -WebSession $session3 -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        if ($data.username -eq "yahia" -and $data.role -eq "admin") {
            Write-TestResult "Login with Yahia" "PASS" "Status: $($response.StatusCode), User: $($data.username), Role: $($data.role)"
        } else {
            Write-TestResult "Login with Yahia" "FAIL" "Wrong user data: $($data | ConvertTo-Json)"
        }
    } else {
        Write-TestResult "Login with Yahia" "FAIL" "Expected 200, got $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Login with Yahia" "FAIL" $_.Exception.Message
}

# Test Summary
Write-Host ""
Write-Host "📊 Test Summary" -ForegroundColor Magenta
Write-Host "===============" -ForegroundColor Magenta
Write-Host "Total Tests: $($TestResults.Total)" -ForegroundColor White
Write-Host "Passed: $($TestResults.Passed)" -ForegroundColor Green
Write-Host "Failed: $($TestResults.Failed)" -ForegroundColor Red

if ($TestResults.Failed -gt 0) {
    Write-Host ""
    Write-Host "❌ Failed Tests:" -ForegroundColor Red
    foreach ($failure in $TestResults.Failures) {
        Write-Host "  • $($failure.Test): $($failure.Details)" -ForegroundColor Red
    }
    exit 1
} else {
    Write-Host ""
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    exit 0
}
