// Simplified asset handling - just use local images
export function assetUrl(path: string): string {
  if (!path) return "";
  
  // Remove any existing prefixes and leading slashes
  const clean = path.replace(/^\/*(assets|attached_assets|images)\//, "").replace(/^\/+/, "");
  
  // Always use local images from Vercel public folder
  return `/images/${clean}`;
}

// Simple CSS background helper
export function assetCssUrl(path: string): string {
  return `url('${assetUrl(path)}')`;
}

// Simple activity image getter
export function getActivityImage(filename: string): string {
  return assetUrl(filename);
}
