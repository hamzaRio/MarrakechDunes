# MarrakechDunes - Moroccan Adventure Booking Platform

A comprehensive full-stack web application for booking authentic Moroccan desert adventures and experiences. Built with React frontend and Node.js backend, featuring real-time booking management and admin dashboard.

## 🌟 Features

- **Customer Portal**: Browse activities, make bookings, view reviews
- **Admin Dashboard**: Manage bookings, activities, users with role-based access
- **Real-time Notifications**: WhatsApp integration for instant booking alerts
- **Payment Management**: Cash payment tracking with deposit system
- **Multi-language Support**: English, French, and Arabic
- **Review System**: Customer feedback with admin approval
- **Analytics Dashboard**: Business intelligence and revenue tracking

## 🚀 Live Demo

- **Frontend**: [Deployed on Vercel](https://marrakech-dunes.vercel.app)
- **Backend API**: [Deployed on Render](https://marrakech-dunes-backend.onrender.com)

## 🛠 Tech Stack

### Frontend
- React 18 with TypeScript
- Wouter for routing
- TanStack Query for state management
- Shadcn/ui components
- Tailwind CSS
- Framer Motion for animations

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- Session-based authentication
- Rate limiting and security middleware
- RESTful API design

## 📦 Project Structure

```
marrakech-dunes/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utility functions
│   │   └── hooks/         # Custom React hooks
├── server/                # Backend Express application
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── db.ts              # MongoDB connection
│   └── security-middleware.ts
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database models and validation
└── assets/               # Static assets (images, etc.)
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account or local MongoDB
- Git

### Clone Repository
```bash
git clone https://github.com/yourusername/marrakech-dunes.git
cd marrakech-dunes
npm install
```

### Environment Variables
Create `.env` file:
```env
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
PORT=5000
```

### Development
```bash
npm run dev
```
Runs both frontend and backend in development mode.

### Production Build
```bash
npm run build
npm start
```

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure build settings:
   - Build Command: `npm run build:client`
   - Output Directory: `client/dist`

### Backend (Render)
1. Connect GitHub repository to Render
2. Use the provided `render.yaml` configuration
3. Set environment variables in Render dashboard

## 📱 API Endpoints

### Public APIs
- `GET /api/activities` - List all activities
- `POST /api/bookings` - Create new booking
- `GET /api/reviews` - Get approved reviews

### Admin APIs (Authentication Required)
- `POST /api/auth/login` - Admin login
- `GET /api/admin/bookings` - Manage bookings
- `POST /api/admin/activities` - Create/update activities
- `GET /api/admin/analytics/*` - Business analytics

## 👥 Default Admin Users

- **CEO/Superadmin**: `nadia` / `<REDACTED>`
- **Admin**: `ahmed` / `<REDACTED>`
- **Admin**: `yahia` / `<REDACTED>`

## 🎯 Key Features

### Booking System
- Activity selection with pricing
- Date/time scheduling
- Customer information collection
- Payment status tracking (cash/deposit)
- WhatsApp notifications to staff

### Admin Dashboard
- Booking management with status updates
- Activity CRUD operations
- User role management
- Financial analytics and reporting
- Review moderation

### Security Features
- Rate limiting on API endpoints
- Session-based authentication
- Input validation with Zod
- CORS protection
- Security headers with Helmet

## 🌍 Multi-language Support

The platform supports:
- **English**: Default language
- **French**: Complete translation
- **Arabic**: RTL support with full translation

## 📞 Contact Integration

WhatsApp notifications sent to:
- Ahmed: +212600623630
- Yahia: +212693323368  
- Nadia: +212654497354

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Future Enhancements

- Online payment integration (Stripe/PayPal)
- Mobile app development
- Advanced booking calendar
- Customer loyalty program
- Email marketing automation
- Real-time chat support

---

Built with ❤️ for authentic Moroccan adventures