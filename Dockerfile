# Build frontend
FROM node:18 AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client .
COPY shared ../shared
RUN npm run build

# Build backend
FROM node:18 AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server .
COPY shared ../shared
COPY --from=frontend-build /app/client/dist ./src/public
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app/server
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/server/dist ./dist
COPY --from=backend-build /app/shared ../shared
EXPOSE 10000
CMD ["node", "dist/index.js"]
