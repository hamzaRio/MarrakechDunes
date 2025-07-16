# Deployment Guide

This repository contains both the frontend (client) and backend (server) of **MarrakechDunes**. The build is managed with npm workspaces.

## Build Steps

1. Install dependencies from the repo root:
   ```bash
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```
   - Frontend files are built to `client/dist`.
   - Compiled backend files are output to `server/dist` and the script `scripts/fix-import-extensions.js` ensures relative imports end with `.js`.

## Backend Deployment (Render)

1. Push the repository to GitHub and connect it to [Render](https://render.com).
2. Create a new **Web Service** using the provided `Dockerfile`.
3. Set environment variables such as `DATABASE_URL`, `SESSION_SECRET` and `PORT` in the Render dashboard.
4. Deploy. Render will build the service with `npm run build` and start the server with `npm start`.

## Frontend Deployment (Vercel)

1. From the Vercel dashboard, import the GitHub repository.
2. Use the following build settings:
   - **Framework**: Vite
   - **Build Command**: `npm run build:client`
   - **Output Directory**: `client/dist`
3. Set `VITE_API_URL` to the URL of the Render backend.
4. Deploy to obtain the static site served from Vercel.

Both deployments can be triggered automatically from GitHub after each push.
