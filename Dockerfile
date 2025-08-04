# --- Build Stage ---
FROM node:20-slim AS build
WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install ALL dependencies (including devDeps) to build client + server
RUN npm install --legacy-peer-deps

# Copy the rest of the source
COPY . .

# Build client and server
RUN npm run build --workspace=client && npm run build --workspace=server


# --- Production Stage ---
FROM node:20-slim AS prod
WORKDIR /app

# Copy compiled output
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/server/package*.json ./server/

# Install only production dependencies for runtime
RUN npm ci --only=production --legacy-peer-deps

# Set environment variables
ENV PORT=3000
EXPOSE ${PORT}

# Start the server
CMD ["node", "server/dist/index.js"]
