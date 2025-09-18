import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { asset } from "./env"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAssetUrl(path: string): string {
  if (!path) return asset("placeholder.jpg");
  
  // Handle attached_assets paths (legacy support)
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
  
  // Default fallback - ensure we use VITE_ASSETS_BASE
  return asset(path);
}

export function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}
