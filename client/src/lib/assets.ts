const RAW_API = import.meta.env.VITE_API_URL || "";
const BACKEND_HOST = RAW_API.replace(/\/api\/?$/, "");
const raw = import.meta.env.VITE_ASSETS_BASE || "";

export const ASSETS_BASE = () => {
  if (raw.startsWith("http")) return raw;
  // Point to the correct backend assets path where images are actually stored
  return `${BACKEND_HOST}/attached_assets`;
};

export function assetUrl(path: string) {
  if (!path) return "";
  // Keep the path structure as the backend expects it
  const clean = path.replace(/^\/+/, "");
  // Don't remove attached_assets prefix since that's where images are stored
  return `${ASSETS_BASE()}/${clean}`;
}
