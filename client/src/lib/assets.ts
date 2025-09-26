const RAW_API = import.meta.env.VITE_API_URL || "";
const BACKEND_HOST = RAW_API.replace(/\/api\/?$/, "");
const raw = import.meta.env.VITE_ASSETS_BASE || "";

export const ASSETS_BASE = () => {
  // If VITE_ASSETS_BASE is a full URL, use it directly
  if (raw.startsWith("http")) {
    return raw;
  }
  
  // If VITE_ASSETS_BASE is a path (like "/attached_assets"), combine with backend host
  if (raw) {
    const cleanPath = raw.replace(/^\/+/, '').replace(/\/+$/, '');
    return `${BACKEND_HOST}/${cleanPath}`;
  }
  
  // Default fallback to /attached_assets
  return `${BACKEND_HOST}/attached_assets`;
};

export function assetUrl(path: string) {
  if (!path) return "";
  // Keep the path structure as the backend expects it
  const clean = path.replace(/^\/+/, "");
  // Don't remove attached_assets prefix since that's where images are stored
  return `${ASSETS_BASE()}/${clean}`;
}
