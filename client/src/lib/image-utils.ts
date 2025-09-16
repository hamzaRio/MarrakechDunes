// Image utility functions for handling asset imports in Vite
import { asset } from "./env";

// Use a stable cache buster based on build time instead of current time
const BUILD_VERSION = '1.0.1'; // Update this when you want to bust cache

export const getAssetUrl = (filename: string): string => {
  // Use stable cache-busting to prevent duplicate requests
  const cacheBuster = `?v=${BUILD_VERSION}`;
  
  // Always serve from backend assets with stable cache busting
  if (filename.startsWith('/attached_assets/')) {
    // Remove /attached_assets/ prefix since asset() will handle it (legacy support)
    const cleanFilename = filename.replace('/attached_assets/', '');
    return asset(cleanFilename) + cacheBuster;
  }
  
  // Add stable cache busting to all image URLs
  return asset(filename) + cacheBuster;
};

export const getActivityFallbackImage = (activityName: string): string => {
  const name = activityName.toLowerCase();
  
  if (name.includes('agafay') || name.includes('desert')) {
    return "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  } else if (name.includes('balloon') || name.includes('montgolfière')) {
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  } else if (name.includes('essaouira')) {
    return "https://images.unsplash.com/photo-1539650116574-75c0c6d73d0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  } else if (name.includes('ourika')) {
    return asset("Ourika Valley Day Trip1_1751114166831.jpg");
  } else if (name.includes('ouzoud')) {
    return "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  }
  
  // Default fallback
  return "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
};