import path from "path";
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
}
else {
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
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { globalLimiter } from "./rate-limiters.js";
import { registerRoutes } from "./routes.js";
import { connectToDatabase } from "./db.js";
// Define constants before use - support multiple origins from environment
const getClientUrls = () => {
    const clientUrl = process.env.CLIENT_URL;
    const origins = [
        "https://marrakech-dunes.vercel.app",
        "http://localhost:5173"
    ];
    if (clientUrl) {
        // Split by comma and add each URL
        const urls = clientUrl.split(',').map(url => url.trim());
        origins.push(...urls);
    }
    // Add regex for all vercel.app subdomains (including preview deployments)
    origins.push(/^https:\/\/.*\.vercel\.app$/);
    return origins;
};
const allowedOrigins = getClientUrls();
const assetsPath = path.join(__dirname, "attached_assets");
// Logging helper
const log = (message, source = "express", level = "info") => {
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
// Security middleware
app.use(helmet());
// Enable JSON & URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Enable cookie parsing
app.use(cookieParser());
// Apply CORS middleware before routes
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Check if origin is in allowed list
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return origin === allowedOrigin;
            }
            else if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return false;
        });
        if (isAllowed) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
}));
app.use("/attached_assets", express.static(assetsPath, {
    setHeaders: (res, path) => {
        // Allow CORS for static assets from all origins
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        // Add caching headers for better performance
        if (path && path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // 1 year cache for images
        }
        else if (path && path.match(/\.(css|js)$/i)) {
            res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day cache for CSS/JS
        }
        else {
            res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache for other assets
        }
        // Add ETag for better caching
        res.setHeader("ETag", `"${Date.now()}"`);
    }
}));
// Apply global rate limiting AFTER static assets
app.use(globalLimiter);
// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
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
    // Health check endpoint
    app.get('/', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'MarrakechDunes API',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });
    // Handle favicon.ico requests to prevent 404 errors
    app.get('/favicon.ico', (req, res) => {
        res.status(204).end();
    });
    // API 404 handler
    app.use('/api/*', (req, res) => {
        res.status(404).json({
            error: 'API endpoint not found',
            path: req.path,
            method: req.method
        });
    });
    // Global error middleware
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error("Error middleware caught:", err);
        res.status(status).json({ error: message });
    });
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
