# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
COPY shared/package*.json shared/

# Install dependencies for all workspaces
RUN npm ci --legacy-peer-deps

# Copy source code
COPY client client
COPY server server
COPY shared shared

# Build frontend and backend
RUN npm run build:client
RUN npm run build:server

# Prepare server runtime assets
WORKDIR /app/server
RUN mkdir -p dist/public && cp -r ../client/dist/. dist/public/
RUN if [ -d attached_assets ]; then mkdir -p dist/attached_assets && cp -r attached_assets/. dist/attached_assets/; fi

# Runtime configuration
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["node", "dist/index.js"]