/**
 * GetYourGuide URL Builder Utilities
 * Builds proper deep-links to GetYourGuide search pages
 */

export interface GYGSearchParams {
  q: string;
  city?: string;
  lang?: string;
  currency?: string;
}

export interface GYGCountryParams {
  country?: string;
  lang?: string;
  currency?: string;
}

/**
 * Build GetYourGuide search URL with proper parameters
 * @param params - Search parameters
 * @returns Complete GYG search URL
 */
export function buildGyGSearchUrl({ 
  q, 
  city, 
  lang = 'fr-FR', 
  currency = 'MAD' 
}: GYGSearchParams): string {
  const baseUrl = 'https://www.getyourguide.com/s/';
  const params = new URLSearchParams();
  
  params.set('q', q);
  if (city) {
    params.set('lc', city);
  }
  params.set('currency', currency);
  params.set('lang', lang);
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Build GetYourGuide country search URL
 * @param params - Country search parameters
 * @returns Complete GYG country search URL
 */
export function buildGyGCountryUrl({ 
  country = 'morocco', 
  lang = 'fr-FR', 
  currency = 'MAD' 
}: GYGCountryParams): string {
  const baseUrl = 'https://www.getyourguide.com/s/';
  const params = new URLSearchParams();
  
  params.set('q', country);
  params.set('currency', currency);
  params.set('lang', lang);
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Open GetYourGuide search in new tab
 * @param params - Search parameters
 */
export function openGyGSearch(params: GYGSearchParams): void {
  const url = buildGyGSearchUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Open GetYourGuide country search in new tab
 * @param params - Country search parameters
 */
export function openGyGCountry(params: GYGCountryParams): void {
  const url = buildGyGCountryUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
}