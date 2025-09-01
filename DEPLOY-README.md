# MarrakechDunes Deployment Guide

## Deploy from this Repository

### Step 1: Export to GitHub
```bash
# Create a zip of the repo (exclude node_modules, .git)
zip -r marrakech-dunes.zip . -x "node_modules/*" ".git/*" "dist/*"

# On your local machine or GitHub:
unzip marrakech-dunes.zip
cd marrakech-dunes
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/marrakech-dunes.git
git push -u origin main
```

### Step 2: Deploy Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

3. **Required Environment Variables**:
   ```
   VITE_API_URL=https://marrakechdunes.onrender.com
   ```

4. **Optional Environment Variables**:
   ```
   VITE_ASSETS_BASE=https://marrakechdunes.onrender.com/assets
   ```
   *(If not set, will auto-configure to use API_URL + /assets)*

### Step 3: Deploy Backend (Render)
1. Connect your GitHub repo to Render
2. **Required Environment Variables**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   SESSION_SECRET=your-secure-session-secret-min-32-chars
   JWT_SECRET=your-secure-jwt-secret-min-32-chars
   CLIENT_URL=http://localhost:5173,https://marrakech-dunes.vercel.app
   PORT=5000
   NODE_ENV=production
   ```

3. **Optional Environment Variables**:
   ```
   ADMIN_PASSWORD=your-secure-admin-password
   SUPERADMIN_PASSWORD=your-secure-superadmin-password
   WHATSAPP_ADMIN_PHONES=+212600623630,+212693323368,+212654497354
   ```

4. **Disk Storage**:
   - Mount path: `/app/attached_assets`
   - Size: 1GB minimum
   - Contains all activity images and media assets

## Post-Deployment Smoke Tests

### Backend Health Check
```bash
curl -i https://marrakechdunes.onrender.com/api/health
# Expected: 200 OK with JSON response including database status
```

### Asset Serving Test
```bash
curl -I https://marrakechdunes.onrender.com/assets/riad-kheirredine_1756041288677.jpg
# Expected: 200 OK with image content headers
```

### Frontend Connectivity Test
```bash
curl -i https://marrakech-dunes.vercel.app
# Expected: 200 OK with HTML response
```

## Post-Deploy Checklist

### Frontend Verification
- [ ] Homepage hero loads with background image
- [ ] Photo slideshow images display correctly
- [ ] Activity cards show images properly
- [ ] Language switcher works (EN/FR)
- [ ] Booking form opens and functions

### Backend Verification  
- [ ] Admin login accessible at `/admin/login`
- [ ] Database connection successful (not in fallback mode)
- [ ] API endpoints respond correctly
- [ ] Asset serving works from `/assets/` route
- [ ] CORS headers allow frontend requests

### Integration Testing
- [ ] Booking submissions work end-to-end
- [ ] WhatsApp notifications trigger (if configured)
- [ ] Admin dashboard displays data correctly
- [ ] Session authentication persists
- [ ] Static asset caching headers present

## Troubleshooting

### Common Issues

**1. Assets not loading:**
- Verify `VITE_ASSETS_BASE` points to your backend domain
- Check Render disk mount is properly configured
- Ensure assets exist in `/attached_assets/` directory

**2. CORS errors:**
- Verify `CLIENT_URL` includes your Vercel domain
- Check both http and https variants if needed

**3. Database connection issues:**
- Verify `MONGODB_URI` format and credentials
- Check MongoDB Atlas network access settings
- Monitor Render logs for connection errors

**4. Session/auth issues:**
- Ensure `SESSION_SECRET` is set and secure (32+ chars)
- Verify cookie settings for cross-domain setup
- Check admin credentials match environment variables

## Architecture Notes

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB + Sessions
- **Assets**: Centralized serving from backend `/assets/` endpoint
- **Security**: Rate limiting, CORS, session-based auth, input validation
- **Caching**: 7-day cache for static assets, appropriate headers

## Default Admin Access (Change in Production!)

- **Superadmin**: `nadia` / `Marrakech@2025`
- **Admin**: `ahmed` / `Marrakech@2025`
- **Admin**: `yahia` / `Marrakech@2025`

**⚠️ IMPORTANT**: Change these credentials via environment variables in production!