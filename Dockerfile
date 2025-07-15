# Stage 1: Build Client
FROM node:20-alpine AS client-build
WORKDIR /app
COPY client ./client
COPY shared ./shared
WORKDIR /app/client
RUN npm install
RUN npm run build

# Stage 2: Build Server
FROM node:20-alpine AS server-build
WORKDIR /app
COPY server ./server
COPY shared ./shared
WORKDIR /app/server
RUN npm install
RUN npm run build

# Stage 3: Final Production Image
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=client-build /app/client/dist ./client/dist
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/package.json ./server/package.json
ENV NODE_ENV=production
CMD ["node", "server/dist/server/src/index.js"]
