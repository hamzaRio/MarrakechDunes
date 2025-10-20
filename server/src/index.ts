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
  console.log('ðŸ“ Note: .env files not found (expected in production Docker deployment)');
}

// Debug: Check if environment variables are loaded
console.log('🔧 Environment loading check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ LOADED' : 'âŒ NOT FOUND');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ LOADED' : 'âŒ NOT FOUND');

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
  for (const envVar of criticalEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing critical env: ${envVar}`);
    }
  }
} else {
  // For development, set defaults for missing variables
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'mongodb://localhost:27017/marrakechdunes';
    console.warn('⚠️  Using default DATABASE_URL for development');
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'default-jwt-secret-for-development';
    console.warn('⚠️  Using default JWT_SECRET for development');
  }
  if (!process.env.ADMIN_PASSWORD) {
    process.env.ADMIN_PASSWORD = 'admin123';
    console.warn('⚠️  Using default ADMIN_PASSWORD for development');
  }
  if (!process.env.SUPERADMIN_PASSWORD) {
    process.env.SUPERADMIN_PASSWORD = 'superadmin123';
    console.warn('⚠️  Using default SUPERADMIN_PASSWORD for development');
  }
  if (!process.env.CLIENT_URL) {
    process.env.CLIENT_URL = 'http://localhost:5173,https://marrakech-dunes.vercel.app,https://marrakech-dunes-*.vercel.app';
    console.warn('⚠️  Using default CLIENT_URL for development');
  }
}

// Additional validation for SESSION_SECRET length in production
if (process.env.NODE_ENV === 'production' && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters long in production');
}

// Production environment validation
const envValidation = validateProductionEnvironment();
if (!envValidation.isValid) {
  console.error('âŒ Environment validation failed');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.log('âš ï¸ Continuing in development mode with warnings');
  }
}

// Security recommendations
if (process.env.NODE_ENV === 'production') {
  console.log('ðŸ”’ Security recommendations:');
  getSecurityRecommendations().forEach(rec => console.log(`  • ${rec}`));
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
import { registerRoutes } from "./routes.js";
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
  
  console.log('✅ Sentry error tracking initialized');
}

// Set trust proxy at the top before any middleware
app.set("trust proxy", 1);

// CORS configuration - must be defined BEFORE all other middleware
const allowedOrigins = process.env.CLIENT_URL?.split(",") || [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://marrakech-dunes.vercel.app",
  "https://marrakech-dunes-*.vercel.app" // Allow all Vercel preview URLs
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // SSR, Postman, mobile
    
    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Automatically allow ALL Vercel preview URLs
    if (origin && origin.match(/^https:\/\/marrakech-dunes-.*\.vercel\.app$/)) {
      console.log("✅ Allowing Vercel preview URL:", origin);
      return callback(null, true);
    }
    
    // Allow all marrakechdunes Vercel URLs (including preview URLs without hyphen)
    if (origin && origin.match(/^https:\/\/marrakechdunes-.*\.vercel\.app$/)) {
      console.log("✅ Allowing marrakechdunes Vercel URL:", origin);
      return callback(null, true);
    }
    
    // Handle wildcard patterns in CLIENT_URL (for other domains)
    for (const allowedOrigin of allowedOrigins) {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (origin && regex.test(origin)) {
          console.log("✅ Allowing wildcard origin:", origin, "matches pattern:", allowedOrigin);
          return callback(null, true);
        }
      }
    }
    
    console.warn("âŒ Blocked CORS origin:", origin);
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
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Accept-Charset, X-CSRF-Token, X-Requested-With, Authorization');
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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com", "https://*.googleapis.com"],
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
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ✅ Connect to MongoDB before starting the server
  await connectToDatabase();

  // ✅ Initialize cache service
  const { cacheService } = await import('./services/cache-service.js');
  await cacheService.connect();

  // ✅ Initialize error monitoring
  const { errorMonitoring } = await import('./services/error-monitoring.js');

  // ✅ Initialize logging service
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
  
  // Mount new routes with proper security order
  const notificationsRouter = (await import('./routes/notifications.js')).default;
  const externalActivitiesRouter = (await import('./routes/externalActivities.js')).default;
  const bookingsRouter = (await import('./routes/bookings.js')).default;
  const competitorsRouter = (await import('./routes/competitors.js')).default;
  
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/external-activities", externalActivitiesRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/competitors', competitorsRouter);
  
  const server = await registerRoutes(app);

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

  // Root health check endpoint
  app.get('/', (_req, res) => {
    res
      .type('application/json; charset=utf-8')
      .send(JSON.stringify({ status: 'ok', service: 'MarrakechDunes API' }));
  });
  app.head('/', (_req, res) => res.status(200).end());

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

  // Start server
  const PORT = process.env.PORT || 10000;

  server.listen(PORT, () => {
    console.log(`[server] listening on ${PORT}`);
    console.log(`[assets] Static assets served by frontend at /images/`);
    console.log(`[routers] /api/session mounted`);
    log(`ðŸš€ Server started on port ${PORT} - Updated with PDF export fixes`);
    log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    log(`🌍 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    log(`ðŸ“ Assets: Served by frontend (Vercel) at /images/`);
    log(`ðŸ”’ Rate limiting: ${isProduction ? '100' : '200'} req/15min (global, auth, admin, general)`);
    log(`ðŸª Session cookies: secure=${isProduction}, sameSite=${isProduction ? 'none' : 'lax'}, httpOnly=true`);
    log(`ðŸ“¡ Server URL: http://localhost:${PORT}`);
    log(`ðŸ”§ Trust proxy: ${app.get('trust proxy')}`);
    log(`ðŸ”‘ Session secret: ${process.env.SESSION_SECRET ? '✅ SET' : 'âŒ NOT SET'}`);
    log(`🌍 CLIENT_URL: ${process.env.CLIENT_URL || 'not set'}`);
  });
})();
