// Image utility functions for handling asset imports in Vite
import { assetUrl } from "./assets";

// Use a stable cache buster based on build time instead of current time
const BUILD_VERSION = '1.0.1'; // Update this when you want to bust cache

export const getAssetUrl = (filename: string): string => {
  // Use stable cache-busting to prevent duplicate requests
  const cacheBuster = `?v=${BUILD_VERSION}`;
  return assetUrl(filename) + cacheBuster;
};

export const getActivityFallbackImage = (activityName: string): string => {
  const name = activityName.toLowerCase();
  
  // Try to use real uploaded images first
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
  
  // No fallback - return empty string to force use of actual uploaded images
  return "";
};