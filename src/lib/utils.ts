import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { asset } from "./env"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAssetUrl(path: string): string {
  if (!path) return asset("placeholder.jpg");
  
  // Handle attached_assets paths
  if (path.startsWith('/attached_assets/')) {
    // Remove /attached_assets/ prefix since asset() will handle it
    const cleanPath = path.replace('/attached_assets/', '');
    return asset(cleanPath);
  }
  
  // Handle other asset paths
  if (path.startsWith('/')) {
    // Remove leading slash since asset() will handle it
    return asset(path.substring(1));
  }
  
  // Default fallback
  return asset(path);
}
