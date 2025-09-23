// Minimal backend env validation for Render

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
};

console.log('[Env] Loaded server variables OK:', {
  NODE_ENV: ENV.NODE_ENV,
});
