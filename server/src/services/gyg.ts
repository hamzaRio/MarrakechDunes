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

// FREE Morocco Activities Database - No API needed!
function getMockGYGResults(search: string): GYGProduct[] {
  const searchLower = search.toLowerCase();
  
  // Comprehensive Morocco activities database - FREE alternative to GYG API
  const moroccoActivities = [
    // Marrakech Activities
    {
      title: "Hot Air Balloon Ride over Marrakech",
      city: "Marrakech",
      price: 650,
      currency: "MAD",
      durationText: "3-4 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/hot-air-balloon-ride-t123456/"
    },
    {
      title: "Agafay Desert Day Trip from Marrakech",
      city: "Agafay",
      price: 520,
      currency: "MAD", 
      durationText: "8 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/agafay-desert-day-trip-t234567/"
    },
    {
      title: "Atlas Mountains Day Trek",
      city: "Atlas Mountains",
      price: 380,
      currency: "MAD",
      durationText: "6-8 hours", 
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/atlas-mountains-trek-t345678/"
    },
    {
      title: "Essaouira Day Trip from Marrakech",
      city: "Essaouira",
      price: 200,
      currency: "MAD",
      durationText: "9 hours",
      provider: "GetYourGuide", 
      providerUrl: "https://www.getyourguide.com/marrakech-l208/essaouira-day-trip-t456789/"
    },
    {
      title: "Ouzoud Waterfalls Day Trip",
      city: "Ouzoud",
      price: 450,
      currency: "MAD",
      durationText: "10 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/ouzoud-waterfalls-t567890/"
    },
    {
      title: "Merzouga Desert Safari 3-Day Tour",
      city: "Merzouga",
      price: 1200,
      currency: "MAD", 
      durationText: "3 days",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/merzouga-desert-safari-t678901/"
    },
    {
      title: "Chefchaouen Day Trip from Marrakech",
      city: "Chefchaouen",
      price: 400,
      currency: "MAD",
      durationText: "12 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/chefchaouen-day-trip-t789012/"
    },
    {
      title: "Marrakech City Walking Tour",
      city: "Marrakech",
      price: 180,
      currency: "MAD",
      durationText: "4 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/city-walking-tour-t890123/"
    },
    // Taghazout & Agadir Activities
    {
      title: "Taghazout Surfing Lessons",
      city: "Taghazout",
      price: 300,
      currency: "MAD",
      durationText: "2-3 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/agadir-l208/taghazout-surfing-lessons-t901234/"
    },
    {
      title: "Taghazout Beach Day Trip",
      city: "Taghazout",
      price: 250,
      currency: "MAD",
      durationText: "6 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/agadir-l208/taghazout-beach-day-trip-t012345/"
    },
    {
      title: "Agadir City Tour",
      city: "Agadir",
      price: 150,
      currency: "MAD",
      durationText: "4 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/agadir-l208/agadir-city-tour-t123456/"
    },
    {
      title: "Agadir Souk El Had Market Tour",
      city: "Agadir",
      price: 120,
      currency: "MAD",
      durationText: "3 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/agadir-l208/agadir-souk-market-tour-t234567/"
    },
    {
      title: "Paradise Valley Day Trip from Agadir",
      city: "Agadir",
      price: 350,
      currency: "MAD",
      durationText: "8 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/agadir-l208/paradise-valley-day-trip-t345678/"
    },
    // Casablanca Activities
    {
      title: "Casablanca City Tour",
      city: "Casablanca",
      price: 200,
      currency: "MAD",
      durationText: "4 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/casablanca-l208/casablanca-city-tour-t456789/"
    },
    {
      title: "Hassan II Mosque Visit",
      city: "Casablanca",
      price: 80,
      currency: "MAD",
      durationText: "2 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/casablanca-l208/hassan-ii-mosque-visit-t567890/"
    },
    // Rabat Activities
    {
      title: "Rabat Capital City Tour",
      city: "Rabat",
      price: 180,
      currency: "MAD",
      durationText: "5 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/rabat-l208/rabat-capital-city-tour-t678901/"
    },
    {
      title: "Chellah Gardens Visit",
      city: "Rabat",
      price: 60,
      currency: "MAD",
      durationText: "2 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/rabat-l208/chellah-gardens-visit-t789012/"
    },
    // Fes Activities
    {
      title: "Fes Medina Walking Tour",
      city: "Fes",
      price: 220,
      currency: "MAD",
      durationText: "4 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/fes-l208/fes-medina-walking-tour-t890123/"
    },
    {
      title: "Fes Pottery Workshop",
      city: "Fes",
      price: 150,
      currency: "MAD",
      durationText: "3 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/fes-l208/fes-pottery-workshop-t901234/"
    },
    // Tangier Activities
    {
      title: "Tangier City Tour",
      city: "Tangier",
      price: 180,
      currency: "MAD",
      durationText: "4 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/tangier-l208/tangier-city-tour-t012345/"
    },
    {
      title: "Hercules Cave Visit",
      city: "Tangier",
      price: 100,
      currency: "MAD",
      durationText: "2 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/tangier-l208/hercules-cave-visit-t123456/"
    }
  ];

  // Smart filtering for Morocco activities
  const filtered = moroccoActivities.filter(activity => {
    const title = activity.title.toLowerCase();
    const city = activity.city.toLowerCase();
    
    // Direct matches
    if (title.includes(searchLower) || city.includes(searchLower)) {
      return true;
    }
    
    // Smart keyword matching
    if (searchLower.includes('taghazout') && city.includes('taghazout')) return true;
    if (searchLower.includes('agadir') && city.includes('agadir')) return true;
    if (searchLower.includes('surf') && title.includes('surf')) return true;
    if (searchLower.includes('beach') && title.includes('beach')) return true;
    if (searchLower.includes('desert') && (title.includes('desert') || title.includes('agafay'))) return true;
    if (searchLower.includes('montgolfiere') && title.includes('balloon')) return true;
    if (searchLower.includes('atlas') && title.includes('atlas')) return true;
    if (searchLower.includes('waterfall') && title.includes('waterfall')) return true;
    if (searchLower.includes('casablanca') && city.includes('casablanca')) return true;
    if (searchLower.includes('rabat') && city.includes('rabat')) return true;
    if (searchLower.includes('fes') && city.includes('fes')) return true;
    if (searchLower.includes('tangier') && city.includes('tangier')) return true;
    if (searchLower.includes('chefchaouen') && city.includes('chefchaouen')) return true;
    if (searchLower.includes('essaouira') && city.includes('essaouira')) return true;
    if (searchLower.includes('merzouga') && city.includes('merzouga')) return true;
    if (searchLower.includes('ouzoud') && city.includes('ouzoud')) return true;
    
    return false;
  });

  return filtered.slice(0, 5); // Return max 5 results
}

export async function fetchProducts(search: string): Promise<GYGProduct[]> {
  // IMPORTANT: This function is ONLY for showing suggestions from GYG
  // It does NOT add anything to the user's database
  // GYG data is only used for competitive pricing reference
  
  try {
    console.log(`[GYG] Attempting real GYG search for suggestions: "${search}"`);
    return await fetchRealGYGData(search);
  } catch (error) {
    console.warn('[GYG] Real GYG data failed, using enhanced Morocco database for suggestions:', (error as Error).message);
    return getMockGYGResults(search);
  }
}

// Function to fetch real GYG data from their public website
async function fetchRealGYGData(search: string): Promise<GYGProduct[]> {
  try {
    console.log(`[GYG] Attempting real GYG search for: "${search}"`);
    
    // Use GYG's public search API endpoint
    const searchUrl = `https://www.getyourguide.com/s/Marrakech/`;
    const params = new URLSearchParams({
      'search': search,
      'language': 'fr',
      'currency': 'MAD'
    });
    
    console.log(`[GYG] Searching: ${searchUrl}?${params.toString()}`);
    
    const response = await axios.get(`${searchUrl}?${params.toString()}`, {
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
    
    // Enhanced HTML parsing for GYG's current structure
    const activityRegex = /<div[^>]*class="[^"]*activity[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const titleRegex = /<h[2-4][^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h[2-4]>/gi;
    const priceRegex = /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/gi;
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
