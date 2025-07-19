# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
COPY shared ../shared/
RUN npm run build && npm prune --omit=dev

# ---- Production Stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY attached_assets ./attached_assets
EXPOSE 10000
CMD ["node", "dist/index.js"]
