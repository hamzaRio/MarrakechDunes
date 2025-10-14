# MarrakechDunes Deployment Guide

## 🚨 CRITICAL: Environment Variables Required

Your server is currently showing mock data because the following environment variables are missing from your Render deployment:

### **Required Environment Variables for Render:**

1. **GetYourGuide API Configuration:**
   ```
   GYG_SUPPLIER_BASE=https://api.getyourguide.com
   GYG_SUPPLIER_USER=your-getyourguide-username
   GYG_SUPPLIER_PASS=your-getyourguide-password
   GYG_ENABLE_LIVE_SEARCH=true
   ```

2. **Rezdy API Configuration:**
   ```
   REZDY_API_KEY=your-rezdy-api-key
   # Demo key (GET only): 69f708868ddc45eaa1f9b9fad1ddeba5
   ```

3. **Client URL for CORS:**
   ```
   CLIENT_URL=https://marrakech-dunes.vercel.app,https://marrakech-dunes-*.vercel.app
   ```

## 🔧 How to Fix:

### **Step 1: Add Environment Variables to Render**
1. Go to your Render dashboard
2. Select your MarrakechDunes service
3. Go to "Environment" tab
4. Add the above environment variables
5. Click "Save Changes"
6. Restart your service

### **Step 2: Verify API Keys**
- **GetYourGuide**: You need valid API credentials from GetYourGuide
- **Rezdy**: Use the demo key `69f708868ddc45eaa1f9b9fad1ddeba5` for testing

### **Step 3: Test the Integration**
After adding the environment variables:
1. Go to your admin dashboard
2. Click "Add Activity"
3. Search for activities
4. You should see live data instead of "(Mock)" labels

## 🐛 Current Issues Fixed:

1. **✅ Avis Page Error**: Fixed RangeError in review-list component
2. **✅ Payment Methods**: All payment options (Espèces, Acompte, Virement, Carte, Autre) are available
3. **✅ Logout Redirect**: Fixed to redirect to home page
4. **✅ API Integration**: Added proper environment configuration

## 📋 Next Steps:

1. **Add environment variables to Render**
2. **Restart your Render service**
3. **Test the admin dashboard**
4. **Verify live API data is showing**

The code changes are already deployed, but the server needs the API keys to fetch live data instead of showing mock data.
