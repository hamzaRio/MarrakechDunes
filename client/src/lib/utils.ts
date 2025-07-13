import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAssetUrl(path: string): string {
  if (!path) return "/assets/placeholder.jpg";

  // Already an absolute path
  if (path.startsWith("/")) {
    return path;
  }

  // Default fallback points to the public assets directory
  return `/assets/${path}`;
}
