import { fileURLToPath } from "url";
import path, { join } from "path";
import fs from "fs";
import dotenvFlow from 'dotenv-flow';
import { validateProductionEnvironment, getSecurityRecommendations } from './production-validator.js';

// Get the project root directory (one level up from server/src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Load environment variables from project root using dotenv-flow
// In production (Docker), environment variables are set by deployment platform
try {
  dotenvFlow.config({
    path: projectRoot,
    silent: true // Don't error if .env files are missing in production
  });
} catch (error) {
  console.log('📝 Note: .env files not found (expected in production Docker deployment)');
}

// Debug: Check if environment variables are loaded
console.log('🔧 Environment loading check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ LOADED' : '❌ NOT FOUND');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ LOADED' : '❌ NOT FOUND');

// Environment variables should be loaded by dotenv-flow above


// Strict environment validation - all critical variables must be set
const criticalEnvVars = [
  'DATABASE_URL',
  'ADMIN_PASSWORD', 
  'SUPERADMIN_PASSWORD',
  'SESSION_SECRET',
  'JWT_SECRET',
  'CLIENT_URL',
  'WHATSAPP_RECEIVERS'
];

for (const envVar of criticalEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing critical env: ${envVar}`);
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
  getSecurityRecommendations().forEach(rec => console.log(`  • ${rec}`));
}

// Now import modules that depend on environment variables
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import session from "express-session";
import { globalLimiter, strictLimiter } from "./rate-limiters.js";
import { registerRoutes } from "./routes.js";
import { connectToDatabase } from "./db.js";
import { globalErrorHandler, notFoundHandler } from "./error-handler.js";
import { sessionSecurity } from "./security-middleware.js";
import sessionRouter from "./routes/session.js";

// CORS origins are defined below in FRONT_ORIGINS

const assetsRoot = path.resolve(projectRoot, "server", "attached_assets");
const distAssetsPath = join(__dirname, "attached_assets");
let assetsPath = assetsRoot;

if (!fs.existsSync(assetsRoot)) {
  assetsPath = distAssetsPath;
}

if (!fs.existsSync(assetsPath)) {
  console.warn(`[static] attached_assets directory not found. Checked: ${assetsRoot}, ${distAssetsPath}`);
}

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

// Set trust proxy at the top before any middleware
app.set("trust proxy", 1);

// Security middleware with CORS-friendly configuration and Google Maps support
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable helmet's CORS policy to allow our custom headers
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com",
        "https://www.google.com"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://maps.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com",
        "https://streetviewpixels-pa.googleapis.com"
      ],
      frameSrc: [
        "'self'",
        "https://www.google.com",
        "https://maps.googleapis.com"
      ],
      connectSrc: [
        "'self'",
        "https://maps.googleapis.com"
      ]
    }
  }
}));
// Ensure Google Maps iframes allowed in CSP
app.use((_, res, next) => {
  const existingCsp = res.getHeader('Content-Security-Policy');
  const mapsDirective = "frame-src 'self' https://www.google.com https://maps.googleapis.com;";
  if (typeof existingCsp === "string") {
    if (!existingCsp.includes("frame-src")) {
      const updatedValue = (existingCsp + "; " + mapsDirective).trim();
      res.setHeader('Content-Security-Policy', updatedValue);
    }
  } else {
    res.setHeader('Content-Security-Policy', mapsDirective);
  }
  next();
});

// Enable JSON & URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable cookie parsing
app.use(cookieParser());

// CORS configuration
const FRONT_ORIGINS = [
  "https://marrakech-dunes.vercel.app",
  "http://localhost:5173", // Added for local development
  "http://localhost:4173", // Vite preview
  /\.vercel\.app$/i,
  /marrakech.*\.vercel\.app$/i // Additional pattern for Vercel deployment variations
];

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (FRONT_ORIGINS.some(o => (o instanceof RegExp ? o.test(origin) : o === origin))) {
      return cb(null, true);
    }
    cb(null, false);
  },
  credentials: true
}));

// Session middleware
app.use(session(sessionSecurity));


// 🔒 serve public assets from Render (used by Vercel proxy too)
app.use("/attached_assets", express.static(assetsPath, { 
  maxAge: "7d", 
  etag: true,
  setHeaders: (res, path) => {
    // Set proper Content-Type for images
    if (path.match(/\.(jpg|jpeg)$/i)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.match(/\.png$/i)) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.match(/\.gif$/i)) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.match(/\.webp$/i)) {
      res.setHeader('Content-Type', 'image/webp');
    }
    // Add CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}));

// Health
app.get("/health", (_req, res) => res.status(200).send("OK"));
// Render expects /api/health
app.get("/api/health", (_req, res) => res.status(200).send("OK"));

// Serve static client files
const publicPath = join(__dirname, "public");
app.use(express.static(publicPath, {
  setHeaders: (res, path) => {
    // Add caching headers for client assets
    if (path && path.match(/\.(css|js)$/i)) {
      res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day cache for CSS/JS
    } else if (path && path.match(/\.(html)$/i)) {
      res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache for HTML
    }
  }
}));

// Apply global rate limiting AFTER static assets
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

  // Mount session router BEFORE other routes
  app.use("/api/session", sessionRouter);
  console.log("✅ Session router mounted at /api/session");

  const server = await registerRoutes(app);

  // Health check endpoints
  app.get('/', (req, res) => {
    res.json({ 
      status: 'healthy', 
      service: 'MarrakechDunes API',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      status: "healthy",
      service: "MarrakechDunes API",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0"
    });
  });

  // Handle favicon.ico requests to prevent 404 errors
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });


  // API 404 handler for undefined routes
  app.use('/api/*', notFoundHandler);

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (_, res) => {
    res.sendFile(join(__dirname, 'public/index.html'));
  });

  // Global error handler (must be last)
  app.use(globalErrorHandler);

  // Note: Frontend is served by Vercel, backend only serves API and static assets
  // Deployment trigger: Final production deployment with session routes fixed
  log("Backend configured for API and static assets only - frontend served by Vercel");

  // Start server
  const PORT = process.env.PORT || 10000;
  const apiUrl = process.env.VITE_API_URL || `http://localhost:${PORT}`;
  const isProduction = process.env.NODE_ENV === 'production';
  
  server.listen(PORT, () => {
    console.log(`[server] listening on ${PORT}`);
    console.log(`[assets] ${assetsPath}`);
    console.log(`[routers] /api/session mounted`);
    log(`🚀 Server started on port ${PORT}`);
    log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    log(`🌐 Allowed CORS origins: ${FRONT_ORIGINS.map(o => typeof o === 'string' ? o : o.toString()).join(', ')}`);
    log(`Assets path: ${assetsPath}`);
    log(`🔒 Rate limiting: ${isProduction ? '100' : '200'} req/15min (global, auth, admin, general)`);
    log(`🍪 Session cookies: secure=${isProduction}, sameSite=${isProduction ? 'none' : 'lax'}, httpOnly=true`);
    log(`📡 API Base URL: ${apiUrl}`);
    log(`🔧 Trust proxy: ${app.get('trust proxy')}`);
    log(`🔑 Session secret: ${process.env.SESSION_SECRET ? '✅ SET' : '❌ NOT SET'}`);
    log(`🌐 CLIENT_URL: ${process.env.CLIENT_URL || 'not set'}`);
  });
})();
