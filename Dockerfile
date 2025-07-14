# Stage 1: Build client
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client .
RUN npm run build

# Stage 2: Build server
FROM node:18-alpine AS server-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 3: Final production image
FROM node:18-alpine AS production
WORKDIR /app

# Copy client and server builds
COPY --from=client-build /app/client/dist ./client/dist
COPY --from=server-build /app/dist ./dist
COPY --from=server-build /app/node_modules ./node_modules
COPY --from=server-build /app/package.json ./package.json

ENV NODE_ENV=production

# Correct entry point
CMD ["node", "dist/server/index.js"]
