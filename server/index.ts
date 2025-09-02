import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
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

// Resolve root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "..", "..")
    : path.resolve(__dirname, "..");

// Load environment variables
dotenv.config({ path: path.join(rootDir, ".env") });

const app = express();

// Configure trust proxy for rate limiting
app.set("trust proxy", 1);

// Enable JSON & URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Enable CORS (API + frontend)
app.use(
  cors({
    origin: ["http://localhost:5173"], // Vite frontend
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
      res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    },
  })
);

app.use(
  "/assets",
  express.static(assetsPath, {
    maxAge: "7d",
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
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
