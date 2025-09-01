import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
// Logging helper similar to Vite's logger
const log = (message: string, source = "express") => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "..", "..")
    : path.resolve(__dirname, "..");
dotenv.config({ path: path.join(rootDir, ".env") });

// Initialize application with MongoDB
if (process.env.NODE_ENV === "development") {
  console.log("Initializing MarrakechDunes with MongoDB Atlas...");
}

const app = express();
// Configure trust proxy for rate limiting  
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static mounts BEFORE routes - serve assets with 7-day cache
const assetsPath = path.join(rootDir, "attached_assets");
app.use(
  "/attached_assets",
  express.static(assetsPath, { maxAge: "7d" })
);
// Alias so frontend can always use /assets/<file>
app.use("/assets", express.static(assetsPath, { maxAge: "7d" }));

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } else {
      try {
        const { serveStatic } = await import("./vite");
        serveStatic(app);
      } catch {
        log("static assets not found, skipping static serve");
      }
    }

  // Use PORT from environment or default to 5000
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || "5000");
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  server.listen(
    {
      port,
      host,
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
