########## Final production image ##########
FROM node:18-alpine
WORKDIR /app

# ✅ Copy the root package.json and lockfile (with workspaces)
COPY package.json package-lock.json ./

# ✅ Copy server and shared folders
COPY server ./server
COPY shared ./shared

# ✅ Install only production dependencies for server using workspace
RUN npm ci --omit=dev --workspace=server

# ✅ Set working directory to server
WORKDIR /app/server

# ✅ Copy the compiled backend from backend build stage
COPY --from=backend-build /app/server/dist ./dist
COPY --from=backend-build /app/shared ../shared

# ✅ Expose and start
EXPOSE 10000
CMD ["node", "dist/server/src/index.js"]
