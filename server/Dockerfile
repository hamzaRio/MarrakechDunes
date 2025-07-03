# Install dependencies only when needed
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Build the server
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY ../shared ./shared
RUN npm run build

# Development image with hot reload
FROM node:18-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY ../shared ./shared
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Production image
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev
EXPOSE 5000
CMD ["node", "dist/index.js"]
