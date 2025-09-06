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
// Configure trust proxy for Render deployment (cookies and rate limiting)
app.set("trust proxy", 1);
// Security middleware
app.use(helmet());
// Enable JSON & URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Enable cookie parsing
app.use(cookieParser());
// ✅ Enable CORS (API + frontend)
const allowedOrigins = [
    'https://marrakech-dunes.vercel.app',
    'http://localhost:5173'
];
// Add any additional origins from environment
const envOrigins = process.env.CLIENT_URL?.split(",") || [];
envOrigins.forEach(origin => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
        allowedOrigins.push(trimmed);
    }
});
console.log('🌐 Allowed CORS origins:', allowedOrigins);
app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return cb(null, true);
        // Check exact matches first
        if (allowedOrigins.includes(origin)) {
            return cb(null, true);
        }
        // Check if origin is a subdomain of vercel.app
        if (origin.endsWith('.vercel.app')) {
            return cb(null, true);
        }
        // Reject other origins
        console.log('❌ CORS rejected origin:', origin);
        cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200
}));
// ✅ Static mounts BEFORE rate limiting - serve assets with 7-day cache + CORS headers
const assetsPath = path.join(rootDir, "attached_assets");
console.log('📁 Assets path:', assetsPath);
app.use("/attached_assets", express.static(assetsPath, {
    maxAge: "7d",
    setHeaders: (res) => {
        res.setHeader("Access-Control-Allow-Credentials", "true");
    },
}));
app.use("/assets", express.static(assetsPath, {
    maxAge: "7d",
    setHeaders: (res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Credentials", "true");
    },
}));
// Fallback handler for missing assets
app.use("/assets", (req, res) => {
    console.log('⚠️ Asset not found:', req.path);
    res.status(404).json({ error: "Asset not found", path: req.path });
});
// Apply global rate limiting AFTER static assets
app.use(globalLimiter);
// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
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
    // ✅ Serve static files from client/dist in production
    try {
        const clientDistPath = path.join(rootDir, "client", "dist");
        if (fs.existsSync(clientDistPath)) {
            app.use(express.static(clientDistPath));
            // Fall through to index.html for SPA routing
            app.use("*", (_req, res) => {
                res.sendFile(path.join(clientDistPath, "index.html"));
            });
            log("Static file serving setup complete");
        }
        else {
            log("Client dist directory not found, skipping static file serving", "express", "warn");
        }
    }
    catch (error) {
        log(`Failed to setup static serving: ${error}`, "express", "error");
    }
    // Start server
    const port = parseInt(process.env.PORT || "5000");
    server.listen(port, () => {
        log(`🚀 Server started on port ${port}`);
        log(`🌐 CORS origins: ${allowedOrigins.join(', ')}`);
        log(`📁 Assets served from: ${assetsPath}`);
        log(`🔒 Rate limiting: 500 req/15min global, 20 req/min auth`);
    });
})();
