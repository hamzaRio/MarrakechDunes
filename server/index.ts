import express, { type Request, Response, NextFunction, Express } from "express";
import { registerRoutes } from "./routes.js";
import securityRoutes from "./routes/security.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from "url"; // ✅ Needed for __dirname in ES modules

// ✅ Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env for both development and production
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("Initializing MarrakechDunes with MongoDB Atlas...");

const app: Express = express();

// Allow requests from the configured client domain(s) and include credentials
const allowedOrigins = (process.env.CLIENT_URL || "").split(",").map(o => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Render Health Check Route
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// ✅ Check for SESSION_SECRET at runtime but don't crash build
if (!process.env.SESSION_SECRET) {
  console.warn("\u26a0\ufe0f SESSION_SECRET is missing from environment variables.");
}

// Middleware setup
// Trust the first proxy (Render/Vercel) so secure cookies work over HTTPS
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", securityRoutes);

// Serve static assets from an absolute path so it works in any deployment
app.use(
  "/attached_assets",
  express.static(path.resolve(__dirname, "../attached_assets"))
);

// Request logging middleware
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
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
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

  // Development vs Production handling
  if (process.env.NODE_ENV === "development") {
    // Only load Vite in development
    const { setupVite } = await import("./vite.dev.js");
    await setupVite(app, server);
  } else {
    // Serve client build in production
    const clientDist = path.resolve(__dirname, "../../client/dist");
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      // Serve index.html for any non-API route (SPA fallback)
      app.get(/^(?!\/api).*/, (_req, res) => {
        res.sendFile(path.join(clientDist, "index.html"));
      });
    } else {
      console.error("❌ No built client found in production.");
    }
  }

  // ✅ Use Render's PORT environment variable
  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () =>
    console.log(`🚀 Server running on port ${port}`)
  );
})();
