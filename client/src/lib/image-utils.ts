// Image utility functions for handling asset imports in Vite
import { assetUrl } from "./assets";

// Use a stable cache buster based on build time instead of current time
const BUILD_VERSION = '1.0.2'; // Updated for new asset system

export const getAssetUrl = (filename: string): string => {
  if (!filename) return "";
  
  // No cache busting needed for static assets served by Vercel
  return assetUrl(filename);
};

export const getActivityFallbackImage = (activityName: string): string => {
  const name = activityName.toLowerCase();
  
  // Try to use real uploaded images first based on activity type
  if (name.includes('ourika')) {
    return assetUrl("Ourika Valley Day Trip1_1751114166831.jpg");
  } else if (name.includes('ouzoud')) {
    return assetUrl("Ouzoud-Waterfalls_1751126328233.jpg");
  } else if (name.includes('essaouira')) {
    return assetUrl("Essaouira Day Trip_1751122022833.jpg");
  } else if (name.includes('balloon') || name.includes('montgolfière')) {
    return assetUrl("Hot Air Balloon Ride2_1751127701686.jpg");
  } else if (name.includes('agafay') || name.includes('desert')) {
    return assetUrl("agafaypack1_1751128022717.jpeg");
  }
  
  // Default fallback image - use a generic Morocco landscape
  return assetUrl("riad-kheirredine_1756041288677.jpg");
};

// Helper function to handle image loading errors
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>, fallbackUrl?: string) => {
  const target = event.currentTarget;
  
  // If we already tried the fallback, don't loop
  if (target.dataset.fallbackAttempted === "true") {
    target.style.display = "none";
    return;
  }
  
  // Try fallback image
  if (fallbackUrl) {
    target.dataset.fallbackAttempted = "true";
    target.src = fallbackUrl;
  } else {
    // Hide broken image
    target.style.display = "none";
  }
};

// Get multiple images for an activity with error handling
export const getActivityImages = (imageUrls: string[] | string | undefined, activityName: string): string[] => {
  if (!imageUrls) return [getActivityFallbackImage(activityName)];
  
  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
  
  if (urls.length === 0) {
    return [getActivityFallbackImage(activityName)];
  }
  
  return urls.map(url => getAssetUrl(url)).filter(Boolean);
};