// Validate critical frontend environment variables
const criticalFrontendEnvVars = [
  'VITE_API_URL'
];

for (const envVar of criticalFrontendEnvVars) {
  if (!import.meta.env[envVar] && import.meta.env.MODE === 'production') {
    console.warn(`Warning: ${envVar} is not set in production mode. Using fallback.`);
  }
}

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://marrakechdunes.onrender.com' : "http://localhost:10000");

const ASSETS_BASE = import.meta.env.VITE_ASSETS_BASE || (import.meta.env.MODE === 'production' ? 'https://marrakechdunes.onrender.com/attached_assets' : '/attached_assets');

export function asset(p: string) {
  // Clean the path
  const cleanPath = String(p).replace(/^[\\/]/, '');
  
  // In production, use full URL to backend server for assets
  if (import.meta.env.MODE === 'production') {
    return `${ASSETS_BASE}/${cleanPath}`;
  }
  
  // In development, use relative path
  return `/attached_assets/${cleanPath}`;
}