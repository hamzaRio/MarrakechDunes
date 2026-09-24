// Backend env validation for Render with API keys

const required = [
  'DATABASE_URL',
  'SESSION_SECRET',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required env var: ${key}`);
  }
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  SESSION_SECRET: process.env.SESSION_SECRET!,
  
  // GetYourGuide API Configuration
  GYG_PARTNER_API_BASE: process.env.GYG_PARTNER_API_BASE,
  GYG_PARTNER_API_TOKEN: process.env.GYG_PARTNER_API_TOKEN,
  GYG_PARTNER_API_LANGUAGE: process.env.GYG_PARTNER_API_LANGUAGE || 'en',
  GYG_PARTNER_API_CURRENCY: process.env.GYG_PARTNER_API_CURRENCY || 'MAD',
  GYG_SUPPLIER_BASE: process.env.GYG_SUPPLIER_BASE,
  GYG_SUPPLIER_USER: process.env.GYG_SUPPLIER_USER,
  GYG_SUPPLIER_PASS: process.env.GYG_SUPPLIER_PASS,
  GYG_ENABLE_LIVE_SEARCH: process.env.GYG_ENABLE_LIVE_SEARCH || 'false',
  
  // Rezdy API Configuration
  REZDY_API_KEY: process.env.REZDY_API_KEY,
  
  // Client URL for CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

console.log('[Env] Loaded server variables OK:', {
  NODE_ENV: ENV.NODE_ENV,
  GYG_ENABLED: ENV.GYG_ENABLE_LIVE_SEARCH === 'true',
  REZDY_ENABLED: !!ENV.REZDY_API_KEY,
  CLIENT_URL: ENV.CLIENT_URL,
});
