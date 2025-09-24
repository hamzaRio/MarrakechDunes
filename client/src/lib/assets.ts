const RAW_API = import.meta.env.VITE_API_URL || "";
const BACKEND_HOST = RAW_API.replace(/\/api\/?$/, "");
const raw = import.meta.env.VITE_ASSETS_BASE || "";

export const ASSETS_BASE = () => {
  if (raw.startsWith("http")) return raw;
  return `${BACKEND_HOST}/assets`;
};

export function assetUrl(path: string) {
  if (!path) return "";
  const clean = path.replace(/^\/+/, "").replace(/^attached_assets\//, "");
  return `${ASSETS_BASE()}/${clean}`;
}
