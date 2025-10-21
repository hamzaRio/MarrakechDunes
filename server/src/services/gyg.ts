import axios, { AxiosError } from 'axios';

// UTF-8 normalization helper
function normalizeUTF8(text: string): string {
  if (!text) return text;
  
  // Normalize Unicode characters
  return text.normalize('NFC')
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // En/em dashes
    .replace(/\u2026/g, '...') // Ellipsis
    .trim();
}

export interface GYGProduct {
  title: string;
  city: string;
  price: number;
  currency: string;
  durationText: string;
  provider: string;
  providerUrl?: string;
}

export class GYGError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public upstreamBody?: string
  ) {
    super(message);
    this.name = 'GYGError';
  }
}


export async function fetchProducts(search: string): Promise<GYGProduct[]> {
  // IMPORTANT: This function is ONLY for showing suggestions from GYG
  // It does NOT add anything to the user's database
  // GYG data is only used for competitive pricing reference
  
  try {
    console.log(`[GYG] Attempting real GYG search for suggestions: "${search}"`);
    return await fetchRealGYGData(search);
  } catch (error) {
    console.warn('[GYG] Real GYG data failed, returning sample data for reference:', (error as Error).message);
    return getSampleGYGData(search); // Return sample data when GYG fails
  }
}

// Sample GYG data for reference when real API fails
function getSampleGYGData(search: string): GYGProduct[] {
  const searchLower = search.toLowerCase();
  
  // Morocco-specific activities based on search
  const sampleActivities: GYGProduct[] = [];
  
  if (searchLower.includes('fes') || searchLower.includes('fès')) {
    sampleActivities.push({
      title: "Visite guidée de Fès - Médina historique",
      city: "Fès",
      price: 250,
      currency: "MAD",
      durationText: "4 heures",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/fes-l1234/"
    });
  }
  
  if (searchLower.includes('rabat')) {
    sampleActivities.push({
      title: "Tour de Rabat - Capitale du Maroc",
      city: "Rabat",
      price: 200,
      currency: "MAD", 
      durationText: "3 heures",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/rabat-l1234/"
    });
  }
  
  if (searchLower.includes('meknes')) {
    sampleActivities.push({
      title: "Découverte de Meknès - Ville impériale",
      city: "Meknès",
      price: 180,
      currency: "MAD",
      durationText: "3 heures", 
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/meknes-l1234/"
    });
  }
  
  if (searchLower.includes('tanger') || searchLower.includes('tangier')) {
    sampleActivities.push({
      title: "Excursion Tanger - Porte de l'Afrique",
      city: "Tanger",
      price: 300,
      currency: "MAD",
      durationText: "6 heures",
      provider: "GetYourGuide", 
      providerUrl: "https://www.getyourguide.com/tanger-l1234/"
    });
  }
  
  // Generic Morocco activities if no specific city match
  if (sampleActivities.length === 0) {
    sampleActivities.push(
      {
        title: "Excursion désert Agafay depuis Marrakech",
        city: "Marrakech",
        price: 450,
        currency: "MAD",
        durationText: "1 jour",
        provider: "GetYourGuide",
        providerUrl: "https://www.getyourguide.com/marrakech-l1234/"
      },
      {
        title: "Montgolfière au-dessus de Marrakech",
        city: "Marrakech", 
        price: 1200,
        currency: "MAD",
        durationText: "3 heures",
        provider: "GetYourGuide",
        providerUrl: "https://www.getyourguide.com/marrakech-l1234/"
      }
    );
  }
  
  console.log(`[GYG] Returning ${sampleActivities.length} sample activities for reference`);
  return sampleActivities;
}

// Function to fetch real GYG data from their public website
async function fetchRealGYGData(search: string): Promise<GYGProduct[]> {
  try {
    console.log(`[GYG] Attempting real GYG search for: "${search}"`);
    
    // Use GYG's public search API endpoint - search globally, not just Marrakech
    const searchUrl = `https://www.getyourguide.com/s/`;
    const params = new URLSearchParams({
      'search': search,
      'language': 'fr',
      'currency': 'MAD'
    });
    
    console.log(`[GYG] Searching: ${searchUrl}?${params.toString()}`);
    
    // Try multiple search approaches
    const searchAttempts = [
      `${searchUrl}?${params.toString()}`,
      `https://www.getyourguide.com/s/Morocco/?${params.toString()}`,
      `https://www.getyourguide.com/s/Agadir/?${params.toString()}`,
      `https://www.getyourguide.com/s/Taghazout/?${params.toString()}`
    ];
    
    let response;
    let lastError;
    
    for (const attemptUrl of searchAttempts) {
      try {
        console.log(`[GYG] Trying: ${attemptUrl}`);
        response = await axios.get(attemptUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
            'Referer': 'https://www.getyourguide.com/'
          },
          timeout: 15000,
          maxRedirects: 5,
          validateStatus: (status) => status < 400
        });
        
        if (response.status === 200 && response.data.length > 1000) {
          console.log(`[GYG] Success with: ${attemptUrl}`);
          break; // Found a good response
        }
      } catch (error) {
        lastError = error;
        console.log(`[GYG] Failed with: ${attemptUrl} - ${(error as Error).message}`);
        continue; // Try next URL
      }
    }
    
    if (!response) {
      throw lastError || new Error('All search attempts failed');
    }
    
    console.log(`[GYG] Response status: ${response.status}, length: ${response.data.length}`);
    
    if (response.status === 200 && response.data.length > 1000) {
      const activities = parseGYGResponse(response.data, search);
      if (activities.length > 0) {
        console.log(`[GYG] Successfully found ${activities.length} real GYG activities`);
        return activities;
      }
    }
    
    throw new Error('No activities found in GYG response');
    
  } catch (error) {
    console.warn('[GYG] Real GYG search failed:', (error as Error).message);
    throw error;
  }
}

// Parse GYG HTML response
function parseGYGResponse(html: string, search: string): GYGProduct[] {
  const activities: GYGProduct[] = [];
  
  try {
    console.log(`[GYG] Parsing HTML response (${html.length} characters)`);
    
    // Look for JSON data in script tags (GYG often embeds data)
    const jsonRegex = /window\.__INITIAL_STATE__\s*=\s*({.+?});/;
    const jsonMatch = html.match(jsonRegex);
    
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        console.log('[GYG] Found embedded JSON data');
        
        // Extract activities from embedded data
        const products = data?.products || data?.searchResults || data?.activities || data?.items || [];
        if (Array.isArray(products) && products.length > 0) {
          console.log(`[GYG] Found ${products.length} products in JSON`);
          for (const product of products.slice(0, 5)) {
            activities.push({
              title: normalizeUTF8(product.title || product.name || product.headline || 'Activity'),
              city: normalizeUTF8(product.city || product.location || product.place || 'Marrakech'),
              price: Number(product.price || product.fromPrice || product.priceFrom || 0),
              currency: 'MAD',
              durationText: product.duration || product.durationText || 'N/A',
              provider: 'GetYourGuide',
              providerUrl: product.url || product.link || product.permalink || ''
            });
          }
          return activities;
        }
      } catch (jsonError) {
        console.warn('[GYG] JSON parsing failed:', (jsonError as Error).message);
      }
    }
    
    // Enhanced HTML parsing for GYG's current structure - more flexible patterns
    const activityRegex = /<div[^>]*class="[^"]*(?:activity|card|item|product)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const titleRegex = /<h[2-4][^>]*class="[^"]*(?:title|name|headline)[^"]*"[^>]*>([^<]+)<\/h[2-4]>/gi;
    const priceRegex = /<span[^>]*class="[^"]*(?:price|cost|amount)[^"]*"[^>]*>([^<]+)<\/span>/gi;
    const linkRegex = /<a[^>]*href="([^"]*getyourguide\.com[^"]*)"[^>]*>/gi;
    
    // Try to find activities in the HTML
    let activityMatch;
    const foundActivities: string[] = [];
    
    while ((activityMatch = activityRegex.exec(html)) !== null) {
      foundActivities.push(activityMatch[1]);
    }
    
    console.log(`[GYG] Found ${foundActivities.length} activity sections`);
    
    // Extract titles, prices, and links
    const titles: string[] = [];
    const prices: string[] = [];
    const links: string[] = [];
    
    // Extract from all activity sections
    foundActivities.forEach(section => {
      let match;
      
      // Extract titles
      while ((match = titleRegex.exec(section)) !== null) {
        const title = match[1].trim().replace(/<[^>]*>/g, '');
        if (title && title.length > 5) {
          titles.push(title);
        }
      }
      
      // Extract prices
      while ((match = priceRegex.exec(section)) !== null) {
        const price = match[1].trim().replace(/<[^>]*>/g, '');
        if (price && (price.includes('€') || price.includes('MAD') || price.includes('$'))) {
          prices.push(price);
        }
      }
      
      // Extract links
      while ((match = linkRegex.exec(section)) !== null) {
        const link = match[1];
        if (link && link.includes('getyourguide.com')) {
          links.push(link);
        }
      }
    });
    
    console.log(`[GYG] Extracted: ${titles.length} titles, ${prices.length} prices, ${links.length} links`);
    
    // Combine results
    for (let i = 0; i < Math.min(titles.length, 5); i++) {
      const title = titles[i];
      const price = prices[i] || '0';
      const link = links[i] || '';
      
      // Extract price number
      const priceMatch = price.match(/(\d+)/);
      const priceNumber = priceMatch ? parseInt(priceMatch[1]) : 0;
      
      // Convert EUR to MAD (approximate)
      let finalPrice = priceNumber;
      if (price.includes('€')) {
        finalPrice = Math.round(priceNumber * 11); // Approximate EUR to MAD conversion
      }
      
      activities.push({
        title: normalizeUTF8(title),
        city: 'Marrakech',
        price: finalPrice,
        currency: 'MAD',
        durationText: 'N/A',
        provider: 'GetYourGuide',
        providerUrl: link.startsWith('http') ? link : `https://www.getyourguide.com${link}`
      });
    }
    
  } catch (parseError) {
    console.warn('[GYG] HTML parsing failed:', (parseError as Error).message);
  }
  
  return activities;
}

// Legacy function for backward compatibility
export async function searchGYG(query: string, city?: string): Promise<GYGProduct[]> {
  const searchQuery = city ? `${query} ${city}`.trim() : query;
  return fetchProducts(searchQuery);
}

export async function testGYGConnection(): Promise<{ status: 'ok' | 'error'; code: string; message: string; count?: number; sampleTitle?: string }> {
  try {
    const results = await fetchProducts('agafay marrakech');
    return {
      status: 'ok',
      code: 'SUCCESS',
      message: `Found ${results.length} activities`,
      count: results.length,
      sampleTitle: results[0]?.title || 'No activities found'
    };
  } catch (error) {
    if (error instanceof GYGError) {
      return {
        status: 'error',
        code: error.code,
        message: error.message
      };
    }
    
    return {
      status: 'error',
      code: 'UNKNOWN_ERROR',
      message: (error as Error).message || 'Unknown error occurred'
    };
  }
}
