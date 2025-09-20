// Guard against missing VITE_ASSETS_BASE, fallback to empty string to avoid broken <img> paths
export const ASSETS_BASE = (() => {
  const raw = (import.meta.env.VITE_ASSETS_BASE || '').trim();
  // If missing, return empty string to avoid broken paths
  if (!raw) {
    console.warn('[Assets] VITE_ASSETS_BASE is missing, using fallback');
    return '';
  }
  if (raw.startsWith('http')) return raw.replace(/\/$/, '');
  return `${window.location.origin}/${raw.replace(/^\/+/, '').replace(/\/$/, '')}`;
})();

// URL-safe join (spaces etc.) - always prefix with VITE_ASSETS_BASE
export function assetUrl(path: string) {
  if (!path) return '';
  const clean = path.replace(/^\/+/, '');
  if (!ASSETS_BASE) return clean; // Fallback to just the path if no base
  return encodeURI(`${ASSETS_BASE}/${clean}`);
}
