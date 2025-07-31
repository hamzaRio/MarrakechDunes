import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAssetUrl(path: string): string {
  if (!path) return "/assets/placeholder.jpg";
  
  
 // Already an absolute asset path
  if (path.startsWith('/attached_assets/') || path.startsWith('/assets/')) {
  }
  
  // Handle other asset paths
  if (path.startsWith('/')) {
    return path;
  }
  
  // Default fallback
  return `/assets/${path}`;
}
