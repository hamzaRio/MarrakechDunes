# Simple GYG endpoint test
$BASE_URL = "https://marrakechdunes-sppy.onrender.com"
$USERNAME = "MarrakechDunes"
$PASSWORD = "2bfaf87bfbdc4119b575b96c63f272f7facca57e6bb45a48e767f0de9e4ed64"

Write-Host "Testing GYG endpoints..." -ForegroundColor Green

# Test 1: Health endpoint
Write-Host "1. Testing health endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/gyg/1/health" -Method GET
    Write-Host "✅ Health: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get availabilities with auth
Write-Host "2. Testing get-availabilities..." -ForegroundColor Cyan
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$USERNAME`:$PASSWORD"))
$headers = @{ "Authorization" = "Basic $cred" }

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/gyg/1/get-availabilities?product_id=desert-tour-marrakech-001&from=2025-11-10T00:00:00Z&to=2025-11-11T23:59:59Z&currency=MAD" -Method GET -Headers $headers
    Write-Host "✅ Get-availabilities: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Get-availabilities failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Notify endpoint
Write-Host "3. Testing notify-availability-update..." -ForegroundColor Cyan
$notifyBody = @{
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
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/gyg/1/notify-availability-update" -Method POST -Headers $headers -Body $notifyBody
    Write-Host "✅ Notify: $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Notify failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test completed!" -ForegroundColor Yellow
Write-Host ""
Write-Host "If health works but auth fails, check Render environment variables:" -ForegroundColor Yellow
Write-Host "GYG_SUPPLIER_USER and GYG_SUPPLIER_PASS" -ForegroundColor Yellow
