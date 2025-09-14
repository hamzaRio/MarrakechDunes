param(
  [string]$EnvFile,
  [switch]$Silent
)

$ErrorActionPreference = 'Stop'

function Resolve-EnvFile {
  param([string]$Requested)

  if ($Requested) { return $Requested }

  $nodeEnv = $env:NODE_ENV
  if (-not $nodeEnv -or $nodeEnv -eq '') { $nodeEnv = 'development' }

  if ($nodeEnv -eq 'production') {
    if (Test-Path '.env.production') { return '.env.production' }
  } else {
    if (Test-Path '.env') { return '.env' }
  }

  # Fallbacks
  if (Test-Path '.env') { return '.env' }
  if (Test-Path '.env.production') { return '.env.production' }
  if (Test-Path '.env.example') { return '.env.example' }
  if (Test-Path 'env.production.example') { return 'env.production.example' }
  return $null
}

function Load-EnvFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) { return }

  $lines = Get-Content -LiteralPath $Path
  foreach ($line in $lines) {
    if ($line.Trim().StartsWith('#') -or [string]::IsNullOrWhiteSpace($line)) { continue }
    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { continue }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    # Strip surrounding quotes
    if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    # Expand simple ${VAR} references if present
    $val = [System.Text.RegularExpressions.Regex]::Replace($val, '\$\{([^}]+)\}', {
      param($m)
      $ref = $m.Groups[1].Value
      try { (Get-Item -ErrorAction SilentlyContinue -Path "Env:$ref").Value } catch { '' }
    })
    if (-not (Test-Path "Env:$key")) {
      Set-Item -Path "Env:$key" -Value $val | Out-Null
    }
  }
}

$file = Resolve-EnvFile -Requested $EnvFile
if (-not $file) {
  if (-not $Silent) { Write-Host 'No .env file found to load' -ForegroundColor Yellow }
  exit 0
}

if (-not $Silent) { Write-Host "Loading env from $file" -ForegroundColor Cyan }
Load-EnvFile -Path $file

if (-not $Silent) { Write-Host 'Env loaded.' -ForegroundColor Green }

# Optional: verify presence of common env files (no injection changes)
$verify = @('.env', '.env.production', '.env.test', 'server/.env', 'client/.env', '.env.example', 'env.production.example')
foreach ($vf in $verify) {
  if (Test-Path $vf) { if (-not $Silent) { Write-Host "found: $vf" -ForegroundColor DarkGray } } else { if (-not $Silent) { Write-Host "missing: $vf" -ForegroundColor DarkGray } }
}

