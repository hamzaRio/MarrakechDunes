export const API_URL = import.meta.env.VITE_API_URL || "";
export const ASSETS_BASE =
  import.meta.env.VITE_ASSETS_BASE ?? `${window.location.origin}/assets`;
export function asset(p: string) {
  return `${ASSETS_BASE}/${String(p).replace(/^[\\/]/, '')}`;
}