import express, { type Request, Response, NextFunction, Express } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";

dotenv.config();

console.log("Initializing MarrakechDunes with MongoDB Atlas...");

// Warn if SESSION_SECRET is missing
if (!process.env.SESSION_SECRET) {
  console.error("❌ SESSION_SECRET is missing from environment variables.");
  process.exit(1);
}

const app: Express = express();

// Configure trust proxy for rate limiting
app.set("trust proxy", true);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use("/attached_assets", express.static("attached_assets"));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
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

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite dev server or serve production build
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable if provided (default 5000)
  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => log(`🚀 Server running on port ${port}`));
})();
