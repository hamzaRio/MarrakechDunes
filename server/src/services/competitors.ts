import axios from 'axios';
import removeAccents from 'remove-accents';

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
  rating?: number; reviewsCount?: number; provider: 'GetYourGuide'|'Viator'|'Mock';
  providerUrl?: string;
};

export async function searchExternalActivities(query: string, city?: string): Promise<ExternalActivity[]> {
  const key = `gyg:${query}:${city || ''}`;
  const hit = getCached(key);
  if (hit) return hit;

  const items: ExternalActivity[] = [];

  const q = [query, city, 'Morocco'].filter(Boolean).join(' ').trim();

  // Live provider (optional)
  const base = process.env.GYG_SUPPLIER_BASE;
  const user = process.env.GYG_SUPPLIER_USER;
  const pass = process.env.GYG_SUPPLIER_PASS;
  const live = process.env.GYG_ENABLE_LIVE_SEARCH === 'true';

  try {
    if (base && user && pass && live) {
      // NOTE: replace endpoint if your supplier API differs.
      const r = await axios.get(`${base}/search/products`, {
        auth: { username: user, password: pass },
        params: { q, country: 'MA', limit: 10 }
      });

      const list = (r.data?.items ?? r.data ?? []).slice(0, 10);
      for (const x of list) {
        const title = x.title || x.name;
        const loc = x.city || x.location || '';
        const price = x.price?.amount || x.price || 0;
        const cur = x.price?.currency || 'MAD';
        const priceMAD = cur === 'MAD' ? price : Math.round(price * 10); // naive fx fallback
        const durationText = x.duration_text || x.duration || '';
        const providerUrl = x.url || x.product_url;

        if (city && !inMoroccoCity(loc)) continue;

        items.push({
          title,
          city: loc || city || 'Maroc',
          priceMAD: Math.max(0, priceMAD),
          durationText: durationText || '—',
          rating: x.rating || x.average_rating,
          reviewsCount: x.reviews_count || x.num_reviews,
          provider: 'GetYourGuide',
          providerUrl
        });
      }
    }
  } catch {
    // ignore; fallback to mock
  }

  // Fallback mock (Morocco curated)
  if (items.length === 0) {
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
    items.push(...(filtered.length ? filtered : MOCK));
  }

  setCached(key, items);
  return items;
}
