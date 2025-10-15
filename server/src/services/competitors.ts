import axios from 'axios';
import removeAccents from 'remove-accents';
import { searchRezdy } from './providers/rezdy.js';
import { fetchProducts, GYGError } from './gyg.js';
import { ENV } from '../config/env.js';

// Simple cache implementation
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function getCached(key: string) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key: string, data: any) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
  // Simple cleanup - remove oldest entries if cache gets too large
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

const MOROCCO_CITIES = [
  'marrakech','casablanca','fès','fes','rabat','tanger','essaouira',
  'agafay','ouarzazate','ouzoud','chefchaouen','agadir','merzouga',
  'meknès','oujda','kénitra','tétouan','safi','mohammedia','khouribga',
  'beni mellal','el jadida','taza','nador','settat','larache','ksar el kebir'
];

function inMoroccoCity(city?: string) {
  if (!city) return false;
  const c = removeAccents(city).toLowerCase();
  return MOROCCO_CITIES.some(x => c.includes(removeAccents(x).toLowerCase()));
}

export type ExternalActivity = {
  title: string; city: string; priceMAD: number; durationText: string;
  rating?: number; reviewsCount?: number; provider: 'GetYourGuide'|'Viator'|'Mock'|'Rezdy';
  providerUrl?: string;
};

// FX helper with 24h cache
const fxCache = new Map<string, { rate: number; expires: number }>();
const FX_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

async function getFxToMAD(code: 'USD'|'EUR'|'MAD'): Promise<number> {
  if (code === 'MAD') return 1;
  
  const cacheKey = `fx:${code}:MAD`;
  const cached = fxCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return cached.rate;
  }

  try {
    const response = await axios.get(`https://api.exchangerate.host/latest?base=${code}&symbols=MAD`, { timeout: 5000 });
    const rate = response.data?.rates?.MAD;
    if (rate && rate > 0) {
      fxCache.set(cacheKey, { rate, expires: Date.now() + FX_CACHE_TTL });
      return rate;
    }
  } catch (error) {
    console.warn(`FX API failed for ${code}→MAD:`, error);
  }

  // Fallback rates
  const fallbackRates = { USD: 10.0, EUR: 11.0 };
  const fallbackRate = fallbackRates[code] || 10.0;
  fxCache.set(cacheKey, { rate: fallbackRate, expires: Date.now() + FX_CACHE_TTL });
  return fallbackRate;
}

export async function searchExternalActivities(
  query: string, 
  city?: string, 
  provider: 'all'|'gyg'|'rezdy' = 'all',
  limit: number = 20,
  live: boolean = false
): Promise<ExternalActivity[]> {
  const key = `${provider}:${query}:${city || ''}:${limit}`;
  const hit = getCached(key);
  if (hit) return hit;

  const items: ExternalActivity[] = [];
  const q = [query, city, 'Morocco'].filter(Boolean).join(' ').trim();

  // Get GYG results if requested
  if (provider === 'all' || provider === 'gyg') {
    const shouldUseGYG = live || process.env.GYG_ENABLE_LIVE_SEARCH === 'true';
    
    if (shouldUseGYG) {
      try {
        const searchQuery = city ? `${query} ${city}`.trim() : query;
        console.log(`[COMPETITORS] Calling GYG with query: "${searchQuery}", live: ${live}`);
        const gygResults = await fetchProducts(searchQuery);
        
        console.log(`[COMPETITORS] GYG returned ${gygResults.length} results`);
        
        if (gygResults.length === 0 && live) {
          // If live=true and GYG returns 0 items, return empty (no fallback)
          console.log(`[COMPETITORS] Live mode with 0 results - returning empty array`);
          setCached(key, []);
          return [];
        }
        
        const normalizedResults = gygResults.map(item => ({
          title: item.title,
          city: item.city,
          priceMAD: item.currency === 'MAD' ? item.price : item.price,
          durationText: item.durationText,
          rating: undefined,
          reviewsCount: undefined,
          provider: item.provider as 'GetYourGuide',
          providerUrl: item.providerUrl
        }));
        items.push(...normalizedResults);
        console.log(`[COMPETITORS] Added ${normalizedResults.length} GYG results`);
      } catch (error) {
        if (error instanceof GYGError) {
          console.warn(`[GYG] ${error.code}: ${error.message}`);
        } else {
          console.warn('[GYG] Search failed:', (error as Error).message);
        }
        
        // Only fall back to mock if not in live mode
        if (!live) {
          console.log(`[COMPETITORS] Falling back to mock data (not in live mode)`);
          // Fall back to mock data
          const mockResults = getMockMoroccoActivities();
          items.push(...mockResults.slice(0, limit));
        } else {
          console.log(`[COMPETITORS] Live mode - no fallback, returning empty array`);
        }
      }
    } else {
      console.log(`[COMPETITORS] GYG disabled - using mock data`);
      // Use mock data when GYG is disabled
      const mockResults = getMockMoroccoActivities();
      items.push(...mockResults.slice(0, limit));
    }
  }

  // Get Rezdy results if requested
  if (provider === 'all' || provider === 'rezdy') {
    try {
      const rezdyResults = await getRezdyResults(query, city, limit);
      items.push(...rezdyResults);
    } catch (error) {
      console.warn('Rezdy search failed:', error);
    }
  }

  // Fallback to mock if no results
  if (items.length === 0) {
    const mockResults = getMockResults(q, city);
    items.push(...mockResults);
  }

  // Process and normalize results
  const processedItems = await processAndNormalizeItems(items, city);
  
  setCached(key, processedItems);
  return processedItems;
}

// GYG integration moved to dedicated gyg.ts service

async function getRezdyResults(query: string, city?: string, limit: number = 20): Promise<ExternalActivity[]> {
  const rezdyItems = await searchRezdy({ query, city, limit });
  const results: ExternalActivity[] = [];

  for (const item of rezdyItems) {
    // Convert currency to MAD
    const fxRate = await getFxToMAD(item.currency as 'USD'|'EUR'|'MAD');
    const priceMAD = Math.round(item.price * fxRate);

    // Filter by Morocco cities
    if (city && !inMoroccoCity(item.city)) continue;

    results.push({
      title: item.title,
      city: item.city || city || 'Maroc',
      priceMAD: Math.max(0, priceMAD),
      durationText: item.durationText,
      rating: item.rating,
      reviewsCount: item.reviewsCount,
      provider: 'Rezdy',
      providerUrl: item.providerUrl
    });
  }

  return results;
}

function getMockMoroccoActivities(): ExternalActivity[] {
  return [
    // Marrakech Activities
    { title:'Marrakech City Tour', city:'Marrakech', priceMAD:180, durationText:'4 heures', rating:4.5, reviewsCount:120, provider:'Mock' },
    { title:'Agafay Desert Day Trip', city:'Marrakech', priceMAD:520, durationText:'8 heures', rating:4.8, reviewsCount:89, provider:'Mock' },
    { title:'Hot Air Balloon Ride', city:'Marrakech', priceMAD:650, durationText:'3 heures', rating:4.9, reviewsCount:156, provider:'Mock' },
    { title:'Atlas Mountains Trek', city:'Marrakech', priceMAD:380, durationText:'6 heures', rating:4.7, reviewsCount:203, provider:'Mock' },
    { title:'Souk Shopping Tour', city:'Marrakech', priceMAD:120, durationText:'3 heures', rating:4.3, reviewsCount:67, provider:'Mock' },
    
    // Desert & Adventure
    { title:'Merzouga Desert Safari', city:'Merzouga', priceMAD:800, durationText:'2 jours', rating:4.9, reviewsCount:312, provider:'Mock' },
    { title:'Zagora Desert Tour', city:'Zagora', priceMAD:450, durationText:'1 jour', rating:4.6, reviewsCount:145, provider:'Mock' },
    { title:'Camel Trekking', city:'Merzouga', priceMAD:350, durationText:'4 heures', rating:4.7, reviewsCount:98, provider:'Mock' },
    
    // Coastal Cities
    { title:'Essaouira Day Trip', city:'Essaouira', priceMAD:200, durationText:'9 heures', rating:4.7, reviewsCount:178, provider:'Mock' },
    { title:'Agadir Beach Tour', city:'Agadir', priceMAD:180, durationText:'6 heures', rating:4.4, reviewsCount:134, provider:'Mock' },
    { title:'Casablanca City Tour', city:'Casablanca', priceMAD:150, durationText:'4 heures', rating:4.2, reviewsCount:89, provider:'Mock' },
    
    // Northern Cities
    { title:'Chefchaouen Day Trip', city:'Chefchaouen', priceMAD:400, durationText:'12 heures', rating:4.8, reviewsCount:267, provider:'Mock' },
    { title:'Fes Cultural Tour', city:'Fes', priceMAD:220, durationText:'6 heures', rating:4.6, reviewsCount:156, provider:'Mock' },
    { title:'Rabat Capital Tour', city:'Rabat', priceMAD:160, durationText:'4 heures', rating:4.3, reviewsCount:78, provider:'Mock' },
    
    // Waterfalls & Nature
    { title:'Ouzoud Waterfalls Tour', city:'Ouzoud', priceMAD:450, durationText:'10 heures', rating:4.6, reviewsCount:189, provider:'Mock' },
    { title:'Ourika Valley Day Trip', city:'Ourika', priceMAD:280, durationText:'8 heures', rating:4.5, reviewsCount:123, provider:'Mock' },
    
    // Cultural & Historical
    { title:'Ait Ben Haddou Tour', city:'Ouarzazate', priceMAD:320, durationText:'10 heures', rating:4.7, reviewsCount:145, provider:'Mock' },
    { title:'Volubilis Roman Ruins', city:'Meknes', priceMAD:200, durationText:'6 heures', rating:4.4, reviewsCount:67, provider:'Mock' }
  ];
}

function getMockResults(q: string, city?: string): ExternalActivity[] {
  const MOCK: ExternalActivity[] = [
    // Marrakech Activities
    { title:'Marrakech City Tour', city:'Marrakech', priceMAD:180, durationText:'4 heures', rating:4.5, reviewsCount:120, provider:'Mock' },
    { title:'Agafay Desert Day Trip', city:'Marrakech', priceMAD:520, durationText:'8 heures', rating:4.8, reviewsCount:89, provider:'Mock' },
    { title:'Hot Air Balloon Ride', city:'Marrakech', priceMAD:650, durationText:'3 heures', rating:4.9, reviewsCount:156, provider:'Mock' },
    { title:'Atlas Mountains Trek', city:'Marrakech', priceMAD:380, durationText:'6 heures', rating:4.7, reviewsCount:203, provider:'Mock' },
    { title:'Souk Shopping Tour', city:'Marrakech', priceMAD:120, durationText:'3 heures', rating:4.3, reviewsCount:67, provider:'Mock' },
    
    // Desert & Adventure
    { title:'Merzouga Desert Safari', city:'Merzouga', priceMAD:800, durationText:'2 jours', rating:4.9, reviewsCount:312, provider:'Mock' },
    { title:'Zagora Desert Tour', city:'Zagora', priceMAD:450, durationText:'1 jour', rating:4.6, reviewsCount:145, provider:'Mock' },
    { title:'Camel Trekking', city:'Merzouga', priceMAD:350, durationText:'4 heures', rating:4.7, reviewsCount:98, provider:'Mock' },
    
    // Coastal Cities
    { title:'Essaouira Day Trip', city:'Essaouira', priceMAD:200, durationText:'9 heures', rating:4.7, reviewsCount:178, provider:'Mock' },
    { title:'Agadir Beach Tour', city:'Agadir', priceMAD:180, durationText:'6 heures', rating:4.4, reviewsCount:134, provider:'Mock' },
    { title:'Casablanca City Tour', city:'Casablanca', priceMAD:150, durationText:'4 heures', rating:4.2, reviewsCount:89, provider:'Mock' },
    
    // Northern Cities
    { title:'Chefchaouen Day Trip', city:'Chefchaouen', priceMAD:400, durationText:'12 heures', rating:4.8, reviewsCount:267, provider:'Mock' },
    { title:'Fes Cultural Tour', city:'Fes', priceMAD:220, durationText:'6 heures', rating:4.6, reviewsCount:156, provider:'Mock' },
    { title:'Rabat Capital Tour', city:'Rabat', priceMAD:160, durationText:'4 heures', rating:4.3, reviewsCount:78, provider:'Mock' },
    
    // Waterfalls & Nature
    { title:'Ouzoud Waterfalls Tour', city:'Ouzoud', priceMAD:450, durationText:'10 heures', rating:4.6, reviewsCount:189, provider:'Mock' },
    { title:'Ourika Valley Day Trip', city:'Ourika', priceMAD:280, durationText:'8 heures', rating:4.5, reviewsCount:123, provider:'Mock' },
    
    // Cultural & Historical
    { title:'Ait Ben Haddou Tour', city:'Ouarzazate', priceMAD:320, durationText:'10 heures', rating:4.7, reviewsCount:145, provider:'Mock' },
    { title:'Volubilis Roman Ruins', city:'Meknes', priceMAD:200, durationText:'6 heures', rating:4.4, reviewsCount:67, provider:'Mock' }
  ];

  const qn = removeAccents(q).toLowerCase();
  const filtered = MOCK.filter(x => {
    const t = removeAccents(x.title).toLowerCase();
    const c = removeAccents(x.city).toLowerCase();
    const okCity = city ? c.includes(removeAccents(city).toLowerCase()) : true;
    return okCity && (t.includes(qn) || qn.split(' ').every(w => t.includes(w)));
  });

  return filtered.length ? filtered : MOCK;
}

async function processAndNormalizeItems(items: ExternalActivity[], city?: string): Promise<ExternalActivity[]> {
  // Filter by Morocco cities
  const moroccoFiltered = items.filter(item => 
    !city || inMoroccoCity(item.city)
  );

  // Dedupe by normalized title+city
  const seen = new Set<string>();
  const deduped = moroccoFiltered.filter(item => {
    const key = `${removeAccents(item.title).toLowerCase()}-${removeAccents(item.city).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Rank by rating desc, price asc, title fuzzy match
  return deduped.sort((a, b) => {
    // Rating (desc)
    if (a.rating && b.rating && a.rating !== b.rating) {
      return b.rating - a.rating;
    }
    // Price (asc)
    if (a.priceMAD !== b.priceMAD) {
      return a.priceMAD - b.priceMAD;
    }
    // Title length (shorter first)
    return a.title.length - b.title.length;
  });
}
