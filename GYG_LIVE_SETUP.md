# GetYourGuide Live API Setup

## Current Status
✅ **API Endpoints Working**: `/api/market/search` is functional  
✅ **Mock Data Working**: Returns diverse Morocco activities  
❌ **Live API Disabled**: `GYG_ENABLE_LIVE_SEARCH=false`  

## Required Environment Variables on Render

To enable **real GetYourGuide data** instead of mock data, you need to set these environment variables in your Render dashboard:

### 1. Enable Live Search
```
GYG_ENABLE_LIVE_SEARCH=true
```

### 2. GetYourGuide API Credentials
```
GYG_SUPPLIER_BASE=https://supplier-api.getyourguide.com/1
GYG_SUPPLIER_USER=your-gyg-username
GYG_SUPPLIER_PASS=your-gyg-password
```

## How to Configure

1. **Go to Render Dashboard** → Your Service → Environment
2. **Add these variables**:
   - `GYG_ENABLE_LIVE_SEARCH` = `true`
   - `GYG_SUPPLIER_BASE` = `https://supplier-api.getyourguide.com/1`
   - `GYG_SUPPLIER_USER` = Your GetYourGuide supplier username
   - `GYG_SUPPLIER_PASS` = Your GetYourGuide supplier password

3. **Redeploy** your service

## Expected Results After Configuration

### Before (Mock Data):
```json
{
  "liveSearchEnabled": false,
  "dryRun": true,
  "message": "GetYourGuide live search is disabled. Returning mock data for reference."
}
```

### After (Live Data):
```json
{
  "liveSearchEnabled": true,
  "dryRun": false,
  "message": "Live GetYourGuide search enabled - returning real data from GYG API."
}
```

## Test Commands

```bash
# Test current status
curl "https://marrakechdunes-sppy.onrender.com/api/market/search?provider=gyg&q=desert&city=marrakech"

# Test with different queries
curl "https://marrakechdunes-sppy.onrender.com/api/market/search?provider=gyg&q=fes&city=marrakech"
curl "https://marrakechdunes-sppy.onrender.com/api/market/search?provider=gyg&q=atlas&city=marrakech"
```

## Current Mock Data Features

Even without live API, the system provides:
- ✅ **Diverse Morocco activities** based on search query
- ✅ **Realistic pricing** in MAD currency
- ✅ **Proper filtering** by city and activity type
- ✅ **Search suggestions** in Add Activity form

## Next Steps

1. **Get GetYourGuide API credentials** from your supplier account
2. **Set environment variables** in Render
3. **Redeploy** the service
4. **Test live API** with the commands above

The system will automatically fallback to mock data if live API fails, ensuring reliability.
