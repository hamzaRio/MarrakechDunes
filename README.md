# MarrakechDunes - Moroccan Adventure Booking Platform

## 🏜️ Overview

MarrakechDunes is a production-ready full-stack web application for booking authentic Moroccan desert adventures and experiences. Built with modern technologies and designed for scalability, performance, and security.

### 🌟 Features

- **Activity Management**: Browse and book authentic Moroccan experiences
- **Admin Dashboard**: Manage activities, bookings, and reviews
- **Payment Integration**: Secure payment processing with Stripe
- **WhatsApp Integration**: Automated notifications and support
- **Multi-language Support**: English and French localization
- **Responsive Design**: Mobile-first approach with modern UI
- **File Upload**: Secure image upload with AWS S3 integration

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching
- **Wouter** for routing
- **React Hook Form** with Zod validation
- **Uppy** for file uploads

### Backend

- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Express Session** with MongoDB store
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Rate Limiting** for API protection
- **Circuit Breakers** for resilience

### Infrastructure

- **Vercel** for frontend deployment
- **Render** for backend hosting
- **MongoDB Atlas** for database
- **AWS S3** for file storage
- **Stripe** for payments

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas account
- AWS S3 bucket (for file uploads)
- Stripe account (for payments)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/hamzaRio/MarrakechDunes.git
   cd MarrakechDunes
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Copy the example file
   cp env.production.example .env.local
   
   # Edit .env.local with your values
   nano .env.local
   ```

4. **Start development servers**

   ```bash
   npm run dev
   ```

   This will start:

   - Frontend: <http://localhost:5173>
   - Backend: <http://localhost:10000>

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/marrakechdunes` |
| `SESSION_SECRET` | Yes | Session encryption key (32+ chars) | `your-super-secure-session-secret` |
| `JWT_SECRET` | Yes | JWT token signing key | `your-jwt-secret-key` |
| `ADMIN_PASSWORD` | Yes | Admin account password | `Marrakech@2025` |
| `SUPERADMIN_PASSWORD` | Yes | Super admin password | `Marrakech@1966` |
| `CLIENT_URL` | Yes | Frontend URL for CORS | `<https://marrakech-dunes.vercel.app>` |
| `VITE_API_URL` | Yes | Backend API URL | `<https://marrakechdunes.onrender.com>` |
| `VITE_ASSETS_BASE` | Yes | Assets base URL | `https://marrakechdunes.onrender.com/attached_assets` |
| `WHATSAPP_RECEIVERS` | Yes | WhatsApp notification recipients | `212600623630,212693323368` |

## 🏗️ Project Structure

```text
MarrakechDunes/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API client
│   │   └── test/           # Test files
│   ├── public/             # Static assets
│   └── vercel.json         # Vercel configuration
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── security/       # Security middleware
│   │   └── types/          # TypeScript types
│   └── attached_assets/    # Server-served assets
├── shared/                 # Shared schemas and types
├── scripts/                # Deployment and testing scripts
└── render.yaml             # Render deployment config
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### End-to-End Tests

```bash
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Frontend loads without white screen
- [ ] API endpoints respond correctly
- [ ] File uploads work
- [ ] Payment processing functions
- [ ] WhatsApp notifications sent
- [ ] Admin dashboard accessible
- [ ] Mobile responsiveness

## 🚀 Deployment

### Frontend (Vercel)

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard:
   - `VITE_API_URL`: Your Render backend URL
   - `VITE_ASSETS_BASE`: Your Render assets URL
3. **Deploy** automatically on push to main

### Backend (Render)

1. **Connect repository** to Render
2. **Configure service**:
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm start`
   - Environment: Node
3. **Set environment variables** in Render dashboard:
   - All variables from the table above
4. **Deploy** automatically on push to main

## 🔒 Security

### Production Security Checklist

- [ ] **Environment Variables**: All secrets stored in deployment platforms
- [ ] **HTTPS**: All traffic encrypted
- [ ] **CORS**: Properly configured for production domains
- [ ] **Rate Limiting**: API endpoints protected
- [ ] **Input Validation**: All inputs validated with Zod
- [ ] **Session Security**: Secure cookies with proper settings
- [ ] **CSP Headers**: Content Security Policy configured
- [ ] **Dependencies**: Regular security audits with `npm audit`

### Security Headers

The application includes comprehensive security headers via Helmet:

- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- XSS Protection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built with ❤️ for authentic Moroccan experiences
