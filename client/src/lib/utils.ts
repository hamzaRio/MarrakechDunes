import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { assetUrl } from "./assets"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAssetUrl(path: string): string {
  if (!path) return assetUrl("placeholder.jpg");
  return assetUrl(path);
}

export function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}
