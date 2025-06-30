#!/bin/bash

# MarrakechDunes Deployment Script
# Usage: ./scripts/deploy.sh [frontend|backend|all]

set -e

echo "🚀 MarrakechDunes Deployment Script"
echo "======================================"

DEPLOY_TYPE=${1:-all}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_error "Git repository not initialized. Run 'git init' first."
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build frontend
if [ "$DEPLOY_TYPE" = "frontend" ] || [ "$DEPLOY_TYPE" = "all" ]; then
    print_status "Building frontend..."
    npm run build:client
    
    # Check if Vercel is configured
    if command -v vercel &> /dev/null; then
        print_status "Deploying to Vercel..."
        vercel --prod
    else
        print_warning "Vercel CLI not found. Install with: npm i -g vercel"
    fi
fi

# Build backend
if [ "$DEPLOY_TYPE" = "backend" ] || [ "$DEPLOY_TYPE" = "all" ]; then
    print_status "Building backend..."
    npm run build:server
    
    print_warning "Backend deployment requires manual setup on Render"
    print_warning "Visit: https://dashboard.render.com and connect your repository"
fi

# Commit and push changes
if [ -n "$(git status --porcelain)" ]; then
    print_status "Committing changes..."
    git add .
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin main
else
    print_status "No changes to commit"
fi

print_status "Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Frontend: Connect repository to Vercel"
echo "2. Backend: Connect repository to Render"
echo "3. Database: Configure MongoDB Atlas connection"
echo "4. Environment: Set production environment variables"