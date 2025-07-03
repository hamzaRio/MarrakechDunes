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

# Development image with hot reload
FROM node:18-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
COPY shared ./shared
WORKDIR /app/server
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Production image
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/server/dist ./dist
COPY shared ./shared
COPY server/package*.json ./
RUN npm install --omit=dev
EXPOSE 5000
CMD ["node", "dist/index.js"]
