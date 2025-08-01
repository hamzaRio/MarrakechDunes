# ===============================
# Stage 1: Build the client
# ===============================
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Install client dependencies
COPY client/package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install zod --legacy-peer-deps

# Copy and build client
COPY shared/ ../shared/
COPY scripts/ ../scripts/
COPY client/ ./
RUN npm run build

# ===============================
# Stage 2: Build the server
# ===============================
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Install ALL server dependencies (including dev for build)
COPY server/package*.json ./
RUN npm install --legacy-peer-deps

# Copy server source and build it
COPY shared/ ../shared/
COPY server/ ./
COPY vite.config.* ../
RUN npm run build

# ===============================
# Stage 3: Production runtime
# ===============================
FROM node:20-alpine AS production
WORKDIR /app

# Copy ONLY server's package.json so production deps match server needs
COPY server/package*.json ./

# Install production dependencies (includes dotenv + zod now)
RUN npm install --legacy-peer-deps --omit=dev && npm cache clean --force

# Copy built artifacts from build stages
COPY --from=client-builder /app/client/dist ./dist/public
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/shared ./shared

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
