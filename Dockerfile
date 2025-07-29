# MarrakechDunes - Production Dockerfile
# Multi-stage build for optimal deployment

# Stage 1: Build the client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build the server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
COPY shared/ ../shared/
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built assets
COPY --from=client-builder /app/client/dist ./dist/public
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/shared ./shared

# Copy assets and configuration
COPY attached_assets ./attached_assets

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S marrakech -u 1001 && \
    chown -R marrakech:nodejs /app
USER marrakech

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bash -c "node -e \"const http=require('http');const port=process.env.PORT||5000;http.get('http://localhost:'+port+'/api/health',res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1));\""

EXPOSE 5000
CMD ["node", "dist/index.js"]
