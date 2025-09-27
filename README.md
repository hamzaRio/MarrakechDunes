# 🏜️ MarrakechDunes - Desert Adventure Booking Platform

A full-stack web application for booking desert adventures and activities in Marrakech, Morocco. Built with React, TypeScript, Node.js, and MongoDB.

## ✨ Features

- **Activity Management**: Browse and book desert adventures, hot air balloon rides, and cultural tours
- **Real-time Booking**: Instant booking confirmation with WhatsApp notifications
- **Admin Dashboard**: Comprehensive management system for bookings, activities, and analytics
- **Multi-language Support**: English and French language support
- **Responsive Design**: Mobile-first design optimized for all devices
- **Cash Payment System**: Simple cash-only payment for easy customer experience
- **Analytics Dashboard**: Performance metrics and booking analytics
- **AI-Ready Architecture**: Prepared for GetYourGuide integration and competitive pricing
- **Production Deployment**: Optimized for Render (backend) and Vercel (frontend)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Git

### Installation

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
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

## 🔧 Development

### Project Structure

```text
MarrakechDunes/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API
│   │   └── locales/       # Translation files
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── config/        # Configuration
│   │   └── utils/         # Server utilities
├── shared/                 # Shared TypeScript types
└── docs/                   # Documentation
```

### Available Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run build:client` - Build frontend only
- `npm run build:server` - Build backend only
- `npm run test` - Run tests
- `npm run lint` - Run linter

## 🌐 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build:client`
3. Set output directory: `client/dist`
4. Add environment variables:
   - `VITE_API_URL`: `https://marrakechdunes-sppy.onrender.com`

### Backend (Render)

1. Connect your GitHub repository to Render
2. Set build command: `npm run build:server`
3. Set start command: `cd server && npm start`
4. Add environment variables (see below)

### Environment Variables

#### Backend (Render) - Server Environment

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/marrakechdunes` |
| `JWT_SECRET` | Yes | JWT token signing key | `your-jwt-secret-key` |
| `SESSION_SECRET` | Yes | Session encryption key (32+ chars) | `your-super-secure-session-secret` |
| `ADMIN_PASSWORD` | Yes | Admin account password | `Marrakech@2025` |
| `SUPERADMIN_PASSWORD` | Yes | Super admin password | `Marrakech@1966` |
| `CLIENT_URL` | Yes | Frontend URL for CORS | `https://marrakech-dunes.vercel.app` |
| `WHATSAPP_RECEIVERS` | Yes | WhatsApp notification recipients | `212600623630,212693323368` |

#### Frontend (Vercel) - Client Environment

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API URL | `https://marrakechdunes-sppy.onrender.com` |

### Deployment Features

- ✅ **CORS Configuration**: Properly configured for production domains
- ✅ **Static Assets**: Served by Vercel from `/images/` directory
- ✅ **Error Handling**: User-friendly error messages with retry functionality
- ✅ **API Routing**: All endpoints under `/api/` prefix
- ✅ **Security**: Rate limiting, CSRF protection, and secure sessions
- ✅ **Logging**: Comprehensive error logging and CORS monitoring

## 🏗️ Project Structure

```text
MarrakechDunes/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API
│   │   └── locales/       # Translation files
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── config/        # Configuration
│   │   └── utils/         # Server utilities
├── shared/                 # Shared TypeScript types
└── docs/                   # Documentation
```

## 🛠️ Technology Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **React Router** - Routing

### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication

### DevOps

- **Docker** - Containerization
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Database hosting

## 📱 Features

### User Features

- Browse desert activities and tours
- Real-time booking system
- Multi-language support (EN/FR)
- Mobile-responsive design
- WhatsApp integration for notifications

### Admin Features

- Comprehensive dashboard
- Booking management
- Activity management
- Analytics and reporting
- User management
- Performance monitoring

## 🔒 Security

- JWT-based authentication
- Secure session management
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention

## 📊 Analytics

- Booking conversion rates
- Revenue tracking
- Performance metrics
- User behavior analysis
- System health monitoring

## 🤖 AI-Powered Competitive Pricing (Future)

The application is architected to support AI-powered competitive pricing:

### Market Intelligence

- **GetYourGuide Integration**: Real-time competitor price monitoring
- **Dynamic Pricing**: AI-driven price optimization based on market data
- **Competitive Analysis**: Automatic market position analysis
- **Price Alerts**: Smart notifications for market opportunities

### AI Admin Features

- **One-Click Optimization**: Automatic price adjustment for all activities
- **Market Insights**: Real-time competitor analysis and recommendations
- **Performance Metrics**: AI-driven business intelligence
- **Smart Alerts**: Automated market opportunity notifications

### Customer Experience

- **Price Comparison**: Clear savings display vs competitors
- **Value Proposition**: "Best price guaranteed" messaging
- **Smart Recommendations**: AI-powered activity suggestions
- **Dynamic Offers**: Seasonal and demand-based pricing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email [support@marrakechdunes.com](mailto:support@marrakechdunes.com) or create an issue in the repository.

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the database solution
- Vercel and Render for hosting platforms
- The open-source community

---

## Made with ❤️ in Marrakech, Morocco
