#!/bin/bash

# Optimized build script for Render deployment
set -e

echo "🚀 Starting optimized build process..."

# Set environment variables for build
export NODE_ENV=production
export DOCKER_BUILDKIT=0
export BUILDKIT_PROGRESS=plain

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf node_modules
rm -rf client/node_modules
rm -rf server/node_modules
rm -rf shared/node_modules
rm -rf client/dist
rm -rf server/dist
rm -rf shared/dist

# Install dependencies with optimizations
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps --no-audit --no-fund --silent

# Build shared package first
echo "🔧 Building shared package..."
npm run build:shared

# Build client
echo "🎨 Building client..."
npm run build:client

# Build server
echo "⚙️ Building server..."
npm run build:server

echo "✅ Build completed successfully!"
