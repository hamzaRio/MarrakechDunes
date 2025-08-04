# ===========================
# Stage 1: Build the client
# ===========================
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install --legacy-peer-deps

COPY shared/ ../shared/
COPY scripts/ ./scripts/
COPY client/ ./
RUN npm run build

# ===========================
# Stage 2: Build the server
# ===========================
FROM node:20-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm install --legacy-peer-deps --only=production

COPY shared/ ../shared/
COPY server/ ./
RUN npm run build

# ===========================
# Stage 3: Production runtime
# ===========================
FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=client-builder /app/client/dist ./client/dist
COPY server/package*.json ./server/

CMD ["node", "server/dist/index.js"]
