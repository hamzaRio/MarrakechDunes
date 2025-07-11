# Base install
FROM node:18-alpine AS deps
WORKDIR /app

# Copy monorepo-wide files and install all dependencies
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared ./shared
COPY server ./server

# Install all dependencies from the root (for shared + server)
RUN npm install

# Build server
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app /app
WORKDIR /app/server
RUN npm run build

# Production image
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/server/dist ./dist
COPY shared ./shared
COPY server/package*.json ./
RUN npm install --omit=dev

EXPOSE 10000
CMD ["node", "dist/index.js"]
