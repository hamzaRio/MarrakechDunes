import { fileURLToPath } from "url";
import path from "path";
import dotenvFlow from 'dotenv-flow';
import { validateProductionEnvironment, getSecurityRecommendations } from './production-validator.js';
import { config as serverEnv } from './env.js';

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
import csrf from "csurf";
import { globalLimiter, strictLimiter } from "./rate-limiters.js";
import { registerRoutes } from "./routes.js";
import { connectToDatabase } from "./db.js";
import { notFoundHandler } from "./error-handler.js";
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
const csrfCookieName = 'marrakech.csrf';
const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
};

const csrfProtection = csrf({
  cookie: {
    key: csrfCookieName,
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  },
});


// Set trust proxy at the top before any middleware
app.set("trust proxy", 1);

// CORS configuration - must be defined BEFORE all other middleware
const allowedOrigins = process.env.CLIENT_URL?.split(",") || [
  "http://localhost:5173",
  "https://marrakech-dunes.vercel.app"
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
};

app.use(cors(corsOptions));

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

// Enable cookie parsing
app.use(cookieParser());

// CORS already configured at the top of middleware stack

// Session middleware
app.use(session(sessionSecurity));

// CSRF session init route (must be defined BEFORE global CSRF middleware)
app.get('/api/session/init', (req: Request, res: Response) => {
  const token = (req as any).csrfToken?.() ?? '';
  res.setHeader('X-Session-Init', 'new-handler');
  res
    .cookie(csrfCookieName, token, csrfCookieOptions)
    .status(200)
    .json({ csrfToken: token });
});

// CSRF protection with double-submit cookie
// Exclude /api/security-events, /api/auth/*, and /api/session/init from CSRF
const csrfRequired = csrfProtection;
app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    req.path === "/api/security-events" ||
    req.path.startsWith("/api/auth") ||
    req.path === "/api/session/init" ||  // Add session init route exclusion
    req.method === "DELETE" ||  // Exclude all DELETE operations from CSRF
    req.path.startsWith("/api/admin/export")  // Exclude export operations from CSRF
  ) {
    return next();
  }
  return csrfRequired(req, res, next);
});


app.use((req: Request, res: Response, next: NextFunction) => {
  const csrfTokenFactory = (req as any).csrfToken;

  if (typeof csrfTokenFactory === 'function') {
    try {
      const token = csrfTokenFactory.call(req);
      res.cookie(csrfCookieName, token, csrfCookieOptions);
      res.locals.csrfToken = token;
      res.setHeader('X-CSRF-Token', token);
    } catch (error) {
      return next(error as Error);
    }
  }

  next();
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
        logLine = logLine.slice(0, 79) + "â€¦";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ✅ Connect to MongoDB before starting the server
  await connectToDatabase();

  // Mount session router BEFORE other routes
  app.use("/api/session", sessionRouter);
  const server = await registerRoutes(app);

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

  // Handle favicon.ico requests to prevent 404 errors
  app.get('/api/favicon.ico', (req, res) => {
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

  // Global error handler (must be last)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  });

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
