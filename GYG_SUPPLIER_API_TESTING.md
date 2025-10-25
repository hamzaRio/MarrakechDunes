# GetYourGuide Supplier API Testing Guide

This document provides instructions for testing the GYG Supplier API endpoints that are required to pass the GetYourGuide Integrator self-tests.

## Environment Variables Required

Set these environment variables in your deployment platform (Render):

```bash
GYG_SUPPLIER_USER=MarrakechDunes
GYG_SUPPLIER_PASS=2bfaf87bfbdc4119b575b96c63f272f7facca57e6bb45a48e767f0de9e4ed64
```

## API Endpoints

### 1. Health Check (No Auth Required)
```bash
GET /gyg/1/health
```

**Response:**
```json
{ "ok": true }
```

### 2. Notify Availability Update (Basic Auth Required)
```bash
POST /gyg/1/notify-availability-update
```

**Headers:**
- `Authorization: Basic <base64(username:password)>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "product_id": "desert-tour-marrakech-001",
  "date": "2025-11-10",
  "slots": [
    {
      "start_time": "2025-11-10T09:00:00Z",
      "end_time": "2025-11-10T12:00:00Z",
      "total_available": 10,
      "price_per_person": 480,
      "categories": {
        "ADULT": {"min": 1, "max": 16},
        "CHILD": {"min": 0, "max": 8}
      }
    },
    {
      "start_time": "2025-11-10T15:00:00Z",
      "end_time": "2025-11-10T18:00:00Z",
      "total_available": 10,
      "price_per_person": 480,
      "categories": {
        "ADULT": {"min": 1, "max": 16},
        "CHILD": {"min": 0, "max": 8}
      }
    }
  ]
}
```

**Response:**
```json
{ "ok": true }
```

### 3. Get Availabilities (Basic Auth Required)
```bash
GET /gyg/1/get-availabilities?product_id=desert-tour-marrakech-001&from=2025-11-10&to=2025-11-11&currency=MAD
```

**Headers:**
- `Authorization: Basic <base64(username:password)>`

**Response:**
```json
[
  {
    "product_id": "desert-tour-marrakech-001",
    "currency": "MAD",
    "availabilities": [
      {
        "start_time": "2025-11-10T09:00:00Z",
        "end_time": "2025-11-10T12:00:00Z",
        "total_available": 10,
        "price_per_person": 480,
        "categories": {
          "ADULT": {"min": 1, "max": 16},
          "CHILD": {"min": 0, "max": 8}
        }
      },
      {
        "start_time": "2025-11-10T15:00:00Z",
        "end_time": "2025-11-10T18:00:00Z",
        "total_available": 10,
        "price_per_person": 480,
        "categories": {
          "ADULT": {"min": 1, "max": 16},
          "CHILD": {"min": 0, "max": 8}
        }
      }
    ]
  }
]
```

## cURL Test Commands

Replace `<PASS>` with your actual password:

```bash
# Test 1: Health check
curl -i https://marrakechdunes-sppy.onrender.com/gyg/1/health

# Test 2: Notify availability update
curl -u MarrakechDunes:<PASS> -X POST https://marrakechdunes-sppy.onrender.com/gyg/1/notify-availability-update \
  -H "Content-Type: application/json" \
  -d '{
    "product_id":"desert-tour-marrakech-001",
    "date":"2025-11-10",
    "slots":[
      {"start_time":"2025-11-10T09:00:00Z","end_time":"2025-11-10T12:00:00Z","total_available":10,"price_per_person":480,"categories":{"ADULT":{"min":1,"max":16},"CHILD":{"min":0,"max":8}}},
      {"start_time":"2025-11-10T15:00:00Z","end_time":"2025-11-10T18:00:00Z","total_available":10,"price_per_person":480,"categories":{"ADULT":{"min":1,"max":16},"CHILD":{"min":0,"max":8}}}
    ]
  }'

# Test 3: Get availabilities
curl -u MarrakechDunes:<PASS> \
  "https://marrakechdunes-sppy.onrender.com/gyg/1/get-availabilities?product_id=desert-tour-marrakech-001&from=2025-11-10&to=2025-11-11&currency=MAD"
```

## PowerShell Test Script

Run the included PowerShell test script:

```powershell
.\test-gyg-endpoints.ps1
```

## Features

- ✅ **Basic Authentication** with environment variables
- ✅ **Trailing slash support** for both `/gyg` and `/gyg/`
- ✅ **In-memory storage** for availability data
- ✅ **Proper JSON responses** with correct structure
- ✅ **Comprehensive logging** for debugging
- ✅ **Error handling** with appropriate HTTP status codes
- ✅ **CORS support** for server-to-server communication

## Troubleshooting

### 401 Unauthorized
- Check that `GYG_SUPPLIER_USER` and `GYG_SUPPLIER_PASS` are set correctly
- Verify the Basic Auth header is properly formatted
- Check server logs for authentication details

### 400 Bad Request
- Ensure required query parameters are provided
- Check that dates are in ISO 8601 UTC format
- Verify JSON payload structure matches expected format

### 500 Server Error
- Check server logs for detailed error information
- Verify environment variables are properly configured
- Ensure the server has sufficient memory for in-memory storage

## Implementation Notes

- The API uses in-memory storage for availability data during testing
- All timestamps must be in ISO 8601 UTC format (ending with 'Z')
- The response format matches GetYourGuide's expected structure exactly
- Basic Auth credentials are validated against environment variables
- All endpoints support both `/gyg` and `/gyg/` paths
