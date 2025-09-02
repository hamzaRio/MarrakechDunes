export const API_URL = import.meta.env.VITE_API_URL || "";
export const ASSETS_BASE =
  import.meta.env.VITE_ASSETS_BASE ??
  (import.meta.env.DEV ? 'http://localhost:5000/assets' : `${window.location.origin}/assets`);
export function asset(p: string) {
  return `${ASSETS_BASE}/${String(p).replace(/^[\\/]/, '')}`;
}