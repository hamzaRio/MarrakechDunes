# --- Build Stage ---
FROM node:20-slim AS build
WORKDIR /app

# Copy workspace manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm install --legacy-peer-deps

# Copy all sources
COPY . .

# Build frontend and backend
RUN npm run build --workspace=client && npm run build --workspace=server

# --- Production Stage ---
FROM node:20-slim AS prod
WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/server/package*.json ./server/
RUN npm ci --omit=dev --legacy-peer-deps

# Copy build outputs and assets
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/attached_assets ./attached_assets

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server/dist/index.js"]