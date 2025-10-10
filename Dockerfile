# Optimized Dockerfile for Render deployment
FROM node:20-alpine AS builder

# Set buildkit environment variables
ENV DOCKER_BUILDKIT=0
ENV BUILDKIT_PROGRESS=plain
ENV NODE_ENV=production

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci --legacy-peer-deps --no-audit --no-fund --silent

# Copy source code
COPY client ./client
COPY server ./server
COPY shared ./shared

# Build in order with error handling
RUN npm run build:shared
RUN npm run build:client
RUN npm run build:server

# Runtime stage - minimal image
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=10000

WORKDIR /app

# Copy only necessary files for runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist

# Set working directory to server
WORKDIR /app/server

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 10000) + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]