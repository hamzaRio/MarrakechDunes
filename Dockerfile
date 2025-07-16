# ==========================
# Stage 0: Install shared dependencies at root
# ==========================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm install

# ==========================
# Stage 1: Build Client
# ==========================
FROM node:20-alpine AS client-build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY client ./client
COPY shared ./shared
WORKDIR /app/client
RUN npm run build

# ==========================
# Stage 2: Build Server
# ==========================
FROM node:20-alpine AS server-build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server ./server
COPY shared ./shared
COPY scripts ./scripts        
WORKDIR /app/server
RUN npm run build


# ==========================
# Stage 3: Final Production Image
# ==========================
FROM node:20-alpine AS production
WORKDIR /app

# Copy compiled output
COPY --from=client-build /app/client/dist ./client/dist
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package.json ./server/package.json
COPY --from=deps /app/node_modules ./node_modules

ENV NODE_ENV=production
CMD ["node", "server/dist/server/src/index.js"]
