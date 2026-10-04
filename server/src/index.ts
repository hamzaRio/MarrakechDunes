import * as Sentry from "@sentry/node";
import "@sentry/tracing";
import pino from 'pino';
import mongoose from 'mongoose';
import { runtimeConfig } from './config/env.js';
import { runStartupSeeding } from './bootstrap/bootstrap-policy.js';
import { requireSuperAdmin } from './middleware/admin-auth.js';

// Fix UTF-8 console encoding for emojis and French characters
process.stdout.setEncoding("utf8");
process.stderr.setEncoding("utf8");

// Set UTF-8 environment variables for proper character handling
process.env.LANG = 'en_US.UTF-8';
process.env.LC_ALL = 'en_US.UTF-8';
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

const isProduction = runtimeConfig.nodeEnv === 'production';

// Now import modules that depend on environment variables
import express, { type Request, type Response, type NextFunction, type CookieOptions, type RequestHandler } from "express";
import type { Server as HttpServer } from "http";
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
import { connectToDatabase, disconnectFromDatabase } from "./db.js";
import { notFoundHandler, globalErrorHandler } from "./error-handler.js";
import { sessionSecurity } from "./security-middleware.js";
import sessionRouter from "./routes/session.js";
import { createGracefulShutdown } from './utils/graceful-shutdown.js';
import { isAllowedCorsOrigin } from './utils/cors-origins.js';
import { runtimeState } from './runtime-state.js';

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
let httpServer: HttpServer | null = null;
let stopScheduler: (() => void | Promise<void>) | null = null;
let disconnectCache: (() => Promise<void>) | null = null;
let closeLogging: (() => Promise<void>) | null = null;
let stopNotificationCleanup: (() => void) | null = null;

const gracefulShutdown = createGracefulShutdown({
  closeServer: async () => {
    if (httpServer?.listening) {
      await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
    }
  },
  stopTimers: async () => {
    await stopScheduler?.();
    stopNotificationCleanup?.();
  },
  closeLogging: async () => { if (closeLogging) await closeLogging(); },
  closeCache: async () => {
    if (disconnectCache) await disconnectCache();
  },
  closeDatabase: disconnectFromDatabase,
  onTimeout: () => {
    console.error('[shutdown] Cleanup exceeded timeout; forcing shutdown');
    process.exit(1);
  },
});
const shutdownWithReadiness = async () => { runtimeState.markShuttingDown(); await gracefulShutdown(); };

process.once('SIGTERM', () => { console.warn('[shutdown] Received SIGTERM'); void shutdownWithReadiness(); });
process.once('SIGINT', () => { console.warn('[shutdown] Received SIGINT'); void shutdownWithReadiness(); });
process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error('Unhandled promise rejection');
  console.error('[process] Unhandled rejection:', error.name);
  Sentry.captureException(error);
  void shutdownWithReadiness().then(() => { process.exitCode = 1; });
});
process.on('uncaughtException', (error) => {
  console.error('[process] Uncaught exception:', error.name);
  Sentry.captureException(error);
  void shutdownWithReadiness().then(() => { process.exitCode = 1; });
});

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
app.set("trust proxy", runtimeConfig.trustProxy);

// Root probes for GetYourGuide portal - must be first
app.get("/", (_req, res) => res.json({ ok: true }));
app.head("/", (_req, res) => res.status(200).end());

// CORS configuration - must be defined BEFORE all other middleware
const allowedOrigins = runtimeConfig.cors.allowedOrigins;

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
    // Only log CORS checks in development
    if (!isProduction) {
      console.log(`?? CORS Check - Origin: ${origin}`);
    }
    
    if (!origin) {
      if (!isProduction) {
        console.log("? Allowing request without origin (SSR, Postman, mobile)");
      }
      return callback(null, true); // SSR, Postman, mobile
    }
    
    // Check exact matches first
    if (isAllowedCorsOrigin(origin, allowedOrigins, isProduction, runtimeConfig.cors.patterns)) {
      return callback(null, true);
    }
    
    console.warn("[CORS] Blocked origin");
    return callback(new CorsOriginDeniedError());
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Accept",
    "Accept-Charset",
    "X-CSRF-Token",
    "Idempotency-Key",
    "X-Requested-With",
    "Authorization"
  ],
};

class CorsOriginDeniedError extends Error {
  readonly code = 'CORS_ORIGIN_DENIED';
  readonly statusCode = 403;

  constructor() {
    super('Origin not allowed');
    this.name = 'CorsOriginDeniedError';
  }
}

app.use(cors(corsOptions));

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
  if (err?.code === 'CORS_ORIGIN_DENIED') {
    return res.status(403).json({
      status: 'error',
      code: 'CORS_ORIGIN_DENIED',
      message: 'Origin not allowed',
    });
  }
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

// Static file routes - MUST be BEFORE session/auth middleware to prevent 401 errors
// These files should NOT require authentication
app.get('/manifest.webmanifest', (req, res) => {
  // Return a valid manifest JSON to prevent 401 errors
  // Vercel will serve the actual file if it exists, otherwise this fallback is used
  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json({
    name: "MarrakechDunes",
    short_name: "MarrakechDunes",
    description: "Marrakech Dunes Activity Booking",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: []
  });
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/sw.js', (req, res) => {
  res.status(204).end();
});

app.get('/workbox-*.js', (req, res) => {
  res.status(204).end();
});

// Session middleware
app.use(session(sessionSecurity));

// Enhanced security middleware
app.use(securityRequestLogger);
app.use(requestSizeLimit);
app.use(uploadSecurityHeaders);

// CSRF protection with custom implementation
app.use(generateCSRFToken);
// Skip CSRF verification for safe methods and auth/session/bootstrap routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const isSafeMethod = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';
  const path = req.path;
  const isAuthOrSession = path === '/api/session/init' ||
                         path === '/api/security-events' ||
                         path === '/manifest.webmanifest' ||
                         path === '/favicon.ico';
  
  // Public routes that should always be accessible (GET requests)
  const isPublicBookingCreation = req.method === 'POST' && path === '/api/bookings';
  
  // Skip CSRF for safe methods, exact bootstrap routes, and public booking creation
  if (isSafeMethod || isAuthOrSession || isPublicBookingCreation) {
    return next();
  }
  
  return verifyCSRFToken(req, res, next);
});

// Health endpoint - Render expects /api/health
app.get('/api/health/live', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/health/ready', (_req, res) => {
  const ready = runtimeState.isReady() && mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready' });
});
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
  
  // Log Origin header for CORS debugging (only in development)
  if (req.headers.origin && !isProduction) {
    log(`Origin: ${req.headers.origin} for ${req.method} ${path}`, "cors");
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

(async () => {
  // ? Connect to MongoDB before starting the server
  await connectToDatabase();

  // Preserve legacy startup seeding by default during the migration release.
  // New installations explicitly disable it and bootstrap staff once.
  const { storage } = await import('./storage.js');
  const seedingMode = await runStartupSeeding(runtimeConfig.seeding, {
    runLegacy: () => storage.seedInitialData(),
    seedDemo: () => storage.seedDemoData(),
  });
  console.log(`[server] Startup seeding mode: ${seedingMode}`);

  // ? Initialize cache service
  const { cacheService } = await import('./services/cache-service.js');
  await cacheService.connect();
  disconnectCache = () => cacheService.disconnect();

  // ? Initialize error monitoring
  const { errorMonitoring } = await import('./services/error-monitoring.js');

  // ? Initialize logging service
  const { loggingService } = await import('./services/logging-service.js');
  closeLogging = () => loggingService.close();

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
  
  // Mount superadmin router (for admin management - superadmin only)
  const superadminRouter = (await import('./routes/superadmin.js')).default;
  app.use("/api/superadmin", superadminRouter);
  
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
  
  // Mount GetYourGuide router for GYG search and activities
  const gygRouter = (await import('./routes/getyourguide.js')).default;
  app.use('/api/gyg', gygRouter);

  const viatorRouter = (await import('./routes/viator.js')).default;
  app.use('/api/viator', viatorRouter);
  
  // Mount portal router for customer portal
  const portalRouter = (await import('./routes/portal.js')).default;
  app.use('/api/portal', portalRouter);
  
  // Mount auto-response router for customer message handling
  const autoResponseRouter = (await import('./routes/auto-response.js')).default;
  app.use('/api/auto-response', autoResponseRouter);
  
  // Mount upload router for file uploads
  const uploadRouter = (await import('./routes/upload.js')).default;
  app.use('/api', uploadRouter);
  
  // Routes are now mounted directly above, no need for registerRoutes
  // Test notification endpoint (superadmin only)
  app.post("/api/test/notifications", requireSuperAdmin, async (req, res) => {
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
  app.get('/api/monitoring/errors', requireSuperAdmin, (req, res) => {
    const errorStats = errorMonitoring.getErrorStats();
    res.json({
      errorStats,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/monitoring/performance', requireSuperAdmin, (req, res) => {
    const performanceStats = errorMonitoring.getPerformanceStats();
    res.json({
      performance: performanceStats,
      timestamp: new Date().toISOString()
    });
  });

  // System health monitoring
  app.get('/api/monitoring/health', requireSuperAdmin, (req, res) => {
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

  // Note: Static file routes are handled earlier in the middleware stack
  // (before session/auth middleware) to prevent 401 errors

  // Handle favicon.ico requests to prevent 404 errors
  app.get('/api/favicon.ico', (req, res) => {
    res.status(204).end();
  });

  // Assets are served by Vercel (frontend), not the backend
  // Return 204 for /assets/* requests to prevent 404 errors
  // Frontend should use relative URLs or Vercel URLs for assets
  app.get('/assets/*', (req, res) => {
    // Return 204 No Content instead of redirect to prevent 404 chain
    res.status(204).end();
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

  // Correctness-critical indexes must exist before accepting traffic.
  try {
    const [{ initializeBookingIndexes }, { initializeNotificationQueueIndexes }, { initializeSchedulerLeaseIndexes }] = await Promise.all([
      import('./storage.js'),
      import('./models/NotificationQueue.js'),
      import('./services/scheduler-lease.js'),
    ]);
    await Promise.all([initializeBookingIndexes(), initializeNotificationQueueIndexes(), initializeSchedulerLeaseIndexes()]);
  } catch (error) {
    console.error('[startup] Required coordination indexes failed to initialize:', error instanceof Error ? error.message : 'UnknownError');
    await shutdownWithReadiness();
    process.exitCode = 1;
    return;
  }

  // Start notification scheduler for automated reminders
  try {
    const { notificationScheduler } = await import('./jobs/notification-scheduler.js');
    if (runtimeConfig.role !== 'api') notificationScheduler.start();
    stopScheduler = () => notificationScheduler.stop();
    const queue = await import('./services/free-notification-queue.js');
    stopNotificationCleanup = queue.stopNotificationQueueCleanup;
    log(`⏰ Notification scheduler ${runtimeConfig.role === 'api' ? 'disabled (ROLE=api)' : 'started'}`);
  } catch (error) {
    console.warn('⚠️ Failed to start notification scheduler:', error);
  }

  httpServer = app.listen(PORT, () => {
    runtimeState.markReady();
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
