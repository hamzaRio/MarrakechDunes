# --- Base Stage ---
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./

# Install only prod deps in production, all deps in development
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm ci --only=production; \
    else \
      npm install; \
    fi

# --- Build Stage ---
FROM base AS build
WORKDIR /app
COPY . .

# Compile TypeScript for server and shared
RUN npm run build

# --- Production Stage ---
FROM node:20-slim AS prod
WORKDIR /app

# Copy only necessary files from build stage
COPY --from=build /app/dist ./dist
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Use port from environment (Render/Vercel) or default to 3000
ENV PORT=${PORT:-3000}

EXPOSE ${PORT}

# Command to run server in production
CMD ["node", "dist/index.js"]
