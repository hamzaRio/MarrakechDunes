# MarrakechDunes - Quick Start Guide

*Get your authentic Moroccan booking platform running in under 5 minutes*

## 🚀 Instant Deployment Options

### Option 1: Render (Recommended - Simplest)
```bash
# 1. Fork this repository on GitHub
# 2. Connect to Render.com
# 3. Create new Web Service from GitHub
# 4. Set environment variables (see below)
# 5. Deploy automatically!
```

**Monthly Cost**: $7 (includes database and hosting)
**Setup Time**: 5 minutes
**Difficulty**: Beginner

### Option 2: One-Command Docker
```bash
git clone https://github.com/your-username/marrakech-dunes.git
cd marrakech-dunes
cp .env.example .env
# Edit .env with your MongoDB URL
./deploy.sh production
```

**Monthly Cost**: $5-15 (VPS + database)
**Setup Time**: 10 minutes  
**Difficulty**: Intermediate

### Option 3: Development Mode
```bash
git clone https://github.com/your-username/marrakech-dunes.git
cd marrakech-dunes
npm install
npm run dev
```

**Monthly Cost**: Free (localhost only)
**Setup Time**: 2 minutes
**Difficulty**: Beginner

## 🔧 Required Environment Variables

### Minimal Setup (.env)
```bash
# Database (Get free MongoDB Atlas account)
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/marrakech-tours

# Security (Generate random string)
SESSION_SECRET=your-super-secret-session-key

# Admin Contacts
ADMIN_PHONE_AHMED=+212600623630
ADMIN_PHONE_YAHIA=+212693323368  
ADMIN_PHONE_NADIA=+212654497354
```

### Get MongoDB Atlas URL (Free)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create new cluster (M0 Free)
4. Create database user
5. Get connection string
6. Replace `<username>`, `<password>`, and `<cluster>` in URL

## 📋 Platform-Specific Setup

### Render Deployment
```yaml
# render.yaml (auto-created)
services:
- type: web
  name: marrakech-dunes
  env: node
  buildCommand: npm run build
  startCommand: npm start
  envVars:
  - key: DATABASE_URL
    value: [Your MongoDB Atlas URL]
  - key: SESSION_SECRET  
    value: [Random secure string]
```

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up

# Set environment variables in Railway dashboard
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
```

## ✅ Verification Steps

### 1. Health Check
```bash
curl https://your-domain.com/api/health
# Should return: {"status":"healthy","database":"connected"}
```

### 2. Test Booking Flow
1. Visit your domain
2. Click "Book Now" on any activity
3. Complete booking form with test data
4. Verify WhatsApp notification received

### 3. Admin Access
1. Go to `/admin/login`
2. Username: `nadia` / Password: `Marrakech@2025`
3. Verify dashboard loads with booking data

## 🔨 Common Issues & Solutions

### Database Connection Failed
```bash
# Check MongoDB Atlas IP whitelist
# Add 0.0.0.0/0 for development (not production!)
# Verify username/password in connection string
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version (requires 18+)
node --version
```

### Port Conflicts
```bash
# Change port in .env file
PORT=5001

# Or kill existing process
lsof -ti:5000 | xargs kill
```

## 🎯 Next Steps

### 1. Customize Your Platform
- Update activity descriptions and pricing
- Add your authentic activity photos  
- Configure WhatsApp numbers for your team
- Set up custom domain name

### 2. Enhanced Features
- Add email notifications (SMTP configuration)
- Integrate payment processing (Stripe)
- Set up Google Analytics tracking
- Configure automated backups

### 3. Production Optimization
- Set up SSL certificate (automatic with most platforms)
- Configure CDN for faster image loading
- Set up monitoring and alerts
- Plan backup and disaster recovery

## 📞 Support

### Quick Help
- **Health Check**: `curl https://your-domain.com/api/health`
- **Logs**: Check platform dashboard for error logs
- **Database**: MongoDB Atlas dashboard for connection issues

### Contact
- **Technical Issues**: Create GitHub issue
- **Business Questions**: WhatsApp admin numbers above
- **Documentation**: See full README.md and DEPLOYMENT_GUIDE.md

## 🎉 Success!

Your MarrakechDunes platform is now live! You have:

✅ **Full booking system** with international phone support  
✅ **Admin dashboard** for managing bookings and activities  
✅ **WhatsApp notifications** for instant booking alerts  
✅ **Responsive design** that works on all devices  
✅ **Production-ready** infrastructure with monitoring  

Start taking authentic Moroccan adventure bookings today! 🏔️