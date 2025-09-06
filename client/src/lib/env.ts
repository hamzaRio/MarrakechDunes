export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const ASSETS_BASE = import.meta.env.VITE_ASSETS_BASE || `${API_URL}/attached_assets`;

export function asset(p: string) {
  return `${ASSETS_BASE}/${String(p).replace(/^[\\/]/, '')}`;
}