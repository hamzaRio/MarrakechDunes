# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY server/ ./server/
COPY shared/ ./shared/

# Build the application
WORKDIR /app/server
RUN npm run build

# Remove dev dependencies to reduce image size
WORKDIR /app
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Start the application
WORKDIR /app/server
CMD ["node", "dist/index.js"]
