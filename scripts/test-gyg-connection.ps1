# Test GetYourGuide API Connection Script
# This script validates the GetYourGuide API connection using curl syntax

Write-Host "🧪 Testing GetYourGuide API Connection..." -ForegroundColor Cyan

# Load environment variables
$envFile = ".env.production"
if (Test-Path $envFile) {
    Write-Host "📁 Loading environment variables from $envFile" -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
} else {
    Write-Host "⚠️  Environment file $envFile not found, using system environment variables" -ForegroundColor Yellow
}

# Get credentials from environment
$GYG_USER = $env:GYG_SUPPLIER_USER
$GYG_PASS = $env:GYG_SUPPLIER_PASS
$GYG_BASE = $env:GYG_SUPPLIER_BASE

if (-not $GYG_USER -or -not $GYG_PASS) {
    Write-Host "❌ Missing credentials: GYG_SUPPLIER_USER or GYG_SUPPLIER_PASS not set" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Credentials loaded successfully" -ForegroundColor Green
Write-Host "   User: $GYG_USER" -ForegroundColor Gray
Write-Host "   Base: $GYG_BASE" -ForegroundColor Gray

# Test payload
$testPayload = @{
    data = @{
        productId = "AGAFAY001"
        availabilities = @(
            @{
                dateTime = "2025-10-15T10:00:00.000Z"
                available = $true
                vacancy = 10
                price = @{
                    currency = "EUR"
                    value = 400
                }
            },
            @{
                dateTime = "2025-10-16T10:00:00.000Z"
                available = $true
                vacancy = 10
                price = @{
                    currency = "EUR"
                    value = 420
                }
            }
        )
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 Sending test payload to GetYourGuide API..." -ForegroundColor Cyan
Write-Host "Payload: $testPayload" -ForegroundColor Gray

# Test with curl equivalent using PowerShell
try {
    $headers = @{
        "Authorization" = "Basic $([Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$GYG_USER`:$GYG_PASS")))"
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$GYG_BASE/notify-availability-update" -Method POST -Body $testPayload -Headers $headers -TimeoutSec 30
    
    Write-Host "✅ GetYourGuide API connection successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ GetYourGuide API connection failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read error response body" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n🔧 Manual curl command for testing:" -ForegroundColor Cyan
Write-Host "curl -u `"$GYG_USER`:$GYG_PASS`" \`" -ForegroundColor Gray
Write-Host "  -H `"Content-Type: application/json`" \`" -ForegroundColor Gray
Write-Host "  -H `"Accept: application/json`" \`" -ForegroundColor Gray
Write-Host "  -d '$testPayload' \`" -ForegroundColor Gray
Write-Host "  `"$GYG_BASE/notify-availability-update`"" -ForegroundColor Gray

Write-Host "`n📋 Environment variables check:" -ForegroundColor Cyan
Write-Host "GYG_SUPPLIER_BASE: $GYG_BASE" -ForegroundColor Gray
Write-Host "GYG_SUPPLIER_USER: $GYG_USER" -ForegroundColor Gray
Write-Host "GYG_SUPPLIER_PASS: $(if($GYG_PASS) { '***' + $GYG_PASS.Substring($GYG_PASS.Length-4) } else { 'NOT SET' })" -ForegroundColor Gray
