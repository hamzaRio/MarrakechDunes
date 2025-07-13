########## Build frontend ##########
FROM node:18 AS frontend-build
WORKDIR /app

# Copy root and client dependencies
COPY package.json package-lock.json ./
COPY client/package*.json ./client/
COPY client ./client
COPY shared ./shared

# Install and build client
RUN npm install --workspace=client
RUN npm run build:client

########## Build backend ##########
FROM node:18 AS backend-build
WORKDIR /app

# Copy root and server dependencies
COPY package.json package-lock.json ./
COPY server/package*.json ./server/
COPY server ./server
COPY shared ./shared

# Copy frontend build into backend's public folder
COPY --from=frontend-build /app/client/dist ./server/src/public

# Install and build backend
RUN npm install --workspace=server
RUN npm run build:server

########## Final production image ##########
FROM node:18-alpine
WORKDIR /app/server

# Copy only necessary files
COPY package.json package-lock.json ../
COPY server ./
COPY shared ../shared
COPY --from=backend-build /app/server/dist ./dist

# Install only production dependencies
WORKDIR /app
RUN npm ci --omit=dev

# Back to server directory for CMD and serving
WORKDIR /app/server
EXPOSE 10000

# Start backend
CMD ["node", "dist/server/src/index.js"]
