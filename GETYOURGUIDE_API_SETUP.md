# GetYourGuide API Setup

## Current Status: Mock Data ✅

The "Search GetYourGuide" button currently uses **mock data** from your project, not the real GetYourGuide website.

## How It Works:

### **Option 1: Mock Data (Current - No Setup Required)**
- ✅ **Working now** - 15+ realistic Moroccan activities
- ✅ **MAD pricing** - All prices in Moroccan Dirham
- ✅ **Fast & reliable** - No API limits or delays
- ✅ **No setup required** - Works immediately

### **Option 2: Real GetYourGuide API (Optional)**
- 🔄 **Live data** - Real-time activities from GetYourGuide
- 🔄 **Current prices** - Actual pricing from their website
- 🔄 **More activities** - Access to their full database
- ⚠️ **Requires setup** - Need API key and configuration

## To Enable Real GetYourGuide API:

### Step 1: Get API Key
1. Go to [GetYourGuide Developer Portal](https://developers.getyourguide.com/)
2. Sign up for a developer account
3. Create a new application
4. Get your API key

### Step 2: Add Environment Variable
Create a `.env` file in the `client` folder:
```bash
VITE_GETYOURGUIDE_API_KEY=your_actual_api_key_here
```

### Step 3: Restart Development Server
```bash
npm run dev:client
```

## Visual Indicators:

- **🟢 "Live API"** - Connected to real GetYourGuide API
- **🟠 "Mock Data"** - Using project's mock data (current)

## Current Mock Data Includes:

### 🏜️ Desert & Atlas Tours
- Atlas Mountains & Desert Day Trip - **450 MAD**
- 3-Day Sahara Desert Tour - **1800 MAD**
- Agafay Desert Day Trip - **380 MAD**

### 🏛️ City & Cultural
- Marrakech City Walking Tour - **250 MAD**
- Bahia Palace & El Badi Palace Tour - **180 MAD**

### 🍽️ Food & Cooking
- Moroccan Cooking Class - **350 MAD**
- Marrakech Food Tour - **280 MAD**

### 🌊 Nature & Adventure
- Ourika Valley Day Trip - **320 MAD**
- Hot Air Balloon Ride - **1200 MAD**

### 🏖️ Day Trips
- Essaouira Day Trip - **480 MAD**
- Ouzoud Waterfalls - **420 MAD**

### 🏘️ Cultural & Historical
- Berber Village Experience - **280 MAD**
- Traditional Hammam & Spa - **180 MAD**

### 💎 Luxury & Premium
- Luxury Desert Camp - **2800 MAD**
- Private City Tour - **800 MAD**

## Recommendation:

**Keep using mock data** for now - it's comprehensive, realistic, and perfect for your needs. The real API is only needed if you want live pricing updates or access to their full activity database.
