import { fileURLToPath } from "url";
import path from "path";
import dotenvFlow from 'dotenv-flow';
import * as Sentry from "@sentry/node";
import "@sentry/tracing";
import pino from 'pino';
import { validateProductionEnvironment, getSecurityRecommendations } from './production-validator.js';
import { config as serverEnv } from './env.js';

// Fix UTF-8 console encoding for emojis and French characters
process.stdout.setEncoding("utf8");
process.stderr.setEncoding("utf8");

// Set UTF-8 environment variables for proper character handling
process.env.LANG = 'en_US.UTF-8';
process.env.LC_ALL = 'en_US.UTF-8';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Ensure proper UTF-8 handling in Node.js
if (process.platform === 'win32') {
  process.env.CHCP = '65001'; // UTF-8 code page on Windows
}

// Tour Business Logging Setup
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// Get the project root directory (one level up from server/src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '../');

// Load environment variables from project root using dotenv-flow
// In production (Docker), environment variables are set by deployment platform
try {
  dotenvFlow.config({
    path: serverDir,
    silent: true // Don't error if .env files are missing in production
  });
} catch (error) {
  console.log('📝 Note: .env files not found (expected in production Docker deployment)');
}

// Debug: Check if environment variables are loaded
console.log('?? Environment loading check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET' : 'NOT SET');

// Environment variables should be loaded by dotenv-flow above


// Environment validation - flexible for development
const isProduction = process.env.NODE_ENV === 'production';

// Set default PORT if not provided
if (!process.env.PORT) {
  process.env.PORT = '10000';
}
const criticalEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_PASSWORD', 
  'SUPERADMIN_PASSWORD',
  'SESSION_SECRET',
  'CLIENT_URL'
];

// Only enforce critical env vars in production
if (isProduction) {
  const missingVars = criticalEnvVars.filter(envVar => !process.env[envVar]);
  if (missingVars.length > 0) {
    console.error('? Missing critical environment variables:', missingVars);
    console.error('? Server cannot start without these variables');
    console.error('? Please check your Render environment variables');
    process.exit(1);
  }
} else {
  // For development, set defaults for missing variables
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'mongodb://localhost:27017/marrakechdunes';
    console.warn('??  Using default DATABASE_URL for development');
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'default-jwt-secret-for-development';
    console.warn('??  Using default JWT_SECRET for development');
  }
  if (!process.env.ADMIN_PASSWORD) {
    process.env.ADMIN_PASSWORD = 'admin123';
    console.warn('??  Using default ADMIN_PASSWORD for development');
  }
  if (!process.env.SUPERADMIN_PASSWORD) {
    process.env.SUPERADMIN_PASSWORD = 'superadmin123';
    console.warn('??  Using default SUPERADMIN_PASSWORD for development');
  }
  if (!process.env.CLIENT_URL) {
    process.env.CLIENT_URL = 'http://localhost:5173,https://marrakech-dunes.vercel.app,https://marrakech-dunes-*.vercel.app';
    console.warn('??  Using default CLIENT_URL for development');
  }
}

// Additional validation for SESSION_SECRET length in production
if (process.env.NODE_ENV === 'production' && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters long in production');
}

// Production environment validation
const envValidation = validateProductionEnvironment();
if (!envValidation.isValid) {
  console.error('❌ Environment validation failed');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.log('⚠️ Continuing in development mode with warnings');
  }
}

// Security recommendations
if (process.env.NODE_ENV === 'production') {
  console.log('🔒 Security recommendations:');
  getSecurityRecommendations().forEach(rec => console.log(`  � ${rec}`));
}

// Now import modules that depend on environment variables
import express, { type Request, type Response, type NextFunction, type CookieOptions, type RequestHandler } from "express";
import type { ServeStaticOptions } from "serve-static";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import session from "express-session";
import compression from "compression";
import morgan from "morgan";
import { generateCSRFToken, verifyCSRFToken } from "./csrf-protection.js";
import { 
  requestSizeLimit, 
  uploadRateLimit, 
  uploadSecurityHeaders, 
  securityRequestLogger,
  validateFileUpload 
} from "./security-hardening.js";
import { globalLimiter, strictLimiter } from "./rate-limiters.js";
// registerRoutes removed - routes are now mounted directly
import { connectToDatabase } from "./db.js";
import { notFoundHandler, globalErrorHandler } from "./error-handler.js";
import { sessionSecurity } from "./security-middleware.js";
import sessionRouter from "./routes/session.js";

// CORS origins are defined below in FRONT_ORIGINS

// Asset serving removed - all static assets served by frontend at /images/



// Logging helper
const log = (
  message: string,
  source = "express",
  level: "info" | "warn" | "error" = "info"
) => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const logMessage = `${formattedTime} [${source}] ${message}`;

  switch (level) {
    case "error":
      console.error(logMessage);
      break;
    case "warn":
      console.warn(logMessage);
      break;
    default:
      console.log(logMessage);
  }
};

const app = express();

// Initialize Sentry for error tracking
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of requests
    beforeSend(event) {
      // Don't send development errors
      if (process.env.NODE_ENV !== 'production') {
        return null;
      }
      return event;
    },
  });

  // Sentry request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  
  console.log('? Sentry error tracking initialized');
}

// Set trust proxy at the top before any middleware
app.set("trust proxy", 1);

// Root probes for GetYourGuide portal - must be first
app.get("/", (_req, res) => res.json({ ok: true }));
app.head("/", (_req, res) => res.status(200).end());

// CORS configuration - must be defined BEFORE all other middleware
const allowedOrigins = process.env.CLIENT_URL?.split(",") || [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://marrakech-dunes.vercel.app",
  "https://marrakech-dunes-*.vercel.app" // Allow all Vercel preview URLs
];

console.log('?? CORS Configuration:');
console.log('  CLIENT_URL:', process.env.CLIENT_URL);
console.log('  Allowed origins:', allowedOrigins);

// Production startup diagnostics
if (isProduction) {
  console.log('?? Production startup diagnostics:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  PORT:', process.env.PORT);
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('  SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET' : 'NOT SET');
  console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
  console.log('  CLIENT_URL:', process.env.CLIENT_URL || '? MISSING');
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    console.log(`?? CORS Check - Origin: ${origin}`);
    
    if (!origin) {
      console.log("? Allowing request without origin (SSR, Postman, mobile)");
      return callback(null, true); // SSR, Postman, mobile
    }
    
    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Automatically allow ALL Vercel preview URLs (with hyphen)
    if (origin && origin.match(/^https:\/\/marrakech-dunes-.*\.vercel\.app$/)) {
      console.log("? Allowing Vercel preview URL:", origin);
      return callback(null, true);
    }
    
    // Allow all marrakechdunes Vercel URLs (including preview URLs without hyphen)
    if (origin && origin.match(/^https:\/\/marrakechdunes-.*\.vercel\.app$/)) {
      console.log("? Allowing marrakechdunes Vercel URL:", origin);
      return callback(null, true);
    }
    
    // Allow all Vercel preview URLs with any subdomain pattern
    if (origin && origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      console.log("? Allowing any Vercel preview URL:", origin);
      return callback(null, true);
    }
    
    // Handle wildcard patterns in CLIENT_URL (for other domains)
    for (const allowedOrigin of allowedOrigins) {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (origin && regex.test(origin)) {
          console.log("? Allowing wildcard origin:", origin, "matches pattern:", allowedOrigin);
          return callback(null, true);
        }
      }
    }
    
    console.warn("❌ Blocked CORS origin:", origin);
    return callback(new Error("CORS not allowed for this origin: " + origin));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Accept",
    "Accept-Charset",
    "X-CSRF-Token",
    "X-Requested-With",
    "Authorization"
  ],
};

app.use(cors(corsOptions));

// Explicitly handle CORS preflight for all routes
app.options("*", cors(corsOptions));

// Additional CORS middleware to ensure headers are set
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for all requests
  if (origin) {
    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.match(/^https:\/\/marrakech-dunes-.*\.vercel\.app$/) ||
                     origin.match(/^https:\/\/marrakechdunes-.*\.vercel\.app$/) ||
                     origin.match(/^https:\/\/.*\.vercel\.app$/);
    
    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Accept-Charset, X-CSRF-Token, X-Requested-With, Authorization');
    }
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Security middleware with CORS-friendly configuration and map support
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable helmet's CORS policy to allow our custom headers
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com", "https://*.googleapis.com", "https://vercel.live"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://maps.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        "https://www.openstreetmap.org",
        "https://tile.openstreetmap.org",
        "https://*.tile.openstreetmap.org",
        "https://maps.gstatic.com",
        "https://maps.google.com",
        "https://*.google.com",
        "https://*.googleapis.com"
      ],
      frameSrc: ["'self'", "https://www.openstreetmap.org", "https://www.google.com", "https://maps.google.com"],
      connectSrc: ["'self'", "https://api.whatsapp.com", "https://maps.googleapis.com", "https://*.googleapis.com"],
    }
  }
}));

// Performance optimizations
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Request logging
app.use(morgan('combined', {
  skip: (req: Request, res: Response) => {
    // Skip logging for health checks and static assets
    return req.url === '/api/health' || req.url.startsWith('/images/');
  }
}));

// Ensure OpenStreetMap iframes allowed in CSP
app.use((_, res, next) => {
  const existingCsp = res.getHeader('Content-Security-Policy');
  const mapsDirective = "frame-src 'self' https://www.openstreetmap.org https://www.google.com https://maps.google.com;";
  if (typeof existingCsp === 'string') {
    if (!existingCsp.includes('frame-src')) {
      const updatedValue = (existingCsp + '; ' + mapsDirective).trim();
      res.setHeader('Content-Security-Policy', updatedValue);
    }
  } else {
    res.setHeader('Content-Security-Policy', mapsDirective);
  }
  next();
});

// Static assets moved to frontend - no longer served from backend
// All images are now served from client/public/images/ by Vercel
const jsonBodyParser = express.json();
const urlencodedBodyParser = express.urlencoded({ extended: false });

// Enable JSON & URL-encoded body parsing for all routes
app.use(jsonBodyParser);
app.use(urlencodedBodyParser);

// GYG router removed - not needed

// Set UTF-8 headers for all JSON responses
app.use((req, res, next) => {
  // Ensure proper UTF-8 encoding for all responses
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Accept-Charset', 'utf-8');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Accept-Charset');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  // Override res.json to ensure UTF-8 encoding
  const originalJson = res.json;
  res.json = function(obj) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson.call(this, obj);
  };
  
  next();
});

// Global error handler to prevent 502 crashes
app.use((err: any, req: any, res: any, next: any) => {
  if (err?.name === 'ZodError') {
    return res.status(400).json({ 
      status: 'error', 
      code: 'VALIDATION_FAILED', 
      details: err.issues 
    });
  }
  console.error('[UNCAUGHT ERROR]', err);
  return res.status(500).json({ 
    status: 'error', 
    code: 'INTERNAL', 
    message: 'Unexpected error' 
  });
});

// Enable cookie parsing
app.use(cookieParser());

// CORS already configured at the top of middleware stack

// Session middleware
app.use(session(sessionSecurity));

// Enhanced security middleware
app.use(securityRequestLogger);
app.use(requestSizeLimit);
app.use(uploadSecurityHeaders);

// CSRF protection with custom implementation
app.use(generateCSRFToken);
// Skip CSRF verification for safe methods and auth/session bootstrap routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const isSafeMethod = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';
  const path = req.path;
  const isAuthOrSession = path.startsWith('/api/auth/') || path.startsWith('/api/session/');
  
  if (isSafeMethod || isAuthOrSession) {
    return next();
  }
  return verifyCSRFToken(req, res, next);
});

// CSRF session init route (AFTER CSRF middleware so token is available)
app.get('/api/session/init', (req: Request, res: Response) => {
  const token = res.locals.csrfToken || '';
  res.setHeader('X-Session-Init', 'new-handler');
  res.status(200).json({ csrfToken: token });
});




// Health endpoint - Render expects /api/health
app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));

// CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.json({ 
    status: "ok", 
    origin: req.headers.origin,
    timestamp: new Date().toISOString() 
  });
});


// Static assets are now served by frontend (Vercel)

// Apply global rate limiting BEFORE routes but AFTER CORS and security middleware
app.use(globalLimiter);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  
  // Log Origin header for CORS debugging
  if (req.headers.origin) {
    log(`Origin: ${req.headers.origin} for ${req.method} ${path}`, "cors");
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "�";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ? Connect to MongoDB before starting the server
  await connectToDatabase();

  // ? Seed initial data (admin users, activities, etc.)
  const { storage } = await import('./storage.js');
  await storage.seedInitialData();
  console.log('[server] Initial data seeding completed');

  // ? Initialize cache service
  const { cacheService } = await import('./services/cache-service.js');
  await cacheService.connect();

  // ? Initialize error monitoring
  const { errorMonitoring } = await import('./services/error-monitoring.js');

  // ? Initialize logging service
  const { loggingService } = await import('./services/logging-service.js');

  // Add performance monitoring middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Log performance metrics
      errorMonitoring.logPerformance(req, res, startTime);
      
      // Log access
      loggingService.logRequest(req, res, duration);
      
      // Log slow requests
      if (duration > 1000) {
        loggingService.warn('Slow request detected', {
          endpoint: req.path,
          method: req.method,
          duration: duration,
          statusCode: res.statusCode
        });
      }
    });
    
    next();
  });


  // Mount session router BEFORE other routes
  app.use("/api/session", sessionRouter);
  
  // Mount auth router for login/logout
  const authRouter = (await import('./routes/auth.js')).default;
  app.use("/api/auth", authRouter);
  
  // Mount security router for security events (non-critical)
  const securityRouter = (await import('./routes/security.js')).default;
  app.use("/api", securityRouter);
  
  // Mount admin router (should be after auth but before public routes)
  const adminRouter = (await import('./routes/admin.js')).default;
  app.use("/api/admin", adminRouter);
  
  // Mount new routes with proper security order
  const activitiesRouter = (await import('./routes/activities.js')).default;
  const reviewsRouter = (await import('./routes/reviews.js')).default;
  const notificationsRouter = (await import('./routes/notifications.js')).default;
  // Removed externalActivitiesRouter - not needed
  const bookingsRouter = (await import('./routes/bookings.js')).default;
  const competitorsRouter = (await import('./routes/competitors.js')).default;
  const marketIntelligenceRouter = (await import('./routes/market-intelligence.js')).default;
  app.use("/api/activities", activitiesRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/notifications", notificationsRouter);
  // Removed external-activities route - not needed
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/competitors', competitorsRouter);
  app.use('/api/market', marketIntelligenceRouter);
  
  // Mount portal router for customer portal
  const portalRouter = (await import('./routes/portal.js')).default;
  app.use('/api/portal', portalRouter);
  
  // Mount upload router for file uploads
  const uploadRouter = (await import('./routes/upload.js')).default;
  app.use('/api', uploadRouter);
  
  // Routes are now mounted directly above, no need for registerRoutes
  const server = app;

  // Test notification endpoint (NO AUTH REQUIRED - added after all routes)
  app.post("/api/test/notifications", async (req, res) => {
    const { testType = 'email' } = req.body;
    
    try {
      if (testType === 'email') {
        // Test email service
        const testData = {
          customerName: 'Test Customer',
          customerPhone: '212600623630',
          activityName: 'Test Activity - Hot Air Balloon',
          numberOfPeople: 2,
          preferredDate: new Date(),
          totalAmount: 650,
          bookingId: 'TEST-' + Date.now(),
          paymentMethod: 'cash',
          paymentStatus: 'unpaid',
          status: 'pending'
        };
        
        const emailService = (await import('./utils/emailService.js')).default;
        const emailSent = await emailService.sendBookingConfirmation(
          'test@example.com',
          testData.customerName,
          testData.activityName,
          testData.preferredDate.toISOString(),
          testData.totalAmount
        );
        
        res.json({
          status: 'success',
          message: 'Email test completed',
          emailSent,
          testData
        });
      } else if (testType === 'whatsapp') {
        // Test WhatsApp service
        const testData = {
          customerName: 'Test Customer',
          customerPhone: '212600623630',
          activityName: 'Test Activity - Desert Safari',
          numberOfPeople: 2,
          preferredDate: new Date(),
          totalAmount: 800,
          bookingId: 'TEST-' + Date.now(),
          paymentMethod: 'cash',
          paymentStatus: 'unpaid',
          status: 'pending'
        };
        
        const { whatsappService } = await import('./whatsapp-service.js');
        const whatsappResult = await whatsappService.sendBookingNotification(testData);
        
        res.json({
          status: 'success',
          message: 'WhatsApp test completed',
          whatsappResult,
          testData
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: 'Invalid test type. Use "email" or "whatsapp"'
        });
      }
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Test failed',
        error: (error as Error).message
      });
    }
  });

  // Root probes for GetYourGuide portal
  app.get('/', (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.head('/', (_req, res) => {
    res.status(200).end();
  });

  // Health check endpoints
  app.get('/api', (req, res) => {
    res.json({ 
      status: 'healthy', 
      service: 'MarrakechDunes API',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  app.get('/api/health/status', (req, res) => {
    res.json({
      status: "healthy",
      service: "MarrakechDunes API",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0"
    });
  });

  // Monitoring endpoints
  app.get('/api/monitoring/errors', (req, res) => {
    const errorStats = errorMonitoring.getErrorStats();
    res.json({
      errorStats,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/monitoring/performance', (req, res) => {
    const performanceStats = errorMonitoring.getPerformanceStats();
    res.json({
      performance: performanceStats,
      timestamp: new Date().toISOString()
    });
  });

  // System health monitoring
  app.get('/api/monitoring/health', (req, res) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const healthData = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000000),
        system: Math.round(cpuUsage.system / 1000000)
      },
      timestamp: new Date().toISOString()
    };

    // Log system health
    loggingService.logSystemHealth({
      memoryUsage,
      uptime: process.uptime(),
      cpuUsage
    });

    res.json(healthData);
  });

  // Handle static files that should be served by frontend (Vercel)
  // These files should NOT require authentication and should redirect to frontend
  app.get('/manifest.webmanifest', (req, res) => {
    res.redirect(301, 'https://marrakech-dunes.vercel.app/manifest.webmanifest');
  });

  app.get('/favicon.ico', (req, res) => {
    res.redirect(301, 'https://marrakech-dunes.vercel.app/favicon.ico');
  });

  app.get('/sw.js', (req, res) => {
    res.redirect(301, 'https://marrakech-dunes.vercel.app/sw.js');
  });

  app.get('/workbox-*.js', (req, res) => {
    res.redirect(301, `https://marrakech-dunes.vercel.app${req.path}`);
  });

  // Handle favicon.ico requests to prevent 404 errors
  app.get('/api/favicon.ico', (req, res) => {
    res.status(204).end();
  });

  // Redirect /assets/ to /images/ for frontend compatibility
  app.get('/assets/*', (req, res) => {
    const imagePath = req.path.replace('/assets/', '/images/');
    res.redirect(301, imagePath);
  });


  // API 404 handler for undefined routes
  app.use('/api/*', notFoundHandler);

  // API 404 handler for non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    // For non-API routes, return 404 as backend no longer serves frontend
    return res.status(404).json({ error: 'Not found - frontend is served by Vercel' });
  });

  // Sentry error handler must be before any other error middleware
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }

  // Global error handler (must be last)
  app.use(globalErrorHandler);

  // Note: Frontend is served by Vercel, backend only serves API and static assets
  // Deployment trigger: Final production deployment with session routes fixed
  log("Backend configured for API and static assets only - frontend served by Vercel");
  console.log('[express] Backend configured ...');

  // Start server
  const PORT = process.env.PORT || 10000;

  // Start notification scheduler for automated reminders
  try {
    const { notificationScheduler } = await import('./jobs/notification-scheduler.js');
    notificationScheduler.start();
    log(`⏰ Notification scheduler started`);
  } catch (error) {
    console.warn('⚠️ Failed to start notification scheduler:', error);
  }

  server.listen(PORT, () => {
    console.log(`[server] listening on ${PORT}`);
    console.log(`[assets] Static assets served by frontend at /images/`);
    console.log(`[routers] /api/session mounted`);
    log(`🚀 Server started on port ${PORT} - Updated with PDF export fixes`);
    log(`??� NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    log(`??� Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    log(`📁 Assets: Served by frontend (Vercel) at /images/`);
    log(`🔒 Rate limiting: ${isProduction ? '100' : '200'} req/15min (global, auth, admin, general)`);
    log(`🍪 Session cookies: secure=${isProduction}, sameSite=${isProduction ? 'none' : 'lax'}, httpOnly=true`);
    log(`📡 Server URL: http://localhost:${PORT}`);
    log(`🔧 Trust proxy: ${app.get('trust proxy')}`);
    log(`🔑 Session secret: ${process.env.SESSION_SECRET ? '? SET' : '❌ NOT SET'}`);
    log(`??� CLIENT_URL: ${process.env.CLIENT_URL || 'not set'}`);
  });
})();
