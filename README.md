# MarrakechDunes - Moroccan Adventure Booking Platform

## 🌟 Overview

MarrakechDunes is a production-ready full-stack web application for booking authentic Moroccan desert adventures and experiences. Built with modern technologies and designed for scalability, performance, and security.

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

4. **Start development server:**
```bash
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

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

### Required Credentials

```bash
# === Database Configuration ===
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/marrakech-tours?retryWrites=true&w=majority

# === Authentication & Security ===
JWT_SECRET=your-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key-here

# === Admin Credentials ===
ADMIN_PASSWORD=your-secure-admin-password
SUPERADMIN_PASSWORD=your-secure-superadmin-password

# === Application Configuration ===
CLIENT_URL=http://localhost:5173,https://your-frontend-domain.com
VITE_API_URL=http://localhost:5000

# === Business Integration ===
WHATSAPP_RECEIVERS=+212600623630,+212693323368,+212654497354

# === Optional ===
NODE_ENV=development
PORT=5000
```

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
Choose strong passwords for admin access:
- **ADMIN_PASSWORD**: For regular admin users
- **SUPERADMIN_PASSWORD**: For super admin access (highest privileges)

#### 4. WhatsApp Integration
Add phone numbers (with country codes) for receiving booking notifications:
```bash
WHATSAPP_RECEIVERS=+212600623630,+212693323368,+212654497354
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
- `dist/public/` - Frontend production build
- `dist/` - Backend production build

### Deployment Options

#### Option 1: Vercel (Frontend) + Render (Backend)
**Recommended for most users**

**Frontend (Vercel):**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

**Backend (Render):**
1. Connect repository to Render
2. Use the included `render.yaml` configuration
3. Set environment variables in Render dashboard

#### Option 2: Netlify (Frontend only)
1. Connect repository to Netlify
2. Use the included `netlify.toml` configuration
3. Deploy frontend as static site

#### Option 3: Heroku (Full-stack)
1. Create Heroku app
2. Use the included `app.json` for easy deployment
3. Set environment variables in Heroku dashboard

### Environment Variables for Production

For each deployment platform, set these environment variables:

```bash
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
ADMIN_PASSWORD=your-production-admin-password
SUPERADMIN_PASSWORD=your-production-superadmin-password
CLIENT_URL=https://your-frontend-domain.com
WHATSAPP_RECEIVERS=your-production-phone-numbers
NODE_ENV=production
```

## 🔒 Security

### Security Features Implemented
- ✅ **CORS Protection** - Configured for specific domains
- ✅ **Rate Limiting** - Prevents API abuse
- ✅ **Input Validation** - Zod schema validation
- ✅ **Session Security** - Secure session management
- ✅ **Password Hashing** - bcrypt for admin passwords
- ✅ **Environment Variables** - No credentials in code
- ✅ **Audit Logging** - Track admin actions

### Security Best Practices
1. **Never commit** `.env` files to version control
2. **Use strong passwords** for admin accounts
3. **Regularly rotate** JWT and session secrets
4. **Use HTTPS** in production
5. **Restrict CORS** to your actual domains
6. **Monitor** audit logs for suspicious activity

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