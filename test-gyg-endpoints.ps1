# GYG Supplier API Test Script
# Tests the GetYourGuide supplier endpoints with Basic Auth

$BASE_URL = "https://marrakechdunes-sppy.onrender.com"
$USER = "MarrakechDunes"
$PASS = "2bfaf87bfbdc4119b575b96c63f272f7facca57e6bb45a48e767f0de9e4ed64"

Write-Host "🧪 Testing GYG Supplier API Endpoints" -ForegroundColor Green
Write-Host "Base URL: $BASE_URL" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health endpoint (no auth required)
Write-Host "1️⃣ Testing GET /gyg/1/health (no auth)" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/gyg/1/health" -Method GET
    Write-Host "✅ Health check passed: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Notify availability update
Write-Host "2️⃣ Testing POST /gyg/1/notify-availability-update" -ForegroundColor Cyan
$payload = @{
    product_id = "desert-tour-marrakech-001"
    date = "2025-11-10"
    slots = @(
        @{
            start_time = "2025-11-10T09:00:00Z"
            end_time = "2025-11-10T12:00:00Z"
            total_available = 10
            price_per_person = 480
            categories = @{
                ADULT = @{ min = 1; max = 16 }
                CHILD = @{ min = 0; max = 8 }
            }
        },
        @{
            start_time = "2025-11-10T15:00:00Z"
            end_time = "2025-11-10T18:00:00Z"
            total_available = 10
            price_per_person = 480
            categories = @{
                ADULT = @{ min = 1; max = 16 }
                CHILD = @{ min = 0; max = 8 }
            }
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/gyg/1/notify-availability-update" -Method POST -Body $payload -ContentType "application/json" -Credential (New-Object System.Management.Automation.PSCredential($USER, (ConvertTo-SecureString $PASS -AsPlainText -Force)))
    Write-Host "✅ Notify availability update passed: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Notify availability update failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get availabilities
Write-Host "3️⃣ Testing GET /gyg/1/get-availabilities" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/gyg/1/get-availabilities?product_id=desert-tour-marrakech-001&from=2025-11-10&to=2025-11-11&currency=MAD" -Method GET -Credential (New-Object System.Management.Automation.PSCredential($USER, (ConvertTo-SecureString $PASS -AsPlainText -Force)))
    Write-Host "✅ Get availabilities passed:" -ForegroundColor Green
    Write-Host $($response | ConvertTo-Json -Depth 10) -ForegroundColor White
} catch {
    Write-Host "❌ Get availabilities failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 GYG Supplier API Testing Complete!" -ForegroundColor Green
