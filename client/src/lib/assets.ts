const RAW_API = import.meta.env.VITE_API_URL || "";
const BACKEND_HOST = RAW_API.replace(/\/api\/?$/, "");
const raw = import.meta.env.VITE_ASSETS_BASE || "";

export const ASSETS_BASE = () => {
  // Always use full backend URL for assets
  // Images are stored on the backend (Render), not frontend (Vercel)
  if (raw.startsWith("http")) {
    return raw;
  }
  
  // Even if VITE_ASSETS_BASE is just "/assets", always point to backend
  const backendHost = RAW_API.replace(/\/api\/?$/, "");
  return `${backendHost}/attached_assets`;
};

export function assetUrl(path: string) {
  if (!path) return "";
  // Keep the path structure as the backend expects it
  const clean = path.replace(/^\/+/, "");
  // Don't remove attached_assets prefix since that's where images are stored
  return `${ASSETS_BASE()}/${clean}`;
}
