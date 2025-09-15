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

# Verify the build output exists (TypeScript outputs to dist/server/ due to rootDir config)
RUN ls -la dist/
RUN ls -la dist/server/ || echo "No server subdirectory found"
RUN test -f dist/server/src/index.js || (echo "ERROR: dist/server/src/index.js not found after build!" && exit 1)

# Copy the built server files to the expected location
RUN cp -r dist/server/src/* dist/ || echo "Failed to copy server files"
RUN cp -r dist/shared/* dist/ || echo "No shared files to copy"

# Copy shared directory to server level for runtime (matches import path ../shared)
RUN cp -r ../shared ./shared

# Copy client build to server for serving static files
RUN mkdir -p ./dist/public && cp -r ../client/dist/* ./dist/public/

# Ensure shared directory is available at runtime
RUN mkdir -p ./dist/shared && cp -r ../shared/* ./dist/shared/

# Final verification that index.js exists in the expected location
RUN ls -la ./dist/
RUN test -f ./dist/index.js || (echo "CRITICAL ERROR: dist/index.js missing after file reorganization!" && exit 1)

# Remove dev dependencies to reduce image size (after build is complete)
# Note: We need to keep TypeScript available until after the build
WORKDIR /app
RUN npm install --omit=dev --legacy-peer-deps

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
