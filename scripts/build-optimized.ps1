# Optimized build script for Render deployment
Write-Host "🚀 Starting optimized build process..." -ForegroundColor Green

# Set environment variables for build
$env:NODE_ENV = "production"
$env:DOCKER_BUILDKIT = "0"
$env:BUILDKIT_PROGRESS = "plain"

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "client/node_modules") { Remove-Item -Recurse -Force "client/node_modules" }
if (Test-Path "server/node_modules") { Remove-Item -Recurse -Force "server/node_modules" }
if (Test-Path "shared/node_modules") { Remove-Item -Recurse -Force "shared/node_modules" }
if (Test-Path "client/dist") { Remove-Item -Recurse -Force "client/dist" }
if (Test-Path "server/dist") { Remove-Item -Recurse -Force "server/dist" }
if (Test-Path "shared/dist") { Remove-Item -Recurse -Force "shared/dist" }

# Install dependencies with optimizations
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm ci --legacy-peer-deps --no-audit --no-fund --silent

# Build shared package first
Write-Host "🔧 Building shared package..." -ForegroundColor Cyan
npm run build:shared

# Build client
Write-Host "🎨 Building client..." -ForegroundColor Magenta
npm run build:client

# Build server
Write-Host "⚙️ Building server..." -ForegroundColor Red
npm run build:server

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
