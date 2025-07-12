# === Base build image ===
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# === Build frontend ===
FROM node:18-alpine AS frontend
WORKDIR /app/client
COPY client ./client
COPY shared ./shared
RUN npm install
RUN npm run build

# === Build backend ===
FROM node:18-alpine AS backend
WORKDIR /app
COPY --from=base /app /app
COPY server ./server
COPY shared ./shared
COPY --from=frontend /app/client/dist ./server/src/public
WORKDIR /app/server
RUN npm install
RUN npm run build

# === Production image ===
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend /app/server/dist ./dist
COPY --from=backend /app/shared ./shared
COPY server/package*.json ./
RUN npm install --omit=dev
EXPOSE 10000
CMD ["node", "dist/index.js"]
