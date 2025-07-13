########## Build frontend ##########
FROM node:18 AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client ./client
COPY shared ./shared
RUN npm install
RUN npm run build:client

########## Build backend ##########
FROM node:18 AS backend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared
RUN npm install
RUN npm run build:server

########## Final production image ##########
FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared

# Install only production deps for server
RUN npm ci --omit=dev --workspace=server

WORKDIR /app/server

# ✅ Copy backend build
COPY --from=backend-build /app/server/dist ./dist
COPY --from=backend-build /app/shared ../shared

# ✅ Copy frontend dist (for static serving)
COPY --from=frontend-build /app/client/dist ./src/public

EXPOSE 10000
CMD ["node", "dist/server/src/index.js"]
