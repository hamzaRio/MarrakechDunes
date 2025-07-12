# ========== Base dependencies layer ==========
FROM node:18-alpine AS deps
WORKDIR /app

# Copy root and server package files
COPY package*.json ./
COPY server/package*.json ./server/

# Copy shared and server source files
COPY shared ./shared
COPY server ./server

# Install all dependencies from the root (includes server + shared)
RUN npm install

# ========== Build layer ==========
FROM node:18-alpine AS builder
WORKDIR /app

# Copy everything from the deps layer
COPY --from=deps /app /app

# Build the server code
WORKDIR /app/server
RUN npm run build

# ========== Production layer ==========
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy the built backend code
COPY --from=builder /app/server/dist ./dist

# ✅ Include shared files (used at runtime)
COPY --from=builder /app/shared ./shared

# Copy only production dependencies
COPY server/package*.json ./
RUN npm install --omit=dev

# Set port and command
EXPOSE 10000
CMD ["node", "dist/server/src/index.js"]
