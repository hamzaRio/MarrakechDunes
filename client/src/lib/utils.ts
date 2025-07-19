import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAssetUrl(path: string): string {
  if (!path) return "/assets/placeholder.jpg";
  
  // Handle attached_assets paths
  if (path.startsWith('/attached_assets/')) {
    return path;
  }
  
  // Handle other asset paths
  if (path.startsWith('/')) {
    return path;
  }
  
  // Default fallback
  return `/assets/${path}`;
}
