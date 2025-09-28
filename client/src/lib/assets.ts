// Assets are served from Vercel (/images/) - backend no longer serves static assets
let assetsBaseCache: string | null = null;

const getAssetsBase = () => {
  // Cache the result to prevent repeated logging
  if (assetsBaseCache !== null) {
    return assetsBaseCache;
  }

  const base = import.meta.env.VITE_ASSETS_BASE as string | undefined;
  
  // If VITE_ASSETS_BASE is explicitly set, use it (but warn about potential issues)
  if (base?.trim()) {
    const cleanBase = base.trim().replace(/\/$/, '');
    console.warn('⚠️ VITE_ASSETS_BASE is set - this may cause asset loading issues!');
    console.log('✅ Using VITE_ASSETS_BASE:', cleanBase);
    assetsBaseCache = cleanBase;
    return cleanBase;
  }
  
  // Always use local images from Vercel - backend doesn't serve static assets
  assetsBaseCache = '/images';
  return '/images';
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
