# ===========================
# Stage 1: Build the client
# ===========================
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Install client dependencies
COPY client/package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Copy and build client
COPY shared/ ../shared/
COPY scripts/ ./scripts/
COPY client/ ./

# ===========================
# Stage 2: Build the server
# ===========================
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Install server dependencies
COPY server/package*.json ./
RUN npm install --legacy-peer-deps

# Copy shared code and server source
COPY shared/ ../shared/
COPY server/ ./

# Build server
RUN npm run build

# ===========================
# Stage 3: Production runtime
# ===========================
FROM node:20-alpine AS runtime
WORKDIR /app

# Copy built server and client
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=client-builder /app/client/dist ./client/dist

# Start server
CMD ["node", "server/dist/index.js"]
