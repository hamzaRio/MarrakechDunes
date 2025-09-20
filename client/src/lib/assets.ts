export const ASSETS_BASE = (() => {
  const raw = (import.meta.env.VITE_ASSETS_BASE || '').trim();
  // If user put a relative "/attached_assets", prefer backend origin
  if (!raw) return `${window.location.origin}/attached_assets`;
  if (raw.startsWith('http')) return raw.replace(/\/$/, '');
  return `${window.location.origin}/${raw.replace(/^\/+/, '').replace(/\/$/, '')}`;
})();

// URL-safe join (spaces etc.)
export function assetUrl(path: string) {
  const clean = path.replace(/^\/+/, '');
  return encodeURI(`${ASSETS_BASE}/${clean}`);
}
