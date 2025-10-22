# MarrakechDunes — GYG Research Bar Final Audit (Dry-Run)

## Summary

**Status: 🛠️ minimal diffs proposed**

The GYG research bar implementation required several fixes to align with the dry-run architecture. Key violations found and corrected:

- **API Hygiene**: Found hardcoded `/gyg/search` endpoints in client code
- **Type Safety**: Missing unified `MarketItem` type for GYG items
- **Provider Architecture**: Missing dry-run provider with proper request building
- **Secret Safety**: Found console.log statements exposing sensitive environment variables
- **Route Integration**: Market intelligence route lacked GYG provider support

## How it works (high level)

**Client Flow:**
1. Admin types activity name in "Add Activity" form
2. Client calls `GET {VITE_API_URL}/market/search?provider=gyg&q=<activity>&city=<city>`
3. Server dry-run provider returns `{ dryRun: true, request (redacted), sampleNormalizedShape }`
4. UI displays reference suggestions without making live API calls

**Server Flow:**
1. Route validates `provider=gyg` parameter
2. Calls `searchGYG()` with `dryRun: true` when `GYG_ENABLE_LIVE_SEARCH !== 'true'`
3. Provider builds request URL with encoded query/city, currency=MAD, content_language=fr-FR
4. Returns dry-run payload with redacted headers and sample data

## Files involved

| FILE | ROLE | NOTES |
|------|------|-------|
| `client/src/features/activities/AddActivityModal.tsx` | UI | Fixed to use `/market/search?provider=gyg` |
| `client/src/lib/getyourguide-api.ts` | API wrapper | Updated endpoint to market search |
| `server/src/routes/market-intelligence.ts` | Route | Added GYG provider handling |
| `server/src/providers/gyg.ts` | Provider | **NEW** - Dry-run GYG provider |
| `server/src/test-gyg-dry-run.ts` | Test | **NEW** - Dry-run validation tests |

## Environment

**Frontend:**
- `VITE_API_URL` (configured for Render backend)
- `VITE_MAP_PROVIDER` (Leaflet)
- `VITE_LEAFLET_ENABLED` (false)

**Backend:**
- `GYG_SEARCH_DRYRUN=true` (enforces dry-run mode)
- `GYG_ENABLE_LIVE_SEARCH=false` (prevents live calls)
- `GYG_SUPPLIER_BASE` (GetYourGuide API base URL)
- `GYG_SUPPLIER_USER` (credentials - presence only)
- `GYG_SUPPLIER_PASS` (credentials - presence only)
- `CLIENT_URL` (comma-separated origins)
- Security keys (presence only)

## Security checks

**✅ CORS Configuration:**
- Mounted before routes with `credentials: true`
- Uses comma-separated `CLIENT_URL` for origins
- Supports Vercel and Render domains

**✅ Secret Logging Policy:**
- Replaced `console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ LOADED' : '❌ NOT FOUND')` with boolean presence
- All sensitive values now use `!!process.env.VAR` pattern
- Authorization headers redacted in dry-run responses

## Developer quick test

```bash
# Build both client and server
npm --prefix server run build
npm --prefix client run build

# Test dry-run endpoint
curl "http://localhost:10000/api/market/search?provider=gyg&q=agafay&city=marrakech"
```

**Expected JSON response:**
```json
{
  "dryRun": true,
  "request": {
    "method": "GET",
    "url": "https://supplier-api.getyourguide.com/1/products?search=agafay%20marrakech&currency=MAD&content_language=fr-FR&market=MA&page=1&per_page=10",
    "headers": {
      "Authorization": "Basic <redacted>",
      "Accept": "application/json"
    },
    "notes": ["Dry-run mode: no network request", "Search term normalized and encoded", "Morocco market and MAD currency", "French language content"]
  },
  "sampleNormalizedShape": [
    {
      "provider": "GetYourGuide",
      "id": "sample-1",
      "title": "agafay Experience",
      "url": "https://www.getyourguide.com/sample",
      "city": "marrakech",
      "category": ["Tour"],
      "price_from": 150,
      "currency": "MAD",
      "rating": 4.5,
      "reviews_count": 25,
      "duration_text": "3 hours",
      "last_checked_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Migration toggle (for future live mode)

To enable real GYG calls later:
1. Set `GYG_ENABLE_LIVE_SEARCH=true`
2. Set `GYG_SEARCH_DRYRUN=false`
3. Implement rate limiting and caching
4. Add error handling for API failures
5. Update provider to make actual HTTP requests

## Changelog of this audit

**Violations Found & Fixed:**

1. **API Hygiene Violations:**
   - `client/src/features/activities/AddActivityModal.tsx:38` - Changed `/gyg/search` → `/market/search?provider=gyg`
   - `client/src/lib/getyourguide-api.ts:31` - Updated endpoint to market search

2. **Missing Provider Architecture:**
   - Created `server/src/providers/gyg.ts` with `buildGYGSearchRequest()`, `normalizeGYGProduct()`, `searchGYG()`
   - Added `MarketItem` type definition
   - Implemented dry-run logic with proper URL encoding

3. **Route Integration:**
   - Updated `server/src/routes/market-intelligence.ts` to handle `provider=gyg`
   - Added schema validation for provider parameter
   - Integrated dry-run provider calls

4. **Secret Safety:**
   - Replaced sensitive console.log statements with boolean presence checks
   - Ensured Authorization headers are redacted in responses

5. **Testing Infrastructure:**
   - Created `server/src/test-gyg-dry-run.ts` for validation
   - Tests URL encoding, header safety, and dry-run behavior

**Build Status:**
- ✅ Server build: `npm --prefix server run build` - SUCCESS
- ✅ Client build: `npm --prefix client run build` - SUCCESS
- ✅ TypeScript compilation: No errors
- ✅ All endpoints properly configured

**Result:** The GYG research bar now operates in a secure, dry-run mode that builds proper requests without making network calls, while maintaining the expected API contract for future live integration.
