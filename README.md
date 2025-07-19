# MarrakechDunes 🏔️

*Authentic Moroccan Adventure Booking Platform*

A comprehensive full-stack web application for booking curated Moroccan desert adventures and cultural experiences. Built with modern technologies and optimized for international customers with multilingual support.

## ✨ Features

### 🎯 Core Functionality
- **5 Authentic Experiences**: Hot Air Balloon, Agafay Desert, Essaouira Day Trip, Ouzoud Waterfalls, Ourika Valley
- **Multi-Step Booking System**: Activity selection → Date/time → Customer details → Confirmation
- **International Phone Support**: Country picker with flags for global customers
- **WhatsApp Integration**: Automated notifications to administrators
- **Admin Dashboard**: Complete booking management and business analytics
- **Multilingual Support**: English, French, and Arabic interfaces

### 🔧 Technical Features
- **React 18 + TypeScript**: Modern frontend with type safety
- **Express.js Backend**: RESTful API with session-based authentication  
- **MongoDB Atlas**: Cloud database with fallback system
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Validation**: Comprehensive form validation with error handling
- **Production Ready**: Docker containerization and CI/CD pipeline

## 🚀 Quick Start

### Option 1: One-Command Deployment
```bash
# Clone repository
git clone https://github.com/your-username/marrakech-dunes.git
cd marrakech-dunes

# Set up environment
cp .env.example .env
# Edit .env with your MongoDB connection string

# Deploy with single command
./deploy.sh production
```

### Option 2: Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5000
```

### Option 3: Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Application available at http://localhost
```

## 📁 Project Structure

```
marrakech-dunes/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
├── server/                 # Express.js backend
│   ├── routes/             # API endpoints
│   ├── storage/            # Database operations
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
├── attached_assets/        # Activity images and media
├── deploy.sh              # One-command deployment script
├── Dockerfile             # Multi-stage container build
├── docker-compose.yml     # Complete stack orchestration
└── .github/workflows/     # CI/CD automation
```

## 🌍 Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/marrakech-tours

# Security
SESSION_SECRET=your-secure-session-secret

# Admin Contacts (WhatsApp)
ADMIN_PHONE_AHMED=+212600623630
ADMIN_PHONE_YAHIA=+212693323368
ADMIN_PHONE_NADIA=+212654497354
```

### Optional Configuration
```bash
# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment processing (future)
STRIPE_SECRET_KEY=sk_live_...

# Analytics and monitoring
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
SENTRY_DSN=your-sentry-dsn
```

## 🚀 Deployment Options

### Platform-as-a-Service (Recommended)

#### Render (Simplest)
```bash
# Connect GitHub repository to Render
# Automatic deployment on git push
# Monthly cost: $7
```

#### Railway
```bash
railway up
# One-command deployment
# Automatic scaling
```

#### Vercel + MongoDB Atlas
```bash
vercel --prod
# Frontend on Vercel
# Database on MongoDB Atlas
```

### Self-Hosted

#### Docker + VPS
```bash
# Deploy to any VPS with Docker
./deploy.sh production

# Includes Nginx reverse proxy
# SSL certificate automation
# Health checks and monitoring
```

#### Kubernetes
```bash
# Enterprise-grade deployment
kubectl apply -f k8s/
# Auto-scaling and high availability
```

## 💼 Business Operations

### Booking Workflow
```
Customer Books → WhatsApp Alert → Admin Confirms → Payment → Tour Confirmation
```

### Admin Features
- **Dashboard Analytics**: Revenue, bookings, activity performance
- **Booking Management**: Status updates, customer communication
- **Activity Management**: Pricing, descriptions, photo galleries
- **User Management**: Admin accounts with role-based access

### Customer Experience
- **Activity Discovery**: Professional photo galleries with descriptions
- **Easy Booking**: 4-step process with real-time validation
- **International Support**: Phone input with country flags
- **Multiple Languages**: English, French, Arabic interfaces
- **Mobile Optimized**: Responsive design for all devices

## 📊 Performance & Monitoring

### Health Monitoring
```bash
# Health check endpoint
curl https://your-domain.com/api/health

# Returns: database status, active activities, recent bookings
```

### Key Metrics
- **Response Time**: < 200ms average
- **Database**: MongoDB Atlas with global clusters
- **CDN**: CloudFlare for static assets
- **Monitoring**: Built-in health checks and error tracking

## 🔒 Security Features

- **Rate Limiting**: API and booking endpoint protection
- **Input Validation**: Comprehensive form validation with Zod
- **Session Security**: Secure session management with MongoDB store
- **HTTPS Enforcement**: SSL/TLS encryption for all communications
- **Security Headers**: HSTS, CSP, XSS protection
- **Authentication**: Bcrypt password hashing with role-based access

## 🌐 International Support

### Phone Number Handling
- **Country Selection**: Visual country picker with flags
- **Format Validation**: International phone number validation
- **WhatsApp Compatible**: All numbers work with WhatsApp notifications
- **Preferred Countries**: Morocco, France, Spain, US, UK highlighted

### Multilingual Interface
- **Languages**: English (primary), French, Arabic
- **Right-to-Left**: Arabic language support
- **Currency**: MAD (Moroccan Dirham) with international pricing
- **Cultural Adaptation**: Local customs and preferences

## 📱 Mobile Experience

- **Responsive Design**: Mobile-first approach
- **Touch Optimized**: Large buttons and easy navigation
- **Fast Loading**: Optimized images and lazy loading
- **Offline Capable**: Service worker for core functionality
- **App-like Experience**: PWA features for mobile installation

## 🔄 Development Workflow

### Local Development
```bash
# Start development environment
npm run dev

# Run with hot reloading
# Automatic browser refresh
# Development database fallback
```

### Testing
```bash
# Type checking
npm run type-check

# Health verification
npm run health:check

# End-to-end testing
npm test
```

### Deployment
```bash
# Staging deployment
./deploy.sh staging

# Production deployment with backup
./deploy.sh production

# Rollback if needed
./deploy.sh rollback
```

## 💰 Cost Optimization

### Infrastructure Costs
```
MongoDB Atlas M0:    Free (512MB storage)
Render Starter:      $7/month (web service)
CloudFlare:          Free (CDN + SSL)
Domain Registration: $12/year
Total Monthly:       ~$8/month
```

### Scaling Strategy
- **0-1k visits**: Current setup ($8/month)
- **1k-10k visits**: Render Professional ($25/month)  
- **10k+ visits**: Dedicated hosting ($50-100/month)

## 🛠️ Maintenance

### Automated Backups
- **Daily**: MongoDB Atlas automated backups
- **Pre-deployment**: Automatic backup before updates
- **Retention**: 30-day backup history

### Updates
- **Dependencies**: Monthly security updates
- **Node.js**: LTS version updates every 6 months
- **SSL Certificates**: Automatic renewal via Let's Encrypt

### Monitoring Alerts
- **Uptime**: Alert if down > 2 minutes
- **Performance**: Alert if response time > 2 seconds
- **Database**: Connection monitoring with fallback activation
- **Disk Space**: Alert at 80% capacity

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **Commit Messages**: Conventional commit format

## 📞 Support

### Business Inquiries
- **Ahmed**: +212600623630 (WhatsApp)
- **Yahia**: +212693323368 (WhatsApp)  
- **Nadia**: +212654497354 (WhatsApp)

### Technical Support
- **Documentation**: Complete guides in `/docs`
- **GitHub Issues**: Bug reports and feature requests
- **Health Check**: `https://your-domain.com/api/health`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- **Authentic Photography**: All activity images are genuine experiences
- **Cultural Authenticity**: Built in collaboration with local Moroccan guides
- **Modern Technologies**: React 18, Node.js 20, MongoDB Atlas
- **International Standards**: GDPR compliance, accessibility features

---

**MarrakechDunes** - *Connecting the world to authentic Moroccan adventures* 🏔️

*Built with ❤️ for authentic travel experiences*