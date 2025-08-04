# --- Base Stage ---
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./

# Install only production dependencies by default
RUN npm ci --only=production --legacy-peer-deps

# --- Build Stage ---
FROM node:20-slim AS build
WORKDIR /app
COPY . .

# Install ALL dependencies (including vite + devDeps) for build
RUN npm install --legacy-peer-deps

# Compile TypeScript for server and shared
RUN npm run build

# --- Production Stage ---
FROM node:20-slim AS prod
WORKDIR /app

# Copy only built output & necessary files
COPY --from=build /app/dist ./dist
COPY package*.json ./

# Install only production dependencies for runtime
RUN npm ci --only=production --legacy-peer-deps

# Use port from environment or default to 3000
ENV PORT=${PORT:-3000}
EXPOSE ${PORT}

# Start the server
CMD ["node", "dist/index.js"]
