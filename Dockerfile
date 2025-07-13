########## Build frontend ##########
FROM node:18 AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./ 
COPY package.json ../
COPY shared ../shared
RUN npm install --workspace=client
COPY client . 
RUN npm run build

########## Build backend ##########
FROM node:18 AS backend-build
WORKDIR /app/server
COPY server/package*.json ./ 
COPY package.json ../
COPY shared ../shared
RUN npm install --workspace=server
COPY server .
COPY --from=frontend-build /app/client/dist ./src/public
RUN npm run build

########## Final production image ##########
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy root files
COPY package.json package-lock.json ./

# Copy server code and shared
COPY server ./server
COPY shared ./shared

WORKDIR /app/server

# Install only server production dependencies using workspace
RUN npm ci --omit=dev --workspace=server

# Copy the compiled backend from build stage
COPY --from=backend-build /app/server/dist ./dist
COPY --from=backend-build /app/shared ../shared

EXPOSE 10000
CMD ["node", "dist/server/src/index.js"]
