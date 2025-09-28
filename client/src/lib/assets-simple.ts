// Simplified asset handler - always uses local images from Vercel
export function asset(path: string): string {
  // Clean the path
  const cleanPath = path.replace(/^[\\/]/, '').replace(/^(assets|attached_assets|images)[\\/]/, '');
  
  // Always use local images from Vercel
  return `/images/${cleanPath}`;
}

// Cached assets base to prevent repeated console logging
let cachedAssetsBase: string | null = null;

export function getAssetsBase(): string {
  if (cachedAssetsBase === null) {
    cachedAssetsBase = '/images';
    if (import.meta.env.MODE === 'development') {
      console.log('Using local images from Vercel');
    }
  }
  return cachedAssetsBase;
}
