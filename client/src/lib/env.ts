export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function asset(p: string) {
  // Use relative path for Vercel proxy, absolute URL for development
  const isDevelopment = import.meta.env.DEV;
  if (isDevelopment) {
    const baseUrl = import.meta.env.VITE_ASSETS_BASE || `${API_URL}/attached_assets`;
    return `${baseUrl}/${String(p).replace(/^[\\/]/, '')}`;
  } else {
    // Production: use relative path so Vercel can proxy to Render
    return `/attached_assets/${String(p).replace(/^[\\/]/, '')}`;
  }
}