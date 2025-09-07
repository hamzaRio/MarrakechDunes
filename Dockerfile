# Multi-stage Dockerfile for MarrakechDunes Backend
# This helps standardize error handling between dev/test/prod environments

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY server/package*.json ./
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY server/ ./server/
COPY shared/ ./shared/

# Build the application
RUN cd server && npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/server/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/server/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

# Copy attached assets
COPY --chown=nodejs:nodejs attached_assets ./attached_assets

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/server/index.js"]
