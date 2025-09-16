// Validate critical frontend environment variables
const criticalFrontendEnvVars = [
  'VITE_API_URL'
];

for (const envVar of criticalFrontendEnvVars) {
  if (!import.meta.env[envVar] && import.meta.env.MODE === 'production') {
    console.warn(`Warning: ${envVar} is not set in production mode`);
  }
}

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://marrakechdunes.onrender.com' : "http://localhost:10000");

export function asset(p: string) {
  // Always use relative path from public directory
  return `/attached_assets/${String(p).replace(/^[\\/]/, '')}`;
}