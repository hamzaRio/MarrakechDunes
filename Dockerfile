# Builder stage
FROM node:20-alpine AS builder

# Set buildkit environment variables to avoid connection issues
ENV DOCKER_BUILDKIT=0
ENV BUILDKIT_PROGRESS=plain

WORKDIR /app

# Copy workspace manifests
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
COPY shared/package*.json shared/

# Install dependencies across workspaces with explicit cache configuration
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# Copy source code
COPY client client
COPY server server
COPY shared shared

# Copy environment files separately for proper separation (handled at runtime)
# Environment files should be mounted or configured at deployment time

# Build shared package before others with explicit error handling
RUN npm run build:shared || (echo "Shared build failed" && exit 1)
RUN npm run build:client || (echo "Client build failed" && exit 1)
RUN npm run build:server || (echo "Server build failed" && exit 1)

# Prepare server runtime assets (frontend build only - static assets served by Vercel)
WORKDIR /app/server
RUN mkdir -p dist/public && cp -r ../client/dist/. dist/public/

# Strip development dependencies
WORKDIR /app
RUN npm prune --omit=dev

# Runtime stage
FROM node:20-alpine AS runner

ENV NODE_ENV=production
# PORT will be provided by Render dynamically

WORKDIR /app

# Copy production dependencies and workspace outputs
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist

COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
# attached_assets no longer copied - static assets served by frontend

COPY --from=builder /app/client/dist ./client/dist

EXPOSE $PORT
WORKDIR /app/server

CMD ["node", "dist/index.js"]
