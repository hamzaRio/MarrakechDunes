# MarrakechDunes - Moroccan Adventure Booking Platform

## 🌟 Overview

MarrakechDunes is a production-ready full-stack web application for booking authentic Moroccan desert adventures and experiences. Built with modern technologies and designed for scalability, performance, and security.

## 🔒 Security Notice

**⚠️ IMPORTANT**: This application contains sensitive functionality and requires proper security configuration:
- **Never commit `.env` files** to version control
- **Always use strong, unique passwords** for admin accounts
- **Rotate secrets regularly** in production
- **Use HTTPS** in production environments
- **Monitor audit logs** for suspicious activity

## 🏗️ Monorepo Structure

This project uses npm workspaces for a clean monorepo structure:

```
MarrakechDunes/
├── src/                    # Frontend (Vite + React)
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Frontend utilities
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── index.html         # HTML entry point
├── server/                # Backend (Express + TypeScript)
│   ├── routes.ts          # API routes
│   ├── security-middleware.ts # Security configurations
│   ├── package.json       # Backend dependencies
│   └── tsconfig.json      # TypeScript config
├── shared/                # Shared code
│   ├── schema.ts          # Zod schemas
│   └── package.json       # Shared dependencies
├── package.json           # Root workspace configuration
├── vercel.json           # Vercel deployment config
└── render.yaml           # Render deployment config
```

## 🚀 Quick Start

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

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```
Edit `.env` with your actual credentials (see [Environment Variables](#environment-variables) section below).

4. **Start development servers:**
```bash
npm run dev
```

This will start both frontend and backend concurrently:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

### Development Commands

```bash
# Start both frontend and backend
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Build both frontend and backend
npm run build

# Build only frontend
npm run build:frontend

# Build only backend
npm run build:backend

# Start production server
npm start
```

## 📁 Project Structure

```
MarrakechDunes/
├── client/              # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and configurations
├── server/              # Express backend (Node.js + TypeScript)
│   ├── index.ts         # Main server file
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations
│   └── security-middleware.ts
├── shared/              # Shared TypeScript schemas
│   └── schema.ts        # Data models and validation
├── attached_assets/     # Static assets and images
└── deployment configs   # Various hosting platform configurations
```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Environment Variables

```bash
# === Database Configuration ===
DATABASE_URL=mongodb+srv://your-username:your-password@cluster.mongodb.net/marrakech-tours?retryWrites=true&w=majority

# === Authentication & Security ===
JWT_SECRET=your-jwt-secret-key-minimum-32-characters-long
SESSION_SECRET=your-session-secret-key-minimum-32-characters-long

# === Admin Credentials ===
ADMIN_PASSWORD=your-secure-admin-password-minimum-8-characters
SUPERADMIN_PASSWORD=your-secure-superadmin-password-minimum-8-characters

# === Application Configuration ===
CLIENT_URL=http://localhost:5173,https://your-frontend-domain.com
VITE_API_URL=http://localhost:5000

# === Business Integration ===
WHATSAPP_RECEIVERS=your-phone-number-1,your-phone-number-2,your-phone-number-3

# === Environment ===
NODE_ENV=development
PORT=5000
```

**⚠️ SECURITY WARNING**: 
- Never use default passwords in production
- Generate strong, unique secrets for JWT_SECRET and SESSION_SECRET
- Use different passwords for ADMIN_PASSWORD and SUPERADMIN_PASSWORD
- Replace WhatsApp numbers with your actual business phone numbers

### How to Get Credentials

#### 1. MongoDB URI
1. Sign up for [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Go to **Database Access** → Create a database user
4. Go to **Network Access** → Add your IP address (or 0.0.0.0/0 for development)
5. Go to **Clusters** → **Connect** → **Connect your application**
6. Copy the connection string and replace `<password>` with your database user password

#### 2. JWT & Session Secrets
Generate secure random strings:
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64
```

#### 3. Admin Passwords
Choose strong, unique passwords for admin access:
- **ADMIN_PASSWORD**: For regular admin users (minimum 8 characters)
- **SUPERADMIN_PASSWORD**: For super admin access (minimum 8 characters, different from ADMIN_PASSWORD)

**Security Requirements:**
- Use a mix of uppercase, lowercase, numbers, and special characters
- Avoid common passwords or patterns
- Use different passwords for each admin account
- Consider using a password manager for secure storage

#### 4. WhatsApp Integration
Add your actual business phone numbers (with country codes) for receiving booking notifications:
```bash
WHATSAPP_RECEIVERS=your-phone-number-1,your-phone-number-2,your-phone-number-3
```

**Example:**
```bash
WHATSAPP_RECEIVERS=+1234567890,+1987654321
```

## 🛠️ Development

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

1. **Frontend Development:** Edit files in `client/src/`
2. **Backend Development:** Edit files in `server/`
3. **Shared Types:** Edit `shared/schema.ts` for data models
4. **Static Assets:** Add images to `attached_assets/`

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

This creates:
- `src/dist/` - Frontend production build
- `server/dist/` - Backend production build

### Deployment Options

#### Vercel (Frontend) + Render (Backend)
**Recommended for production deployment**

**Frontend (Vercel):**
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the workspace structure
3. The `vercel.json` configuration will build from the `src` workspace
4. Set environment variables in Vercel dashboard

**Backend (Render):**
1. Connect repository to Render
2. Use the included `render.yaml` configuration
3. Set environment variables in Render dashboard

### Environment Variables for Production

For each deployment platform, set these environment variables:

```bash
DATABASE_URL=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret-minimum-32-characters
SESSION_SECRET=your-production-session-secret-minimum-32-characters
ADMIN_PASSWORD=your-production-admin-password-minimum-8-characters
SUPERADMIN_PASSWORD=your-production-superadmin-password-minimum-8-characters
CLIENT_URL=https://your-frontend-domain.com
VITE_API_URL=https://your-backend-domain.com
VITE_ASSETS_BASE=https://your-backend-domain.com/assets
WHATSAPP_RECEIVERS=your-production-phone-numbers
NODE_ENV=production
PORT=5000
```

**🔒 Production Security Checklist:**
- [ ] All secrets are at least 32 characters long
- [ ] Admin passwords are strong and unique
- [ ] HTTPS URLs are used for all endpoints
- [ ] CORS is restricted to production domains
- [ ] Rate limiting is enabled
- [ ] Audit logging is active
- [ ] Security headers are configured
- [ ] Database access is properly secured

## 🔒 Security

### Security Features Implemented
- ✅ **CORS Protection** - Configured for specific domains
- ✅ **Rate Limiting** - Prevents API abuse (100 req/15min global, 10 req/min admin)
- ✅ **Input Validation** - Zod schema validation with XSS protection
- ✅ **Session Security** - Secure session management with MongoDB store
- ✅ **Password Hashing** - bcrypt for admin passwords
- ✅ **Environment Variables** - No hardcoded credentials in code
- ✅ **Audit Logging** - Track all admin actions
- ✅ **Circuit Breakers** - Protect external service calls
- ✅ **Security Headers** - Helmet middleware for protection
- ✅ **HTTPS Enforcement** - Required in production

### Security Best Practices
1. **Never commit** `.env` files to version control
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

## 🗃️ Database

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

## 📱 Features

### Customer Features
- 🏜️ **Browse Activities** - Desert tours, city trips, balloon rides
- 📅 **Book Adventures** - Multi-step booking process
- 💬 **WhatsApp Integration** - Direct communication
- ⭐ **Reviews & Ratings** - Share experiences
- 🌍 **Multi-language** - English and French support

### Admin Features
- 🔐 **Secure Authentication** - Role-based access
- 📊 **Dashboard Analytics** - Booking and revenue insights
- ✏️ **Activity Management** - CRUD operations
- 📋 **Booking Management** - Track reservations
- 👥 **Review Moderation** - Approve customer reviews
- 📈 **Price Comparison** - GetYourGuide integration

## 🛠️ Tech Stack

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

## 📦 Dependencies and Security

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

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```bash
Error: MongoServerError: bad auth: authentication failed
```
**Solution:** Verify your `MONGODB_URI` credentials and network access in MongoDB Atlas.

#### 2. Build Errors
```bash
Error: No matching export in "server/vite.ts"
```
**Solution:** This is a known TypeScript issue with the Vite configuration. The app runs correctly in development and production mode.

#### 3. Port Already in Use
```bash
Error: EADDRINUSE: address already in use :::5000
```
**Solution:** Change the `PORT` in your `.env` file or kill the process using the port.

#### 4. Assets Not Loading
**Solution:** Ensure images are placed in `attached_assets/` and referenced correctly in the code.

### Development Tips
1. Use `npm run check` to verify TypeScript types
2. Check browser console for frontend errors
3. Monitor server logs for backend issues
4. Use the health endpoint: `http://localhost:5000/api/health`

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support and questions:
- 📧 Email: support@marrakechdunes.com
- 💬 WhatsApp: +212600623630
- 🌐 Website: https://marrakechdunes.vercel.app

---

**Built with ❤️ for authentic Moroccan adventures**