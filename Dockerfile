########## Build frontend ##########
FROM node:18 AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package*.json ./client/
COPY client ./client
COPY shared ./shared

RUN npm install --workspace=client
RUN npm run build:client

########## Build backend ##########
FROM node:18 AS backend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package*.json ./server/
COPY server ./server
COPY shared ./shared
COPY --from=frontend-build /app/client/dist ./server/src/public

RUN npm install --workspace=server
RUN npm run build:server

########## Final production image ##########
FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared
COPY --from=backend-build /app/server/dist ./server/dist

RUN npm ci --omit=dev --workspace=server

WORKDIR /app/server
EXPOSE 10000

CMD ["node", "dist/server/src/index.js"]
