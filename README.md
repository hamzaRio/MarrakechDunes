# MarrakechDunes - Moroccan Adventure Booking Platform

## Overview

MarrakechDunes is a production-ready full-stack web application for booking authentic Moroccan desert adventures and experiences. Built with modern technologies and designed for scalability, performance, and security.

## Security Notice

**IMPORTANT**: This application contains sensitive functionality and requires proper security configuration:

- **Never commit `.env` files** to version control
- **Always use strong, unique passwords** for admin accounts
- **Rotate secrets regularly** in production
- **Use HTTPS** in production environments
- **Monitor audit logs** for suspicious activity

## Monorepo Structure

This project uses npm workspaces for a clean monorepo structure:

```text
MarrakechDunes/
├── client/                # Frontend (Vite + React)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Frontend utilities
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── index.html         # HTML entry point
│
├── server/                # Backend (Express + TypeScript)
│   ├── routes.ts          # API routes
│   ├── security-middleware.ts # Security configurations
│   ├── package.json       # Backend dependencies
│   └── tsconfig.json      # TypeScript config
│
├── shared/                # Shared code
│   ├── schema.ts          # Zod schemas
│   └── package.json       # Shared dependencies
│
├── package.json           # Root workspace configuration
├── vercel.json            # Vercel deployment config
├── render.yaml            # Render deployment config
└── env.production.example # Production environment template
Quick Start
Prerequisites
Node.js 20 or higher

npm 10 or higher

MongoDB Atlas account (or local MongoDB)

Installation
Clone the repository:

bash
Copy code
git clone <your-repository-url>
cd marrakech-dunes
Install dependencies:

bash
Copy code
npm install
Set up environment variables:

bash
Copy code
cp .env.example .env
Edit .env with your actual credentials (see Environment Variables).

Start development servers:

bash
Copy code
npm run dev
This starts both frontend and backend concurrently:

Frontend: http://localhost:5173

Backend API: http://localhost:10000

Local Development with Production Environment
To test the server locally with production environment variables:

bash
Copy code
# PowerShell
$env:NODE_ENV="production"; npm run dev:server
Important Notes:

Production environment variables should be set in Render and Vercel dashboards, not hardcoded

Local .env.production is for testing only

Always use HTTPS URLs for production deployments

Environment Variables
Local Development Setup
Copy the example file:

bash
Copy code
cp .env.example .env
Edit .env with your actual values:

bash
Copy code
# === Environment ===
NODE_ENV=development

# === Database ===
DATABASE_URL=mongodb://localhost:27017/marrakechdunes
# Or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/marrakechdunes

# === Security ===
SESSION_SECRET=your-session-secret-here-32-characters-minimum
JWT_SECRET=your-jwt-secret-here-32-characters-minimum

# === Frontend URLs ===
VITE_API_URL=http://localhost:10000
VITE_ASSETS_BASE=http://localhost:10000/attached_assets

# === CORS Configuration ===
CLIENT_URL=http://localhost:5173,http://localhost:3000

# === Admin Credentials ===
ADMIN_PASSWORD=your-admin-password-here
SUPERADMIN_PASSWORD=your-superadmin-password-here

# === WhatsApp Integration ===
WHATSAPP_RECEIVERS=212600623630,212693323368,212654497354
Environment Variable Reference
Variable | Required | Description | Example
NODE_ENV | Yes | Environment mode | development / production
DATABASE_URL | Yes | MongoDB connection | mongodb+srv://user:pass@cluster.mongodb.net/db
SESSION_SECRET | Yes | Session secret (32+ chars) | your-session-secret-32-characters-minimum
JWT_SECRET | Yes | JWT signing key (32+ chars) | your-jwt-secret-32-characters-minimum
VITE_API_URL | Yes | Backend API URL | http://localhost:10000 (dev) / https://marrakechdunes.onrender.com (prod)
VITE_ASSETS_BASE | Yes | Static assets base URL | http://localhost:10000/attached_assets (dev) / https://marrakechdunes.onrender.com/attached_assets (prod)
CLIENT_URL | Yes | Allowed CORS origins | http://localhost:5173 (dev) / https://marrakech-dunes.vercel.app (prod)
ADMIN_PASSWORD | Yes | Admin password | your-secure-admin-password
SUPERADMIN_PASSWORD | Yes | Superadmin password | your-secure-superadmin-password
WHATSAPP_RECEIVERS | No | WhatsApp notification numbers | 212600623630,212693323368,212654497354

Security Requirements
CRITICAL SECURITY NOTES:

Session & JWT Secrets: Must be ≥ 32 chars, cryptographically secure.
Generate with:

bash
Copy code
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Passwords: Use strong, unique passwords for admin/superadmin.

Database Security:

Use MongoDB Atlas with restricted IP access

Strong user credentials

Production Deployment:

No default/example values

Use HTTPS only

Restrict CORS to production domains

Development
Available Scripts
bash
Copy code
npm run dev        # Start dev servers (frontend + backend)
npm run build      # Build frontend and backend for production
npm start          # Start production server
npm run check      # Type check with TypeScript
npm run db:push    # Push schema changes to DB
Production Deployment
Backend: Render (Node.js, Express, MongoDB)

Frontend: Vercel (React + Vite)

See Deployment Checklist inside the README for Render/Vercel environment setup.

Features
Customer
Browse and book activities

WhatsApp booking integration

Multi-language: English & French

Reviews & Ratings

Admin
Role-based authentication

Dashboard with analytics

Manage activities & bookings

Review moderation

Price comparison (GetYourGuide integration)

Tech Stack
Frontend: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, TanStack Query, React Hook Form, Wouter
Backend: Node.js 20, Express, TypeScript, MongoDB, Mongoose, bcrypt, helmet, express-rate-limit

Troubleshooting
MongoDB connection failed: check DATABASE_URL + Atlas IP whitelist

Assets not loading: ensure files are inside /attached_assets

Env vars not loading: restart dev server after editing .env

License
MIT License © MarrakechDunes Team

Built with ❤️ for authentic Moroccan adventures


