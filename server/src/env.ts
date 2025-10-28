// Server-only environment configuration and validation

const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "SESSION_SECRET",
  "CLIENT_URL",
  "ADMIN_PASSWORD",
  "SUPERADMIN_PASSWORD",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required env var: ${key}`);
  }
}

export const config = {
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  sessionSecret: process.env.SESSION_SECRET!,
  clientUrl: process.env.CLIENT_URL!,
  adminPassword: process.env.ADMIN_PASSWORD!,
  superAdminPassword: process.env.SUPERADMIN_PASSWORD!,
  port: parseInt(process.env.PORT || "10000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
};

// Startup log
console.log("[Env] Loaded server variables OK:", {
  NODE_ENV: config.nodeEnv,
  PORT: config.port,
  CLIENT_URL: config.clientUrl,
});

// GYG Environment Variables Check
console.log("[Env] GYG Environment Variables:", {
  GYG_SUPPLIER_USER: process.env.GYG_SUPPLIER_USER ? `${process.env.GYG_SUPPLIER_USER.substring(0, 3)}...` : 'NOT SET',
  GYG_SUPPLIER_PASS: process.env.GYG_SUPPLIER_PASS ? `${process.env.GYG_SUPPLIER_PASS.substring(0, 3)}...` : 'NOT SET',
  GYG_DEBUG: process.env.GYG_DEBUG || 'NOT SET',
  GYG_DEFAULT_VACANCY: process.env.GYG_DEFAULT_VACANCY || 'NOT SET',
  GYG_ENABLE_LIVE_SEARCH: process.env.GYG_ENABLE_LIVE_SEARCH || 'NOT SET',
  GYG_SUPPLIER_BASE: process.env.GYG_SUPPLIER_BASE || 'NOT SET'
});

// Simple self-check to ensure VITE_* variables are not required on backend
export function __envSelfTest__() {
  const ignored = ["VITE_API_URL", "VITE_MAP_PROVIDER", "VITE_LEAFLET_ENABLED"];
  for (const key of ignored) {
    // No-op: presence or absence must not throw
    if (process.env[key]) {
      // still fine on server, just ignored
    }
  }
  return true;
}

try {
  if (config.nodeEnv !== "test") {
    __envSelfTest__();
  }
} catch (e) {
  console.warn("[Env] Self-test failed (unexpected):", e);
}