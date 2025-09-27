// Assets can be served from either Vercel (/images/) or Render (/assets/)
const getAssetsBase = () => {
  const base = import.meta.env.VITE_ASSETS_BASE as string | undefined;
  if (base?.trim()) {
    // Remove trailing slash if present
    return base.trim().replace(/\/$/, '');
  }
  return '/images'; // Fallback to local images
};

export function assetUrl(path: string): string {
  if (!path) return "";
  
  // Clean the path
  let clean = path.replace(/^\/+/, ""); // Remove leading slashes
  clean = clean.replace(/^(assets|attached_assets|images)\//, ""); // Remove any prefix
  
  // Get base URL from environment
  const base = getAssetsBase();
  
  // Return full URL
  return `${base}/${clean}`;
}

// Helper function for background images in CSS
export function assetCssUrl(path: string): string {
  return `url('${assetUrl(path)}')`;
}

// Helper to get specific activity images with error handling
export function getActivityImage(filename: string): string {
  const url = assetUrl(filename);
  return url;
}
