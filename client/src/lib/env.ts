// Validate critical frontend environment variables
const criticalFrontendEnvVars = [
  'VITE_API_URL'
];

for (const envVar of criticalFrontendEnvVars) {
  if (!import.meta.env[envVar] && import.meta.env.MODE === 'production') {
    console.warn(`Warning: ${envVar} is not set in production mode. This may break API requests.`);
  }
}

// In production, VITE_API_URL should point to https://marrakechdunes-sppy.onrender.com
const apiUrl = (import.meta.env.VITE_API_URL || '').trim();
if (!apiUrl) {
  throw new Error('VITE_API_URL must be defined');
}

export const API_URL = apiUrl;

// Static assets are served from client/public/images
const ASSETS_BASE = '/images';

export function asset(p: string) {
  const cleanPath = String(p).replace(/^[\\/]/, '');
  if (ASSETS_BASE.startsWith('http')) {
    return `${ASSETS_BASE}/${cleanPath}`;
  }
  return `${ASSETS_BASE}/${cleanPath}`;
}

type MapProvider = 'iframe' | 'leaflet';

const rawMapProvider = ((import.meta.env.MAP_PROVIDER ?? import.meta.env.VITE_MAP_PROVIDER) || '').toString().trim().toLowerCase();
const rawLeafletEnabled = ((import.meta.env.LEAFLET_ENABLED ?? import.meta.env.VITE_LEAFLET_ENABLED) || '').toString().trim().toLowerCase();

let mapProvider: MapProvider = rawMapProvider === 'leaflet' ? 'leaflet' : 'iframe';

if (rawLeafletEnabled === 'true') {
  mapProvider = 'leaflet';
} else if (rawLeafletEnabled === 'false') {
  mapProvider = 'iframe';
} else if (rawMapProvider && rawMapProvider !== 'iframe' && rawMapProvider !== 'leaflet') {
  console.warn(`MAP_PROVIDER value "${rawMapProvider}" is invalid. Falling back to iframe.`);
}

export const MAP_PROVIDER: MapProvider = mapProvider;
export const IS_LEAFLET_ENABLED = MAP_PROVIDER === 'leaflet';

// GetYourGuide Reference Configuration
export const GYG_LANG = import.meta.env.VITE_GYG_LANG || 'fr-FR';
export const GYG_CURRENCY = import.meta.env.VITE_GYG_CURRENCY || 'MAD';
