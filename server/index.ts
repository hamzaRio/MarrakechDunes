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
import { registerRoutes } from "./routes";
import { connectToDatabase } from "./db";

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

// Configure trust proxy for rate limiting
app.set("trust proxy", 1);

// Enable JSON & URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Enable CORS (API + frontend)
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(url => url.trim());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ✅ Static mounts BEFORE routes - serve assets with 7-day cache + CORS headers
const assetsPath = path.join(rootDir, "attached_assets");

app.use(
  "/attached_assets",
  express.static(assetsPath, {
    maxAge: "7d",
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    },
  })
);

app.use(
  "/assets",
  express.static(assetsPath, {
    maxAge: "7d",
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    },
  })
);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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

  // Global error middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Error middleware caught:", err);

    res.status(status).json({ message });
  });

  // ✅ Serve static files from client/dist in production
  try {
    const { serveStatic } = await import("./vite");
    serveStatic(app);
    log("Static file serving setup complete");
  } catch (error) {
    log(`Failed to setup static serving: ${error}`, "vite", "error");
  }

  // Start server
  const port = parseInt(process.env.PORT || "5000");
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
