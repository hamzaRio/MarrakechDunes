# Stage 1: install dependencies and build workspaces
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifests for root and workspaces
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies for the monorepo
RUN npm install --legacy-peer-deps --workspaces

# Copy source code
COPY . .

# Build client and server using workspaces
RUN npm run build

# Stage 2: production image
FROM node:20-alpine AS production
WORKDIR /app

# Copy root and server package manifests
COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm install --legacy-peer-deps --workspaces --omit=dev && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/client/dist ./dist/public
COPY --from=builder /app/shared ./shared

# Persistent assets folder
RUN mkdir -p /attached_assets

# Set permissions for Render's non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S marrakech -u 1001 && \
    chown -R marrakech:nodejs /app
USER marrakech

# Health check for Render
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||5000;http.get('http://localhost:'+port+'/api/health',res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1));"

# Start server
CMD ["node", "dist/index.js"]
