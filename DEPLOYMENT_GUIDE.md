# MarrakechDunes Deployment Guide

## Quick Start Options

### 1. Simple Docker Deployment (Recommended)

```bash
# Clone repository
git clone https://your-repo-url.git
cd marrakech-dunes

# Set environment variables
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string

# Build and run
docker-compose up -d

# Your app is now running at http://localhost
```

### 2. Platform Deployments

#### Render (One-click Backend)
1. Connect your GitHub repository to Render
2. Choose "Web Service"
3. Build command: `npm run build`
4. Start command: `npm start`
5. Environment variables: Set DATABASE_URL, SESSION_SECRET

#### Vercel (Frontend + API)
```bash
npm install -g vercel
vercel --prod
```

#### Railway (Full-stack)
```bash
npm install -g @railway/cli
railway login
railway up
```

## Environment Variables

### Required Variables
```env
# Database
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/marrakech-tours
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/marrakech-tours

# Session Security
SESSION_SECRET=your-super-secret-session-key-here

# Production Settings
NODE_ENV=production
PORT=5000

# Optional: WhatsApp Integration
WHATSAPP_API_KEY=your-whatsapp-api-key
```

### Optional Variables
```env
# Email (if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment (future)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Production Optimizations

### 1. Performance Enhancements

#### MongoDB Indexes
```javascript
// Run these in MongoDB Atlas or your database
db.bookings.createIndex({ "customerPhone": 1, "preferredDate": 1 })
db.bookings.createIndex({ "status": 1, "createdAt": -1 })
db.activities.createIndex({ "name": 1, "isActive": 1 })
db.users.createIndex({ "username": 1 }, { unique: true })
```

#### Caching Strategy
- Static assets: 1 year cache
- API responses: 5 minutes cache
- Images: CDN with 30-day cache

### 2. Security Hardening

#### HTTP Security Headers
```javascript
// Already implemented in nginx.conf
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
```

#### Rate Limiting
```javascript
// API endpoints: 10 requests/second
// Booking endpoints: 5 requests/second
// Login attempts: 3 attempts/5 minutes
```

### 3. Monitoring & Health Checks

#### Health Check Endpoint
```bash
curl https://your-domain.com/api/health
# Returns: {"status":"ok","database":"connected","activities":5}
```

#### Monitoring Setup
```javascript
// Set up monitoring with:
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
```

## Deployment Strategies

### 1. Blue-Green Deployment
```bash
# Deploy to staging
docker-compose -f docker-compose.staging.yml up -d

# Test staging
curl https://staging.your-domain.com/api/health

# Switch to production
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Rolling Updates
```yaml
# kubernetes/deployment.yml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 25%
    maxSurge: 25%
```

### 3. Canary Deployment
```bash
# Deploy 10% traffic to new version
kubectl patch deployment marrakech-app -p '{"spec":{"replicas":1}}'
# Monitor metrics, then scale up if successful
```

## Database Migration Strategy

### Backup Before Deployment
```bash
# MongoDB Atlas backup
mongodump --uri="mongodb+srv://..." --out=backup-$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$DATABASE_URL" --out="backups/backup_$DATE"
tar -czf "backups/backup_$DATE.tar.gz" "backups/backup_$DATE"
rm -rf "backups/backup_$DATE"
```

### Schema Changes
```javascript
// Use Mongoose migrations for schema changes
// Example: Adding new field to bookings
const migration = {
  up: async () => {
    await Booking.updateMany(
      { customerEmail: { $exists: false } },
      { $set: { customerEmail: "" } }
    );
  },
  down: async () => {
    await Booking.updateMany(
      {},
      { $unset: { customerEmail: "" } }
    );
  }
};
```

## CI/CD Pipeline

### GitHub Actions (Automated)
1. **On Push to Main**: Deploy to staging
2. **On Push to Production**: Deploy to production
3. **Tests**: Run before deployment
4. **Rollback**: Automatic on health check failure

### Manual Deployment Commands
```bash
# Build production image
docker build -t marrakech-dunes:latest .

# Tag for registry
docker tag marrakech-dunes:latest your-registry/marrakech-dunes:latest

# Push to registry
docker push your-registry/marrakech-dunes:latest

# Deploy with zero downtime
kubectl set image deployment/marrakech-app container=your-registry/marrakech-dunes:latest
```

## Cost Optimization

### Monthly Costs (Estimated)
- **MongoDB Atlas M0**: Free (512MB)
- **Render Starter**: $7/month
- **Vercel Pro**: $20/month (if needed)
- **CloudFlare**: Free (CDN + SSL)
- **Total**: $7-27/month

### Resource Requirements
- **RAM**: 512MB minimum, 1GB recommended
- **CPU**: 0.5 vCPU minimum, 1 vCPU recommended
- **Storage**: 5GB for assets and logs
- **Bandwidth**: ~10GB/month for small business

## Troubleshooting

### Common Issues

#### Database Connection Timeout
```bash
# Check MongoDB Atlas IP whitelist
# Verify connection string format
# Test connection: mongosh "mongodb+srv://..."
```

#### High Memory Usage
```bash
# Monitor with: docker stats marrakech-app
# Increase memory limit in docker-compose.yml
# Add memory limits: deploy.resources.limits.memory: 1G
```

#### Slow Response Times
```bash
# Enable MongoDB profiling
db.setProfilingLevel(2, { slowms: 100 })

# Check slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5)

# Add indexes for slow queries
```

## Security Checklist

- [ ] Environment variables secured
- [ ] MongoDB Atlas IP whitelist configured
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] Session security configured
- [ ] CORS properly configured
- [ ] Error messages sanitized
- [ ] Database queries parameterized

## Support & Maintenance

### Backup Schedule
- **Daily**: Automated MongoDB backup
- **Weekly**: Full application backup
- **Monthly**: Archive old logs and data

### Update Schedule
- **Dependencies**: Monthly security updates
- **Node.js**: Every 6 months (LTS versions)
- **MongoDB**: Annual major version updates
- **SSL Certificates**: Auto-renewal via Let's Encrypt

### Monitoring Alerts
- **Uptime**: Alert if down > 2 minutes
- **Response Time**: Alert if > 2 seconds
- **Database**: Alert if connection issues
- **Disk Space**: Alert if > 80% full
- **Memory**: Alert if > 90% usage

This guide provides everything needed for a production-ready deployment of MarrakechDunes with optimal performance, security, and maintainability.