# 🏜️ MarrakechDunes - Premium Desert Adventures

> **A modern, full-stack tourism platform for booking authentic Marrakech experiences with competitive pricing intelligence and smart business management.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/marrakechdunes)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

## 🌟 Overview

MarrakechDunes is a comprehensive tourism platform that combines modern web technologies with intelligent business features. Built for tour operators who want to compete effectively in the Marrakech tourism market, it offers automated competitor analysis, smart pricing, and comprehensive business management tools.

### 🎯 Key Features

- **🤖 AI-Powered Competitor Analysis** - Automatic GetYourGuide price fetching
- **💰 Smart Pricing Engine** - Competitive pricing suggestions with dynamic pricing
- **📊 Advanced Analytics** - Real-time business metrics and insights
- **🔐 Role-Based Access Control** - Admin, Superadmin, and CEO dashboards
- **📱 Mobile-First Design** - Responsive across all devices with PWA support
- **🌍 Multi-Language Support** - French and English
- **💳 Payment Integration** - Deposit system with WhatsApp notifications
- **📈 Business Intelligence** - CSV/PDF exports and executive reports
- **🔄 Booking Status Workflow** - Complete booking lifecycle management
- **❌ Cancellation Handling** - Smart refund policies and automated processing
- **📧 Email Backup System** - SMTP fallback for notifications
- **👥 Group Booking Management** - Multi-participant bookings with discounts
- **📅 Rescheduling System** - Flexible booking changes with fee management
- **💲 Dynamic Pricing** - Seasonal, demand-based, and group pricing
- **📊 Capacity Management** - Waitlist and overbooking protection
- **🔮 Predictive Analytics** - Demand forecasting and business insights
- **👤 Customer Portal** - OTP-based self-service portal
- **📱 PWA Mobile App** - Offline booking, GPS navigation, photo sharing
- **📊 Business Intelligence Dashboard** - Executive KPI tracking and reporting

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query for server state
- **UI Components**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics
- **Maps**: Leaflet for interactive maps

### Backend (Node.js + Express)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Session management
- **Security**: Helmet, CORS, CSRF protection
- **File Upload**: Uppy with AWS S3 integration
- **Notifications**: WhatsApp API integration

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3
- **Containerization**: Docker

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Vercel account (for frontend)
- Render account (for backend)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/marrakechdunes.git
   cd marrakechdunes
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ../shared && npm install
   ```

3. **Environment Setup**
   
   **Backend (.env in server/)**
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/marrakech-tours
   SESSION_SECRET=your-super-secret-session-key
   JWT_SECRET=your-jwt-secret-key
   ADMIN_PASSWORD=admin123
   SUPERADMIN_PASSWORD=superadmin123
   CLIENT_URL=http://localhost:5173
   PORT=10000
   
   # Email Service (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=MarrakechDunes <noreply@marrakechdunes.com>
   
   # WhatsApp Integration
   WHATSAPP_RECEIVERS=+212XXXXXXXXX,+212YYYYYYYYY
   
   # Customer Portal
   OTP_WINDOW_MINUTES=10
   ```

   **Frontend (.env in client/)**
   ```env
   VITE_API_URL=http://localhost:10000/api
   VITE_ASSETS_BASE=/images
   
   # Analytics & Monitoring
   VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   
   # PWA & Push Notifications
   VITE_PUSH_PUBLIC_KEY=your-vapid-public-key
   VITE_PUSH_VAPID_SUBJECT=mailto:admin@marrakechdunes.com
   
   # Firebase (for push notifications)
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd server && npm run dev
   
   # Terminal 2: Frontend  
   cd client && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:10000/api
   - Admin Dashboard: http://localhost:5173/admin
   - Customer Portal: http://localhost:5173/customer
   - Business Intelligence: http://localhost:5173/admin/business-intelligence

## 📱 PWA Installation

### **For Customers**
1. **Visit the website** on your mobile device
2. **Look for the install prompt** (appears automatically)
3. **Tap "Install App"** when prompted
4. **Add to home screen** for native app experience

### **For Administrators**
1. **Access admin dashboard** at `/admin`
2. **Navigate to Business Intelligence** for advanced analytics
3. **Use the customer portal** at `/customer` for testing
4. **Install PWA** for mobile admin access

### **PWA Features**
- **Offline Booking**: Works without internet connection
- **Push Notifications**: Real-time booking updates
- **GPS Navigation**: Meeting point directions
- **Photo Sharing**: Upload tour photos
- **Native Performance**: App-like speed and responsiveness

## 🚀 Advanced Features

### 🔄 Booking Status Workflow
- **Status Management**: PENDING → CONFIRMED → PAID → IN_PROGRESS → COMPLETED
- **Transition Validation**: Enforce business rules for status changes
- **Audit Logging**: Track who changed what and when
- **Admin Interface**: Visual status management with color-coded badges

### ❌ Smart Cancellation System
- **Refund Policies**: 
  - 24+ hours: 100% refund
  - 12-24 hours: 50% refund  
  - 6-12 hours: 25% refund
  - <6 hours: No refund
- **Reason Tracking**: Weather, Emergency, Travel, Health, Other
- **Automated Processing**: Instant refund calculations
- **Customer Communication**: WhatsApp + Email notifications

### 📧 Email Backup System
- **SMTP Integration**: Nodemailer with configurable providers
- **Fallback Notifications**: When WhatsApp fails, email takes over
- **Template System**: Consistent messaging across channels
- **Delivery Tracking**: Monitor notification success rates

### 👥 Group Booking Management
- **Multi-Participant Support**: Up to 20+ people per booking
- **Automatic Discounts**: 10% for 5+ people, 15% for 9+ people
- **Coordinator System**: Designated group contact person
- **Participant Tracking**: Individual names and contact info

### 📅 Rescheduling System
- **Flexible Changes**: Up to 2 reschedules per booking
- **Deadline Protection**: 48-hour minimum notice required
- **Fee Management**: 50 MAD reschedule fee
- **Date Validation**: Prevent double-booking conflicts

### 💲 Dynamic Pricing Engine
- **Seasonal Adjustments**: 
  - Peak (Jun-Aug): +30%
  - Shoulder (Apr-May, Sep-Oct): +10%
  - Low (Nov-Mar): -10%
- **Demand-Based Pricing**:
  - High demand (>80% capacity): +20%
  - Medium demand (50-80%): 0%
  - Low demand (<50%): -20%
- **Group Discounts**: Automatic tiered pricing

### 📊 Capacity Management
- **Waitlist System**: Automatic queuing when full
- **Overbooking Protection**: Max 10% overbooking allowed
- **Auto-Promotion**: Move waitlist to confirmed when space opens
- **Weather Dependencies**: Mark activities affected by weather

### 🔮 Predictive Analytics
- **Demand Forecasting**: Seasonal pattern analysis
- **Weather Impact**: Historical weather correlation
- **Cancellation Analysis**: Reason and timing patterns
- **Revenue Projections**: Moving average forecasts

### 👤 Customer Portal
- **OTP Authentication**: Phone-based login system
- **Self-Service**: View bookings, reschedule, cancel
- **Review System**: Post-tour feedback collection
- **Profile Management**: Update contact information

### 📱 Progressive Web App (PWA)
- **Offline Booking**: Cache booking forms for offline use
- **Push Notifications**: Real-time booking updates
- **GPS Navigation**: Meeting point directions
- **Photo Sharing**: Upload and share tour photos
- **Install Prompt**: Native app-like experience

### 📊 Business Intelligence Dashboard
- **Revenue Analytics**: Daily, monthly, seasonal trends
- **Customer Insights**: Segments, repeat rates, lifetime value
- **Operational Metrics**: Capacity utilization, weather impact
- **Export Capabilities**: CSV downloads for external analysis

## 📱 Features Overview

### 🎯 Customer Experience

#### **Simplified Booking Flow**
- **5 Essential Fields**: Name, email, phone, date, participants
- **One-Page Form**: Streamlined booking process
- **Mobile Optimized**: Touch-friendly interface
- **Real-Time Validation**: Instant feedback

#### **Smart Activity Discovery**
- **Visual Activity Cards**: High-quality images with clear pricing
- **Category Filtering**: Adventure, Cultural, Nature, Desert, City
- **Search Functionality**: Find activities by name or location
- **Responsive Design**: Perfect on all devices

#### **Competitive Pricing**
- **Transparent Pricing**: Clear, upfront costs
- **Deposit System**: 30% deposit to secure bookings
- **WhatsApp Confirmations**: Instant booking confirmations
- **Price Comparison**: See how we compare to competitors

### 🏢 Business Management

#### **Admin Dashboard**
- **Activity Management**: Create, edit, delete activities
- **Booking Management**: View, update, cancel bookings
- **Customer Insights**: Contact information and booking history
- **Revenue Tracking**: Real-time financial metrics

#### **Superadmin Features**
- **Admin User Management**: Create and manage admin accounts
- **System Monitoring**: Performance and health metrics
- **Audit Logging**: Track all system activities
- **Advanced Analytics**: Business intelligence reports

#### **CEO Operations Dashboard**
- **Executive Summary**: Key performance indicators
- **Strategic Insights**: AI-powered recommendations
- **One-Click Reports**: PDF exports for stakeholders
- **Competitive Analysis**: Market positioning insights

### 🤖 AI-Powered Features

#### **GetYourGuide Integration**
- **Automatic Price Fetching**: Real-time competitor analysis
- **Smart Pricing Suggestions**: 
  - Aggressive (15% below competitor)
  - Competitive (5% below competitor)
  - Premium (10% above competitor)
- **Market Intelligence**: Ratings, reviews, and pricing trends

#### **Smart Notifications**
- **24-Hour Reminders**: Automated booking confirmations
- **2-Hour Alerts**: Last-minute reminders
- **Weather-Based Notifications**: Activity-specific weather alerts
- **Payment Reminders**: Automated follow-ups

#### **Activity Recommendations**
- **AI-Powered Suggestions**: Based on customer preferences
- **Weather Compatibility**: Match activities to weather conditions
- **Group Size Optimization**: Appropriate activity selection
- **Budget-Aware Recommendations**: Price-conscious suggestions

## 🛠️ Technical Implementation

### **Frontend Architecture**

```typescript
src/
├── components/           # Reusable UI components
│   ├── analytics/        # Analytics dashboards
│   ├── admin/           # Admin-specific components
│   └── forms/           # Form components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── locales/             # Translation files
├── pages/               # Route components
└── test/                # Test files
```

### **Backend Architecture**

```typescript
server/src/
├── config/              # Environment configuration
├── routes/              # API route handlers
├── middleware/          # Express middleware
├── storage/             # Database operations
├── services/            # Business logic
└── utils/               # Utility functions
```

### **Database Schema**

```typescript
// Activities
interface Activity {
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  difficulty: string;
  duration: string;
  location: string;
  maxParticipants: number;
  imageUrls: string[];
  getyourguidePrice?: number;
  isActive: boolean;
}

// Bookings
interface Booking {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  activityId: string;
  preferredDate: Date;
  participants: number;
  totalAmount: number;
  depositAmount?: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod: string;
}
```

## 🔐 Security Features

### **Authentication & Authorization**
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Admin, Superadmin, CEO levels
- **Session Security**: HttpOnly cookies, CSRF protection
- **Password Hashing**: bcrypt with salt rounds

### **Data Protection**
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **Rate Limiting**: API request throttling
- **File Upload Security**: Type and size validation

### **Infrastructure Security**
- **HTTPS Enforcement**: SSL/TLS encryption
- **CORS Configuration**: Cross-origin request control
- **Environment Variables**: Secure configuration management
- **Database Security**: MongoDB Atlas security features

## 📊 Analytics & Monitoring

### **Real-Time Metrics**
- **Performance Monitoring**: Response times, uptime
- **User Analytics**: Page views, session duration
- **Business Metrics**: Revenue, bookings, conversion rates
- **System Health**: CPU, memory, database performance

### **Business Intelligence**
- **Revenue Reports**: Daily, weekly, monthly breakdowns
- **Customer Insights**: Demographics, preferences
- **Activity Performance**: Popular activities, pricing analysis
- **Competitive Analysis**: Market positioning reports

### **Export Capabilities**
- **CSV Exports**: Booking data, customer lists
- **PDF Reports**: Executive summaries, financial reports
- **Audit Logs**: System activity tracking
- **Custom Reports**: Tailored business insights

## 📊 Monitoring & SEO

### **Uptime Monitoring with UptimeRobot**

**Setup Instructions:**
1. **Create UptimeRobot Account**: Sign up at [uptimerobot.com](https://uptimerobot.com)
2. **Add Monitors**:
   - **Frontend Monitor**: 
     - URL: `https://marrakech-dunes.vercel.app`
     - Type: HTTP(s)
     - Interval: 5 minutes
     - Alert: Email/SMS when down
   - **Backend Monitor**:
     - URL: `https://marrakechdunes-sppy.onrender.com/api/health`
     - Type: HTTP(s)
     - Interval: 5 minutes
     - Alert: Email/SMS when down

**Benefits for Tour Business:**
- **Prevent Lost Bookings**: Immediate alerts when site is down
- **Revenue Protection**: Tourists can't book when site is unavailable
- **Customer Experience**: Ensure 24/7 booking availability
- **Professional Image**: Reliable tour operator reputation

### **Error Tracking with Sentry**

**Setup Instructions:**
1. **Create Sentry Account**: Sign up at [sentry.io](https://sentry.io)
2. **Create Projects**: 
   - Frontend project for React errors
   - Backend project for Node.js errors
3. **Get DSN Keys**: Copy DSN from project settings
4. **Configure Environment Variables**:
   ```env
   # Frontend (.env)
   VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
   
   # Backend (.env)
   SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
   ```

**Tour Business Benefits:**
- **Payment Error Tracking**: Monitor booking payment failures
- **WhatsApp Integration**: Track notification delivery issues
- **Admin Dashboard**: Monitor booking management errors
- **Customer Experience**: Proactive error resolution

### **SEO Optimization**

**Files Created:**
- **`/client/public/sitemap.xml`**: Search engine site map
- **`/client/public/robots.txt`**: Crawler instructions
- **`/client/src/components/SEOHead.tsx`**: Meta tags component

**Tourism SEO Keywords:**
- "Marrakech desert tours"
- "Hot air balloon Marrakech"
- "Camel rides Marrakech"
- "Agafay Desert tours"
- "Atlas Mountains day trip"
- "Ouzoud waterfalls tour"

**SEO Benefits:**
- **Tour Discovery**: Help tourists find your experiences
- **Local SEO**: Target tourists in Marrakech
- **Mobile SEO**: Optimize for tourist mobile searches
- **Competitive Advantage**: Outrank other tour operators

### **Google Analytics v4**

**Setup Instructions:**
1. **Create GA4 Property**: Set up at [analytics.google.com](https://analytics.google.com)
2. **Get Measurement ID**: Copy G-XXXXXXXXXX format ID
3. **Configure Environment Variable**:
   ```env
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

**Tour Business Analytics:**
- **Popular Tours**: Track which activities are most viewed
- **Booking Funnel**: Monitor from discovery to booking
- **Geographic Data**: Understand tourist origins
- **Device Usage**: Optimize for mobile tourists
- **Conversion Tracking**: Monitor booking success rates

## 🚀 Deployment

### **Frontend (Vercel)**
```bash
# Build and deploy
npm run build
vercel --prod
```

### **Backend (Render)**
```yaml
# render.yaml
services:
  - type: web
    name: marrakechdunes-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SESSION_SECRET
        sync: false
```

### **Docker Deployment**
```bash
# Build Docker image
docker build -t marrakechdunes .

# Run container
docker run -p 3000:3000 marrakechdunes
```

## 🧪 Testing

### **Frontend Testing**
```bash
cd client
npm run test
npm run test:coverage
```

### **Backend Testing**
```bash
cd server
npm run test
npm run test:integration
```

### **End-to-End Testing**
```bash
npm run test:e2e
```

## 📚 API Documentation

### **Authentication Endpoints**
```typescript
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

### **Activity Endpoints**
```typescript
GET /api/activities
POST /api/admin/activities
PUT /api/admin/activities/:id
DELETE /api/admin/activities/:id
```

### **Booking Endpoints**
```typescript
POST /api/bookings
GET /api/admin/bookings
PUT /api/admin/bookings/:id
DELETE /api/admin/bookings/:id
```

### **Analytics Endpoints**
```typescript
GET /api/analytics/performance
GET /api/analytics/business
GET /api/analytics/users
GET /api/analytics/demand
GET /api/analytics/weather-impact
GET /api/analytics/cancellations
GET /api/analytics/revenue
```

### **Booking Management Endpoints**
```typescript
PATCH /api/bookings/:id/status
PATCH /api/bookings/:id/cancel
PATCH /api/bookings/:id/reschedule
POST /api/bookings/group
```

### **Notification Endpoints**
```typescript
GET /api/notifications/templates
POST /api/notifications/preview
POST /api/notifications/send
POST /api/notifications/email/test
```

### **Pricing Endpoints**
```typescript
GET /api/pricing/quote
```

### **Customer Portal Endpoints**
```typescript
POST /api/portal/request-otp
POST /api/portal/login
GET /api/portal/me/bookings
POST /api/portal/bookings/:id/cancel
POST /api/portal/bookings/:id/reschedule
POST /api/portal/reviews
```

### **Business Intelligence Endpoints**
```typescript
GET /api/bi/revenue
GET /api/bi/customers
GET /api/bi/operations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/yourusername/marrakechdunes/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/marrakechdunes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/marrakechdunes/discussions)

## 🙏 Acknowledgments

- **GetYourGuide**: For competitive pricing inspiration
- **Vercel**: For frontend hosting
- **Render**: For backend hosting
- **MongoDB**: For database services
- **Open Source Community**: For amazing tools and libraries

---

**Built with ❤️ for the Marrakech tourism community**

*Experience the magic of Morocco with MarrakechDunes* 🏜️✨#   U p d a t e d   1 0 / 0 8 / 2 0 2 5   1 3 : 5 9 : 4 7  
 