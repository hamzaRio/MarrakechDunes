# GetYourGuide Portal Setup Guide

## 🎯 Goal
Enable GetYourGuide portal self-tests to pass so you can unlock production credentials.

## ✅ What's Implemented

### **Server Endpoints (`/gyg/*`)**
- **GET** `/gyg/1/get-availabilities` - Returns availability data
- **POST** `/gyg/1/notify-availability-update` - Handles availability updates
- **POST** `/gyg/1/deals` - Creates deals (sandbox stub)
- **GET** `/gyg/1/deals` - Lists deals (sandbox stub)
- **DELETE** `/gyg/1/deals/:id` - Deletes deals (sandbox stub)
- **POST** `/gyg/1/suppliers` - Creates suppliers (sandbox stub)

### **Authentication**
- **Basic Auth** using `GYG_SUPPLIER_USER` and `GYG_SUPPLIER_PASS`
- **Secure endpoints** - All require valid credentials

## 🔧 Environment Variables (Render)

Set these in your Render dashboard:

```bash
GYG_SUPPLIER_USER=your-portal-username
GYG_SUPPLIER_PASS=your-portal-password-token
GYG_SUPPLIER_BASE=https://supplier-api.getyourguide.com/1
```

## 📋 Portal Configuration

### **1. API Base URL**
In your GetYourGuide Integrator Portal:
- **Set API Base URL to**: `https://marrakechdunes-sppy.onrender.com/gyg`

### **2. Self-Testing Tool Settings**
Use these exact settings:

#### **Product Configuration:**
- **Product ID**: `desert-tour-marrakech-001`
- **Time available**: "During operation hours (Time period)"
- **Price setup**: "Price per individual"
- **Configure automatically**: "Availability and price"

#### **Currency & Timezone:**
- **Currency**: `MAD`
- **Availability type**: "Total Availabilities"
- **Timezone**: `Africa/Casablanca`

#### **Participants:**
- **ADULT**: min=1, max=16
- **Supported**: CHILD
- **Unsupported**: INFANT

#### **Availability Dates:**
- **Available from**: `2025-10-25`
- **Available to**: `2025-12-26`
- **NOT available from**: `2025-12-24`
- **NOT available to**: `2025-12-25`

## 🧪 Test Commands

### **Test Availability Endpoint:**
```bash
curl -X GET "https://marrakechdunes-sppy.onrender.com/gyg/1/get-availabilities?product_id=desert-tour-marrakech-001&from=2025-10-25&to=2025-12-26&currency=MAD" \
  -H "Authorization: Basic $(echo -n 'your-username:your-password' | base64)"
```

### **Expected Response:**
```json
{
  "productId": "desert-tour-marrakech-001",
  "currency": "MAD",
  "availabilities": [
    {
      "start_time": "2025-10-25T09:00:00Z",
      "end_time": "2025-10-25T12:00:00Z",
      "total_available": 8,
      "price_per_person": 450,
      "categories": {
        "ADULT": { "min": 1, "max": 16 },
        "CHILD": { "min": 0, "max": 8 }
      }
    },
    {
      "start_time": "2025-12-26T09:00:00Z",
      "end_time": "2025-12-26T12:00:00Z",
      "total_available": 10,
      "price_per_person": 480,
      "categories": {
        "ADULT": { "min": 1, "max": 16 },
        "CHILD": { "min": 0, "max": 8 }
      }
    }
  ]
}
```

## 🎉 Success Criteria

### **Portal Tests Should Show:**
- ✅ **Self-testing tool**: "Completed" status
- ✅ **Test GetYourGuide endpoints**: "Completed" status
- ✅ **No 400/401 errors** in testing history
- ✅ **All endpoints responding** correctly

### **API Endpoints Working:**
- ✅ **GET /gyg/1/get-availabilities** returns 200 with availability data
- ✅ **POST /gyg/1/notify-availability-update** returns `{ ok: true }`
- ✅ **Deals endpoints** return proper stubs
- ✅ **Suppliers endpoints** return proper stubs

## 🔧 Troubleshooting

### **If Portal Shows 400:**
1. **Check Testing History** for exact URL/params
2. **Verify endpoint paths** match exactly
3. **Check query parameters** are correct
4. **Ensure response format** matches expected schema

### **If Portal Shows 401:**
1. **Verify environment variables** are set in Render
2. **Check credentials** match your portal
3. **Redeploy service** after setting env vars
4. **Test Basic Auth** manually with curl

### **If Tests Still Fail:**
1. **Check Render logs** for errors
2. **Verify service is running** and accessible
3. **Test endpoints manually** with the test script
4. **Contact GetYourGuide support** if needed

## 🔒 CSRF & Supplier API

### **CSRF Protection:**
- **CSRF is disabled** for `/gyg/*` endpoints (server-to-server communication)
- **Supplier endpoints** rely on HTTPS + Basic Auth (no CSRF needed)
- **Browser protection** remains active for all other routes
- **GetYourGuide portal** uses Basic Auth for secure communication

### **Security Model:**
- **HTTPS encryption** for all communications
- **Basic Auth** with username/password for authentication
- **No CSRF tokens** required for supplier API endpoints
- **Standard CSRF protection** for browser-based requests

## 📞 Support

### **GetYourGuide Support:**
- **Email**: `supplier-api@getyourguide.com`
- **Portal**: Use support section in integrator portal

### **Your System Status:**
- ✅ **Endpoints implemented** and mounted
- ✅ **Authentication working** with Basic Auth
- ✅ **CSRF bypass** for supplier API endpoints
- ✅ **Version alias support** for both `/gyg/1/*` and `/gyg/v1/*`
- ✅ **Response format** matches GYG requirements
- ✅ **Ready for portal testing**

### **API Version Support:**
- **Both `/gyg/1/*` and `/gyg/v1/*` are supported**
- **The portal typically uses `/v1`** for GetYourGuide integration
- **All endpoints work identically** regardless of version prefix

## 🚀 Next Steps

1. **Set environment variables** in Render
2. **Configure portal** with your API base URL
3. **Run self-tests** in the portal
4. **Get production credentials** after successful tests
5. **Enable live GetYourGuide data** in your system

**Your system is now ready for GetYourGuide portal self-tests!** 🎉
