# --- Build Stage ---
FROM node:20-slim AS build
WORKDIR /app

# Copy package manifests for workspaces
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies (dev + prod)
RUN npm install --legacy-peer-deps

# Copy full source
COPY . .

# Build frontend and backend
RUN npm run build --workspace=client && npm run build --workspace=server

# --- Production Stage ---
FROM node:20-slim AS prod
WORKDIR /app

# Copy backend build output
COPY --from=build /app/server/dist ./server/dist

# Copy package files
COPY --from=build /app/package*.json ./
COPY --from=build /app/server/package*.json ./server/

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps

# Set default port
ENV PORT=3000
EXPOSE 3000

# Start backend server
CMD ["node", "server/dist/index.js"]
