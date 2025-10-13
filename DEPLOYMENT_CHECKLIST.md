# 🚀 MarrakechDunes Deployment Checklist

## ✅ **PRE-DEPLOYMENT SETUP**

### **1. Gmail App Password**
- [ ] Enable 2FA on `timedizzy45@gmail.com`
- [ ] Generate App Password for "Mail"
- [ ] Copy 16-character password

### **2. MongoDB Atlas**
- [ ] Create free cluster at https://cloud.mongodb.com/
- [ ] Create database user: `marrakechdunes`
- [ ] Get connection string
- [ ] Whitelist Render IP addresses

### **3. Render Environment Variables**
- [ ] `DATABASE_URL` - MongoDB connection string
- [ ] `JWT_SECRET` - 32+ character secret
- [ ] `SESSION_SECRET` - 32+ character secret
- [ ] `ADMIN_PASSWORD` - Secure admin password
- [ ] `SUPERADMIN_PASSWORD` - Secure superadmin password
- [ ] `SMTP_PASS` - Gmail App Password
- [ ] `WHATSAPP_RECEIVERS` - Admin phone numbers
- [ ] `CLIENT_URL` - Vercel frontend URL

### **4. Vercel Environment Variables**
- [ ] `VITE_API_URL` - Render backend URL
- [ ] `VITE_ASSETS_BASE` - Asset base URL
- [ ] `VITE_MAP_PROVIDER` - Map provider setting

## 🔧 **CONFIGURATION STEPS**

### **Step 1: Gmail Setup**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Generate App Password for "Mail"
5. Copy the 16-character password

### **Step 2: Render Backend**
1. Go to https://dashboard.render.com
2. Select your service: `marrakechdunes-sppy`
3. Go to Environment tab
4. Add all environment variables from checklist
5. Deploy the service

### **Step 3: Vercel Frontend**
1. Go to https://vercel.com/dashboard
2. Select your project: `marrakech-dunes`
3. Go to Settings → Environment Variables
4. Add all VITE_ variables
5. Redeploy the project

### **Step 4: MongoDB Atlas**
1. Go to https://cloud.mongodb.com/
2. Create free cluster (M0 Sandbox)
3. Create database user
4. Get connection string
5. Add to Render environment variables

## 🧪 **TESTING CHECKLIST**

### **Backend Tests**
- [ ] Health check: `https://marrakechdunes-sppy.onrender.com/api/health`
- [ ] Database connection working
- [ ] Email service working (test with Gmail App Password)
- [ ] Authentication endpoints working

### **Frontend Tests**
- [ ] Homepage loads: `https://marrakech-dunes.vercel.app`
- [ ] Admin login works
- [ ] Activities page loads
- [ ] Booking form works
- [ ] Admin dashboard accessible

### **Integration Tests**
- [ ] Email notifications working
- [ ] WhatsApp notifications working (if configured)
- [ ] Database operations working
- [ ] File uploads working

## 📊 **MONITORING SETUP**

### **UptimeRobot (Free)**
- [ ] Monitor frontend: `https://marrakech-dunes.vercel.app`
- [ ] Monitor backend: `https://marrakechdunes-sppy.onrender.com/api/health`
- [ ] Set up email alerts

### **Sentry (Free)**
- [ ] Create frontend project
- [ ] Create backend project
- [ ] Add DSN to environment variables
- [ ] Test error tracking

## 🎯 **PRODUCTION READINESS**

### **Security**
- [ ] All passwords are secure (32+ characters)
- [ ] HTTPS enabled on all services
- [ ] CORS properly configured
- [ ] Rate limiting active

### **Performance**
- [ ] Database indexes optimized
- [ ] Redis caching configured (optional)
- [ ] CDN enabled on Vercel
- [ ] Images optimized

### **Business Features**
- [ ] Competitor search working
- [ ] Booking system functional
- [ ] Payment processing working
- [ ] Admin notifications working

## 🚨 **TROUBLESHOOTING**

### **Common Issues**
1. **Email not working**: Check Gmail App Password
2. **Database connection failed**: Check MongoDB connection string
3. **CORS errors**: Check CLIENT_URL in backend
4. **Authentication failed**: Check JWT_SECRET and SESSION_SECRET

### **Debug Commands**
```bash
# Check backend logs
# Go to Render dashboard → Service → Logs

# Check frontend build
# Go to Vercel dashboard → Deployments → View logs

# Test email locally
node test-email.js
```

## 📞 **SUPPORT**

- **Documentation**: Check README.md
- **Issues**: GitHub Issues
- **Email**: timedizzy45@gmail.com
- **WhatsApp**: +212600623630

---

**🎉 Once all items are checked, your MarrakechDunes platform will be fully operational!**
