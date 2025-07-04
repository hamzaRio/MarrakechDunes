# ---------------------------------------
# 1. Install dependencies only when needed
# ---------------------------------------
FROM node:18-alpine AS deps
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install

# ---------------------------------------
# 2. Build the server
# ---------------------------------------
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
COPY shared ./shared
WORKDIR /app/server
RUN npm run build

# ---------------------------------------
# 3. Development image with hot reload
# ---------------------------------------
FROM node:18-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
COPY shared ./shared
WORKDIR /app/server
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---------------------------------------
# 4. Production image
# ---------------------------------------
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy only the necessary dist and shared code
COPY --from=builder /app/server/dist ./dist
COPY shared ./shared
COPY server/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

EXPOSE 5000
CMD ["node", "dist/index.js"]
