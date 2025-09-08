import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ✅ Load environment variables FIRST, before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, ".."); // Always go up 1 level to project root
dotenv.config({ path: path.join(rootDir, ".env") });

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const optionalEnvVars = ['CLIENT_URL', 'WHATSAPP_RECEIVERS'];

// SESSION_SECRET is required in production, optional in development
if (process.env.NODE_ENV === 'production') {
  if (!process.env.SESSION_SECRET) {
    console.error('❌ SESSION_SECRET is required in production but not set.');
    console.error('Please set SESSION_SECRET environment variable for production deployment.');
    process.exit(1);
  }
  if (process.env.SESSION_SECRET.length < 32) {
    console.error('❌ SESSION_SECRET must be at least 32 characters long in production.');
    process.exit(1);
  }
} else {
  // In development, warn if SESSION_SECRET is not set
  if (!process.env.SESSION_SECRET) {
    console.warn('⚠️ SESSION_SECRET not set in development. Using default secret.');
  }
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Required environment variable ${envVar} is not set.`);
    console.error('Please check your .env file or environment configuration.');
    process.exit(1);
  }
}

// Warn about missing optional environment variables
for (const envVar of optionalEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️ Optional environment variable ${envVar} is not set.`);
  }
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

// Define CORS origins - simplified configuration
const allowedOrigins = [/\.vercel\.app$/, "http://localhost:5173"];

const assetsPath = path.join(__dirname, "attached_assets");

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

// Security middleware with CORS-friendly configuration
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable helmet's CORS policy to allow our custom headers
  crossOriginEmbedderPolicy: false
}));

// Enable JSON & URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable cookie parsing
app.use(cookieParser());

// Global CORS middleware to fix image cross-origin errors
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "https://marrakech-dunes.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

// Session middleware
app.use(session(sessionSecurity));


// Serve static assets with proper CORS headers
app.use("/attached_assets", express.static(assetsPath, {
  setHeaders: (res) => {
    res.setHeader("Access-Control-Allow-Origin", "https://marrakech-dunes.vercel.app");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));

// Serve static client files
const publicPath = path.join(__dirname, "public");
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

  // Stub route for security events to prevent 404 spam in logs
  app.post('/api/security-events', (req, res) => {
    res.status(204).send(); // no content, prevents 404 spam in logs
  });

  // API 404 handler for undefined routes
  app.use('/api/*', notFoundHandler);

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (_, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  });

  // Global error handler (must be last)
  app.use(globalErrorHandler);

  // Note: Frontend is served by Vercel, backend only serves API and static assets
  log("Backend configured for API and static assets only - frontend served by Vercel");

  // Start server
  const port = parseInt(process.env.PORT || "5000");
  const apiUrl = process.env.VITE_API_URL || `http://localhost:${port}`;
  const isProduction = process.env.NODE_ENV === 'production';
  
  server.listen(port, () => {
    log(`🚀 Server started on port ${port}`);
    log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    log(`🌐 Allowed CORS origins: ${allowedOrigins.map(o => typeof o === 'string' ? o : o.toString()).join(', ')}`);
    log(`📁 Assets path: ${assetsPath}`);
    log(`🔒 Rate limiting: ${isProduction ? '100' : '200'} req/15min (global, auth, admin, general)`);
    log(`🍪 Session cookies: secure=${isProduction}, sameSite=${isProduction ? 'none' : 'lax'}, httpOnly=true`);
    log(`📡 API Base URL: ${apiUrl}`);
    log(`🔧 Trust proxy: ${app.get('trust proxy')}`);
    log(`🔑 Session secret: ${process.env.SESSION_SECRET ? '✅ SET' : '❌ NOT SET'}`);
    log(`🌐 CLIENT_URL: ${process.env.CLIENT_URL || 'not set'}`);
  });
})();
