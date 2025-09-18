# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY shared/package*.json ./shared/

# Install dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY server/ ./server/
COPY client/ ./client/
COPY shared/ ./shared/

# Build the client first
WORKDIR /app
RUN npm run build:client

# Build the server with explicit TypeScript compilation
WORKDIR /app/server
RUN npm run build

# Verify the build output exists (TypeScript now outputs to dist/ directly)
RUN ls -la dist/ || echo "No dist directory found"
RUN test -f dist/index.js && echo "✅ index.js found" || (echo "❌ ERROR: dist/index.js not found after build!" && exit 1)

# Server files are now correctly built in dist/ directly
# TypeScript outputs to dist/index.js with the updated tsconfig

# Copy shared directory to server level for runtime
RUN cp -r ../shared ./shared

# Copy client build to server for serving static files (align with Express static path)
RUN mkdir -p ./dist/public && cp -r ../client/dist/* ./dist/public/

# Copy attached_assets to the correct location for Express static serving
RUN mkdir -p ./dist/attached_assets && cp -r ./attached_assets/* ./dist/attached_assets/ 2>/dev/null || echo "No attached_assets to copy"

# Final verification
RUN ls -la ./dist/
RUN test -f ./dist/index.js || (echo "CRITICAL ERROR: dist/index.js missing!" && exit 1)

# Remove dev dependencies to reduce image size (after build is complete)
# Use npm prune instead of npm install to avoid wiping compiled output
WORKDIR /app
RUN npm prune --omit=dev

# Re-verify after dependency cleanup that our built files are still there
WORKDIR /app/server
RUN ls -la ./dist/
RUN test -f ./dist/index.js || (echo "CRITICAL ERROR: dist/index.js missing after cleanup!" && exit 1)

# Expose port
EXPOSE 10000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Start the application
WORKDIR /app/server
CMD ["npm", "start"]
