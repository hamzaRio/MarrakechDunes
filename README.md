# MarrakechDunes - Moroccan Adventure Booking Platform

## Overview

MarrakechDunes is a production-ready full-stack web application for booking authentic Moroccan desert adventures and experiences. Built with modern technologies and designed for scalability, performance, and security.

## Security Notice

**IMPORTANT**: This application contains sensitive functionality and requires proper security configuration:

- **Never commit .env files** to version control
- **Always use strong, unique passwords** for admin accounts
- **Rotate secrets regularly** in production
- **Use HTTPS** in production environments
- **Monitor audit logs** for suspicious activity

## Monorepo Structure

This project uses npm workspaces for a clean monorepo structure:

```text
MarrakechDunes/
+-- client/                # Frontend (Vite + React)
�   +-- src/
�   �   +-- components/    # React components
�   �   +-- pages/         # Page components
�   �   +-- hooks/         # Custom React hooks
�   �   +-- lib/           # Frontend utilities
�   +-- package.json       # Frontend dependencies
�   +-- vite.config.ts     # Vite configuration
�   +-- index.html         # HTML entry point
+-- server/                # Backend (Express + TypeScript)
�   +-- routes.ts          # API routes
�   +-- security-middleware.ts # Security configurations
�   +-- package.json       # Backend dependencies
�   +-- tsconfig.json      # TypeScript config
+-- shared/                # Shared code
�   +-- schema.ts          # Zod schemas
�   +-- package.json       # Shared dependencies
+-- package.json           # Root workspace configuration
+-- vercel.json            # Vercel deployment config
+-- render.yaml            # Render deployment config
+-- env.production.example # Production environment template
```

## Quick Start

### Prerequisites

- **Node.js 20** or higher
- **npm 10** or higher
- **MongoDB Atlas** account (or local MongoDB)

### Installation

1. **Clone the repository:**

```bash
git clone <your-repository-url>
cd marrakech-dunes
```

1. **Install dependencies:**

```bash
npm install
```

1. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit .env with your actual credentials (see [Environment Variables](#environment-variables) section below).

1. **Start development servers:**

```bash
npm run dev
```

This will start both frontend and backend concurrently:

- **Frontend:** <http://localhost:5173>
- **Backend API:** <http://localhost:10000>

### Local Development with Production Environment

To test the server locally with production environment variables:

```bash
# Set production environment and start server
$env:NODE_ENV="production"; npm run dev:server
```

**Important Notes:**

- Production environment variables should be set in Render and Vercel dashboards, not hardcoded
- Local `.env.production` file is used for testing only
- Always use HTTPS URLs for production deployments

## Environment Variables

### Local Development Setup

1. **Copy the example file:**

```bash
cp .env.example .env
```

1. **Edit .env with your actual values:**

```bash
# === Environment ===
NODE_ENV=development

# === Database ===
DATABASE_URL=mongodb://localhost:27017/marrakechdunes
# Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/marrakechdunes

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
```

### Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| NODE_ENV | Yes | Environment mode | development or production |
| DATABASE_URL | Yes | MongoDB connection string | mongodb+srv://user:pass@cluster.mongodb.net/db |
| SESSION_SECRET | Yes | Session encryption key (32+ chars) | your-session-secret-here-32-characters-minimum |
| JWT_SECRET | Yes | JWT token signing key (32+ chars) | your-jwt-secret-here-32-characters-minimum |
| VITE_API_URL | Yes | Backend API URL for frontend | <http://localhost:10000> (dev) / <https://marrakechdunes.onrender.com> (prod) |
| VITE_ASSETS_BASE | Yes | Static assets base URL | <http://localhost:10000/attached_assets> (dev) / <https://marrakechdunes.onrender.com/attached_assets> (prod) |
| CLIENT_URL | Yes | Allowed CORS origins | <http://localhost:5173> (dev) / <https://marrakech-dunes.vercel.app> (prod) |
| ADMIN_PASSWORD | Yes | Admin user password | your-secure-admin-password |
| SUPERADMIN_PASSWORD | Yes | Superadmin user password | your-secure-superadmin-password |
| WHATSAPP_RECEIVERS | No | WhatsApp phone numbers for notifications | 212600623630,212693323368,212654497354 |

### Security Requirements

**CRITICAL SECURITY NOTES:**

1. **Session & JWT Secrets:**

   - Must be at least 32 characters long
   - Use cryptographically secure random strings
   - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

2. **Admin Passwords:**

   - Use strong, unique passwords (minimum 8 characters)
   - Include uppercase, lowercase, numbers, and special characters
   - Use different passwords for admin and superadmin accounts

3. **Database Security:**

   - Use MongoDB Atlas with proper access controls
   - Restrict network access to your application IPs
   - Use strong database user credentials

4. **Production Deployment:**

   - Never use default or example values in production
   - Use HTTPS URLs for all production endpoints
   - Restrict CORS to your actual production domains

### How to Set Environment Variables

#### Local Development

1. Copy .env.example to .env
2. Edit .env with your actual values
3. Never commit .env to version control

#### Render (Backend)

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add each environment variable with its production value

#### Vercel (Frontend)

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings > Environment Variables**
4. Add each environment variable with its production value

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Production Build
npm run build            # Build both frontend and backend for production
npm start               # Start production server

# Type Checking
npm run check           # Run TypeScript type checking

# Database
npm run db:push         # Push schema changes to database
```

### Development Workflow

1. **Frontend Development:** Edit files in client/src/
2. **Backend Development:** Edit files in server/
3. **Shared Types:** Edit shared/schema.ts for data models
4. **Static Assets:** Add images to attached_assets/

## Production Deployment

### Build for Production

```bash
npm run build
```

This creates:

- client/dist/ - Frontend production build
- server/dist/ - Backend production build

### Deployment Checklist

#### Pre-Deployment Verification

- [ ] **Security**: Run `npm audit` in both client and server directories
- [ ] **Environment**: Verify all required environment variables are set
- [ ] **Build**: Test production build locally with `npm run build`
- [ ] **Health Check**: Verify `/api/health` endpoint responds correctly
- [ ] **Assets**: Confirm all images load with proper Content-Type headers
- [ ] **CSP**: Test Google Maps integration works with current CSP settings
- [ ] **CORS**: Verify frontend can communicate with backend API
- [ ] **Session**: Test authentication flow with secure cookies

#### Render (Backend) Deployment

- [ ] Connect GitHub repository to Render
- [ ] Use `render.yaml` configuration for automatic setup
- [ ] Set all environment variables in Render dashboard:
  - `DATABASE_URL`
  - `SESSION_SECRET` (32+ characters)
  - `JWT_SECRET` (32+ characters)
  - `ADMIN_PASSWORD`
  - `SUPERADMIN_PASSWORD`
  - `CLIENT_URL`
  - `WHATSAPP_RECEIVERS`
- [ ] Verify health check: `https://your-app.onrender.com/api/health`
- [ ] Confirm server starts on port 10000

#### Vercel (Frontend) Deployment

- [ ] Connect GitHub repository to Vercel
- [ ] Set environment variables in Vercel dashboard:
  - `VITE_API_URL` (your Render backend URL)
  - `VITE_ASSETS_BASE` (your Render backend URL + /attached_assets)
- [ ] Verify `vercel.json` configuration includes SPA fallback
- [ ] Test SPA routing: `https://your-app.vercel.app/booking?activity=test`
- [ ] Confirm static assets load correctly

#### Post-Deployment Testing

- [ ] **Health Check**: `curl https://your-backend.onrender.com/api/health`
- [ ] **Frontend**: Visit `https://your-frontend.vercel.app`
- [ ] **Authentication**: Test admin login flow
- [ ] **API Endpoints**: Verify all API calls work correctly
- [ ] **Assets**: Test image loading from `/attached_assets/`
- [ ] **Google Maps**: Verify maps load without CSP errors
- [ ] **Performance**: Check React Query caching works correctly

### Deployment Options

#### Vercel (Frontend) + Render (Backend)

### Recommended for production deployment

#### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the workspace structure
3. The vercel.json configuration will build from the client workspace
4. Set environment variables in Vercel dashboard

#### Backend (Render)

1. Connect repository to Render
2. Use the included render.yaml configuration
3. Set environment variables in Render dashboard

**Production Security Checklist:**

- [ ] All secrets are at least 32 characters long
- [ ] Admin passwords are strong and unique
- [ ] HTTPS URLs are used for all endpoints
- [ ] CORS is restricted to production domains
- [ ] Rate limiting is enabled
- [ ] Audit logging is active
- [ ] Security headers are configured
- [ ] Database access is properly secured

## Security

### Security Features Implemented

- **CORS Protection** - Configured for specific domains
- **Rate Limiting** - Prevents API abuse (100 req/15min global, 200 req/15min dev)
- **Input Validation** - Zod schema validation with XSS protection
- **Session Security** - Secure session management with MongoDB store
- **Password Hashing** - bcrypt for admin passwords
- **Environment Variables** - No hardcoded credentials in code
- **Audit Logging** - Track all admin actions
- **Circuit Breakers** - Protect external service calls
- **Security Headers** - Helmet middleware for protection
- **HTTPS Enforcement** - Required in production

### Security Best Practices

1. **Never commit** .env files to version control
2. **Use strong passwords** for admin accounts (minimum 8 characters)
3. **Regularly rotate** JWT and session secrets (minimum 32 characters)
4. **Use HTTPS** in production environments
5. **Restrict CORS** to your actual domains
6. **Monitor** audit logs for suspicious activity
7. **Run security audits** regularly with `npm audit`
8. **Keep dependencies updated** to latest secure versions
9. **Use environment-specific** configurations
10. **Implement proper error handling** without exposing sensitive information

### Environment Variable Security

- **SESSION_SECRET**: Must be at least 32 characters long
- **JWT_SECRET**: Must be at least 32 characters long
- **ADMIN_PASSWORD**: Use strong, unique passwords
- **SUPERADMIN_PASSWORD**: Use different strong password
- **DATABASE_URL**: Use MongoDB Atlas with proper access controls
- **WHATSAPP_RECEIVERS**: Use actual phone numbers for notifications

### Production Security Checklist

- [ ] All environment variables set with secure values
- [ ] HTTPS enabled and enforced
- [ ] Rate limiting configured appropriately
- [ ] CORS restricted to production domains
- [ ] Session cookies configured for production
- [ ] Database access properly secured
- [ ] Admin passwords changed from defaults
- [ ] Audit logging enabled and monitored
- [ ] Security headers properly configured
- [ ] Dependencies updated and audited

## Database

### MongoDB Collections

- **activities** - Tour and adventure listings
- **bookings** - Customer reservations
- **reviews** - Customer feedback
- **audit_logs** - Admin action tracking

### Database Operations

```bash
# Push schema changes (development)
npm run db:push

# Force push (if warnings about data loss)
npm run db:push --force
```

## Features

### Customer Features

- **Browse Activities** - Desert tours, city trips, balloon rides
- **Book Adventures** - Multi-step booking process
- **WhatsApp Integration** - Direct communication
- **Reviews & Ratings** - Share experiences
- **Multi-language** - English and French support

### Admin Features

- **Secure Authentication** - Role-based access
- **Dashboard Analytics** - Booking and revenue insights
- **Activity Management** - CRUD operations
- **Booking Management** - Track reservations
- **Review Moderation** - Approve customer reviews
- **Price Comparison** - GetYourGuide integration

## Tech Stack

### Frontend

- **React 18** - Component library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Shadcn/ui** - Component library
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **Wouter** - Lightweight routing

### Backend

- **Node.js 20** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - ODM
- **bcrypt** - Password hashing
- **Express Sessions** - Authentication
- **Rate Limiting** - API protection
- **Helmet** - Security headers
- **Circuit Breakers** - External service protection

## Dependencies and Security

### Security Audits

Regularly audit your dependencies for security vulnerabilities:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable issues
npm audit fix

# Update dependencies to latest secure versions
npm update

# Check for outdated packages
npm outdated
```

### Critical Dependencies

- **express**: Web framework (keep updated for security patches)
- **mongoose**: MongoDB ODM (monitor for security updates)
- **bcrypt**: Password hashing (critical for security)
- **helmet**: Security headers (essential for production)
- **express-rate-limit**: Rate limiting (prevents abuse)

### Development Dependencies

- **typescript**: Type safety
- **esbuild**: Production builds
- **tsx**: Development server
- **cross-env**: Cross-platform environment variables

### Security Monitoring

- Run `npm audit` before each deployment
- Monitor GitHub security advisories for dependencies
- Keep Node.js updated to latest LTS version
- Regularly review and update all dependencies

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

```bash
Error: MongoServerError: bad auth: authentication failed
```

**Solution:** Verify your DATABASE_URL credentials and network access in MongoDB Atlas.

#### 2. Build Errors

```bash
Error: No matching export in "server/vite.ts"
```

**Solution:** This is a known TypeScript issue with the Vite configuration. The app runs correctly in development and production mode.

#### 3. Port Already in Use

```bash
Error: EADDRINUSE: address already in use :::5000
```

**Solution:** Change the PORT in your .env file or kill the process using the port.

#### 4. Assets Not Loading

**Solution:** Ensure images are placed in `attached_assets/` and referenced correctly in the code.

#### 5. Environment Variables Not Loading

**Solution:**

- Ensure .env file exists in the root directory
- Check that variable names match exactly (case-sensitive)
- Restart the development server after changing .env

### Development Tips

1. Use `npm run check` to verify TypeScript types
2. Check browser console for frontend errors
3. Monitor server logs for backend issues
4. Use the health endpoint: <http://localhost:10000/api/health>
5. Verify environment variables are loaded: <http://localhost:10000/health>

## License

This project is licensed under the MIT License.

## Support

For support and questions:

- Email: <support@marrakechdunes.com>
- WhatsApp: +212600623630
- Website: <https://marrakechdunes.vercel.app>

---

### Built with ❤️ for authentic Moroccan adventures
