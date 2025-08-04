# Multi-stage build for monorepo (client + server)
FROM node:20-slim AS build
WORKDIR /app

# Install dependencies including devDeps for both workspaces
COPY package*.json ./
COPY server/package*.json server/
COPY client/package*.json client/
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-slim AS prod
WORKDIR /app

# Copy compiled output
COPY --from=build /app/dist ./dist

# Install only production dependencies for the server
COPY server/package.json ./package.json
COPY server/package-lock.json ./package-lock.json
RUN npm ci --only=production --legacy-peer-deps

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/server/index.js"]

