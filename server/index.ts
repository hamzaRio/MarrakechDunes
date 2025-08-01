import express, { type Request, Response, NextFunction, Express } from "express";
import { registerRoutes } from "./routes";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

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
  const requestPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
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

  if (process.env.NODE_ENV === "development") {
    // Dynamic import so vite is not included in production build
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // Serve built client in production
    const clientDist = path.resolve(__dirname, "../client/dist");
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(clientDist, "index.html"));
      });
    } else {
      console.error("❌ No built client found in production.");
    }
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () =>
    console.log(`🚀 Server running on port ${port}`)
  );
})();
