// Validate critical frontend environment variables
const criticalFrontendEnvVars = [
  'VITE_API_URL'
];

const optionalFrontendEnvVars = [
  'VITE_GOOGLE_MAPS_KEY'
];

for (const envVar of criticalFrontendEnvVars) {
  if (!import.meta.env[envVar] && import.meta.env.MODE === 'production') {
    console.warn(`Warning: ${envVar} is not set in production mode. This may break API requests.`);
  }
}

for (const envVar of optionalFrontendEnvVars) {
  if (!import.meta.env[envVar] && import.meta.env.MODE === 'production') {
    console.warn(`Info: ${envVar} is not set. Google Maps features will be disabled.`);
  }
}

const apiUrl = (import.meta.env.VITE_API_URL || '').trim();
if (!apiUrl) {
  throw new Error('VITE_API_URL must be defined');
}

export const API_URL = apiUrl;

const ASSETS_BASE = import.meta.env.VITE_ASSETS_BASE || '/attached_assets';

export function asset(p: string) {
  // Clean the path
  const cleanPath = String(p).replace(/^[\\/]/, '');
  
  // If ASSETS_BASE is absolute (starts with http), use as-is
  if (ASSETS_BASE.startsWith('http')) {
    return `${ASSETS_BASE}/${cleanPath}`;
  }
  
  // Otherwise, use relative path (works for both dev and prod with Vercel proxy)
  return `${ASSETS_BASE}/${cleanPath}`;
}
