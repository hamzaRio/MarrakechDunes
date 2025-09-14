$ErrorActionPreference = 'Stop'

Write-Host "Testing Nadia login against http://localhost:10000" -ForegroundColor Cyan

$body = '{"username":"nadia","password":"Marrakech@1966"}'

try {
  $r = Invoke-WebRequest -Method POST -Uri http://localhost:10000/api/auth/login -ContentType application/json -Body $body -UseBasicParsing -TimeoutSec 10
  Write-Host "Status: $($r.StatusCode)" -ForegroundColor Green
  Write-Host $r.Content
} catch {
  Write-Host "Login request failed: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.Exception.Response) { Write-Host ($_.Exception.Response | ConvertTo-Json) }
  exit 1
}


