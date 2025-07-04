# Install dependencies only when needed
FROM node:18-alpine AS deps
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install

# Build the server
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
COPY shared ./shared
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
