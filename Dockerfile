########## Build frontend ##########
FROM node:18 AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client ./client
COPY shared ./shared
COPY attached_assets ./attached_assets 
RUN npm install
RUN npm run build:client

########## Build backend ##########
FROM node:18 AS backend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared
RUN npm install
COPY --from=frontend-build /app/client/dist ./server/src/public
RUN npm run build:server

########## Final production image ##########
FROM node:18-alpine
WORKDIR /app

# Copy root files
COPY package.json package-lock.json ./

# Copy server source and shared code
COPY server ./server
COPY shared ./shared

# Install only production dependencies for server
RUN npm ci --omit=dev --workspace=server

# Copy compiled backend
WORKDIR /app/server
COPY --from=backend-build /app/server/dist ./dist
COPY --from=backend-build /app/shared ../shared

EXPOSE 10000
CMD ["node", "dist/server/src/index.js"]
