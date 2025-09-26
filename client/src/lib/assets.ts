// Static assets are now served from client/public/images
// All images are available at /images/ path (served by Vercel/frontend)

export function assetUrl(path: string): string {
  if (!path) return "";
  
  // Clean the path - remove leading slashes and any attached_assets prefix
  let clean = path.replace(/^\/+/, "");
  clean = clean.replace(/^attached_assets\//, "");
  
  // Return path relative to public directory (served by Vercel)
  return `/images/${clean}`;
}

// Helper function for background images in CSS
export function assetCssUrl(path: string): string {
  return `url('${assetUrl(path)}')`;
}

// Legacy function for backward compatibility
export const ASSETS_BASE = () => "/images";

// Helper to get specific activity images
export function getActivityImage(filename: string): string {
  return assetUrl(filename);
}
