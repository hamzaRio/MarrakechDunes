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
  
  // Handle both full URLs (http/https) and relative paths
  return urls.map(url => {
    if (!url) return '';
    // If it's already a full URL, use it directly
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Otherwise, use assetUrl for relative paths
    return getAssetUrl(url);
  }).filter(Boolean);
};

// Responsive image utilities for better performance
export function getResponsiveImageUrl(
  imageUrl: string, 
  size: 'thumb' | 'small' | 'medium' | 'large' = 'medium'
): string {
  if (!imageUrl) return '';
  
  const sizes = {
    thumb: 'w_200',
    small: 'w_400',
    medium: 'w_800',
    large: 'w_1200'
  };
  
  // If using Cloudinary or similar CDN
  if (imageUrl.includes('cloudinary')) {
    return imageUrl.replace('/upload/', `/upload/${sizes[size]}/`);
  }
  
  // If using Imgix or similar
  if (imageUrl.includes('imgix') || imageUrl.includes('imagekit')) {
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}w=${size === 'thumb' ? 200 : size === 'small' ? 400 : size === 'medium' ? 800 : 1200}`;
  }
  
  // Return original for other cases
  return imageUrl;
}

export function getImageSrcSet(imageUrl: string): string {
  if (!imageUrl) return '';
  
  const sizes = ['200', '400', '800', '1200'];
  return sizes.map(size => {
    const sizeKey = size === '200' ? 'thumb' : size === '400' ? 'small' : size === '800' ? 'medium' : 'large';
    const url = getResponsiveImageUrl(imageUrl, sizeKey as any);
    return `${url} ${size}w`;
  }).join(', ');
}

// Lazy load image helper
export function useLazyImage(src: string, fallback?: string): { src: string; loading: 'lazy' | 'eager'; onError: (e: React.SyntheticEvent<HTMLImageElement>) => void } {
  return {
    src: src || fallback || getActivityFallbackImage(''),
    loading: 'lazy' as const,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      handleImageError(e, fallback || getActivityFallbackImage(''));
    }
  };
}