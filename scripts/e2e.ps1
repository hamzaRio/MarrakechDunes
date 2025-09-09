param(
  [string]$FrontEndUrl = $env:FRONTEND_URL,
  [string]$BackEndUrl  = $env:BACKEND_URL,
  [int]$TimeoutSec     = 12
)

if (-not $FrontEndUrl) { $FrontEndUrl = "https://marrakech-dunes.vercel.app" }
if (-not $BackEndUrl)  { $BackEndUrl  = "https://marrakechdunes.onrender.com" }

$stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
$ReportDir  = "test-reports"
$ReportPath = "$ReportDir\e2e-$stamp.txt"
New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null

$HadError = $false
function Log($m){ $l="[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"),$m; Write-Host $l; Add-Content -Path $ReportPath -Value $l }
function Section($t){ Log ""; Log "===== $t =====" }
function Fail($m,$fix){ Log "FAIL: $m"; if($fix){ Log "NEXT: $fix" }; $script:HadError = $true }
function TryRest($Method,$Url,$Body=$null){
  try{
    $params=@{Method=$Method;Uri=$Url;TimeoutSec=$TimeoutSec;ErrorAction='Stop'}
    if($Body){$params.Body=$Body;$params.ContentType="application/json"}
    $r = Invoke-RestMethod @params
    return @{ ok=$true; data=$r }
  }catch{
    return @{ ok=$false; err=$_.Exception.Message }
  }
}
function TryWeb($Method,$Url,$Session){
  try{
    $r = Invoke-WebRequest -Method $Method -Uri $Url -WebSession $Session -TimeoutSec $TimeoutSec -ErrorAction Stop
    return @{ ok=$true; resp=$r }
  }catch{
    return @{ ok=$false; err=$_.Exception.Message }
  }
}

Section "ENV"
Log "FRONTEND_URL: $FrontEndUrl"
Log "BACKEND_URL : $BackEndUrl"
Log "TIMEOUT_SEC : $TimeoutSec"

Section "HEALTH"
$h = TryRest GET "$BackEndUrl/health"
if(-not $h.ok){ Fail "Backend /health not OK: $($h.err)" "Ensure Render is live & /health reachable" } else { Log "Backend /health OK" }

Section "ASSET DISCOVERY"
$assetPath = Join-Path -Path "server" -ChildPath "attached_assets"
$SampleAsset = $null
if (Test-Path $assetPath){
  $file = Get-ChildItem $assetPath -File | Select-Object -First 1
  if($file){ $SampleAsset = $file.Name; Log "Local asset selected: $SampleAsset" }
}
if(-not $SampleAsset){
  $SampleAsset = "favicon.ico"
  Log "No local asset found, using fallback: $SampleAsset"
}

Section "BACKEND API"
$be = TryRest GET "$BackEndUrl/api/activities"
if(-not $be.ok -or -not $be.data){ 
  Fail "GET backend /api/activities failed: $($be.err)" "Check MongoDB, seed, server logs" 
} else {
  Log "Backend activities count: $($be.data.Count)"
}

Section "PROXY API VIA FRONTEND"
$fe = TryRest GET "$FrontEndUrl/api/activities"
if(-not $fe.ok -or -not $fe.data){
  Fail "GET frontend /api/activities via Vercel proxy failed: $($fe.err)" "Redeploy Vercel & verify vercel.json rewrites; VITE_API_URL must be /api"
} else {
  Log "Frontend(proxied) activities count: $($fe.data.Count)"
}

Section "SESSION + COOKIE"
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$init = TryWeb "POST" "$FrontEndUrl/api/session/init" $webSession
if(-not $init.ok){
  Fail "POST /api/session/init failed: $($init.err)" "Ensure session route mounted & CORS { credentials: true } with *.vercel.app origins"
} else {
  $sc = $init.resp.Headers['Set-Cookie']
  if($sc){ Log "Set-Cookie received: $sc" } else { Log "No Set-Cookie header visible (may still store cookie)" }
  if($webSession.Cookies.Count -gt 0){ Log "Cookies stored: $($webSession.Cookies | % { $_.Name } | Out-String)" }
}

$auth = TryWeb "GET" "$FrontEndUrl/api/auth/user" $webSession
if($auth.ok){ Log "GET /api/auth/user status: $($auth.resp.StatusCode)" }
else{ Log "GET /api/auth/user error: $($auth.err)" }

Section "ASSET VIA PROXY"
$assetUrl = "$FrontEndUrl/attached_assets/$SampleAsset"
$a = TryWeb "GET" $assetUrl $webSession
if(-not $a.ok){
  Fail "Asset fetch failed: $($a.err)" "Redeploy Vercel & confirm rewrite for /attached_assets; confirm filename exists on Render"
} else {
  Log "Asset OK: $assetUrl | HTTP $($a.resp.StatusCode)"
}

Section "SUMMARY"
if($HadError){
  Log "=== RESULT: FAILED ==="
  Log "See NEXT steps above for each failure."
  exit 1
} else {
  Log "=== RESULT: ALL CHECKS PASSED ==="
  exit 0
}
