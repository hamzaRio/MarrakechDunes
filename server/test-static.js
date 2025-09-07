import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

// Set trust proxy
app.set("trust proxy", 1);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Serve static assets from /attached_assets
const assetsPath = path.join(__dirname, "dist", "server", "attached_assets");
app.use("/attached_assets", express.static(assetsPath, {
  setHeaders: (res, path) => {
    // Allow CORS for static assets from all origins
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    // Add caching headers for better performance
    if (path && path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // 1 year cache for images
    } else if (path && path.match(/\.(css|js)$/i)) {
      res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day cache for CSS/JS
    } else {
      res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache for other assets
    }
    
    // Add ETag for better caching
    res.setHeader("ETag", `"${Date.now()}"`);
  }
}));

console.log("[Express] Serving static assets from:", assetsPath);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'MarrakechDunes API - Static Assets Test',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'MarrakechDunes API - Static Assets Test',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// List available assets
app.get('/api/assets', (req, res) => {
  const fs = require('fs');
  try {
    const files = fs.readdirSync(assetsPath);
    res.json({
      assetsPath: assetsPath,
      files: files,
      count: files.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not read assets directory', path: assetsPath });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server started on port ${port}`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Assets path: ${assetsPath}`);
  console.log(`🔧 Trust proxy: ${app.get('trust proxy')}`);
  console.log(`\n📋 Test URLs:`);
  console.log(`   Health: http://localhost:${port}/health`);
  console.log(`   Assets list: http://localhost:${port}/api/assets`);
  console.log(`   Sample image: http://localhost:${port}/attached_assets/agafaypack1_1751128022717.jpeg`);
});
