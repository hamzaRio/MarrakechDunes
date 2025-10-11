/**
 * Tour Search Service for Morocco
 * Provides external activity search with fallback to mock data
 */

export interface ExternalActivity {
  title: string;
  city: string;
  category?: string;
  priceMAD: number;
  durationText: string;
  rating?: number;
  reviewsCount?: number;
  provider: 'GetYourGuide' | 'Viator' | 'Mock';
  providerUrl?: string;
}

/**
 * Morocco cities for validation
 */
const MOROCCO_CITIES = [
  'Marrakech', 'Casablanca', 'Fès', 'Rabat', 'Tanger', 'Essaouira', 
  'Ouarzazate', 'Agafay', 'Ouzoud', 'Chefchaouen', 'Meknès', 'Tétouan',
  'Safi', 'Mohammédia', 'Khénifra', 'Beni Mellal', 'Errachidia'
];

/**
 * Mock activities for Morocco (high-quality fallback)
 */
const MOCK_ACTIVITIES: ExternalActivity[] = [
  {
    title: 'Visite de la Médina de Marrakech',
    city: 'Marrakech',
    category: 'Culture',
    priceMAD: 250,
    durationText: '3 heures',
    rating: 4.8,
    reviewsCount: 1240,
    provider: 'Mock',
    providerUrl: 'https://www.getyourguide.com/marrakech'
  },
  {
    title: 'Excursion Désert d\'Agafay',
    city: 'Agafay',
    category: 'Désert',
    priceMAD: 450,
    durationText: '8 heures',
    rating: 4.9,
    reviewsCount: 890,
    provider: 'Mock',
    providerUrl: 'https://www.getyourguide.com/agafay'
  },
  {
    title: 'Cascades d\'Ouzoud',
    city: 'Ouzoud',
    category: 'Nature',
    priceMAD: 380,
    durationText: '10 heures',
    rating: 4.7,
    reviewsCount: 650,
    provider: 'Mock',
    providerUrl: 'https://www.getyourguide.com/ouzoud'
  },
  {
    title: 'Chefchaouen - Ville Bleue',
    city: 'Chefchaouen',
    category: 'Culture',
    priceMAD: 320,
    durationText: '12 heures',
    rating: 4.6,
    reviewsCount: 420,
    provider: 'Mock',
    providerUrl: 'https://www.getyourguide.com/chefchaouen'
  },
  {
    title: 'Essaouira - Cité des Alizés',
    city: 'Essaouira',
    category: 'Plage',
    priceMAD: 280,
    durationText: '8 heures',
    rating: 4.5,
    reviewsCount: 780,
    provider: 'Mock',
    providerUrl: 'https://www.getyourguide.com/essaouira'
  },
  {
    title: 'Atlas Mountains Trek',
    city: 'Ouarzazate',
    category: 'Montagnes',
    priceMAD: 520,
    durationText: '2 jours',
    rating: 4.8,
    reviewsCount: 340,
    provider: 'Mock',
    providerUrl: 'https://www.getyourguide.com/atlas'
  },
  {
    title: 'Cooking Class Tagine',
    city: 'Marrakech',
    category: 'Gastronomie',
    priceMAD: 180,
    durationText: '3 heures',
    rating: 4.7,
    reviewsCount: 560,
    provider: 'Mock',
    providerUrl: 'https://www.getyourguide.com/cooking'
  },
  {
    title: 'Hammam Traditionnel',
    city: 'Fès',
    category: 'Bien-être',
    priceMAD: 150,
    durationText: '2 heures',
    rating: 4.6,
    reviewsCount: 320,
    provider: 'Mock',
    providerUrl: 'https://www.getyourguide.com/hammam'
  }
];

/**
 * Search external activities in Morocco
 * @param params - Search parameters
 * @returns Promise<ExternalActivity[]> - Array of external activities
 */
export async function searchExternalActivities(params: {
  query?: string;
  city?: string;
  category?: string;
  minRating?: number;
}): Promise<ExternalActivity[]> {
  try {
    console.log('[TOUR_SEARCH] Searching external activities:', params);

    // Apply Morocco filter - only return activities from Morocco cities
    let results = MOCK_ACTIVITIES.filter(activity => 
      MOROCCO_CITIES.includes(activity.city)
    );

    // Filter by city if specified
    if (params.city && MOROCCO_CITIES.includes(params.city)) {
      results = results.filter(activity => 
        activity.city.toLowerCase() === params.city!.toLowerCase()
      );
    }

    // Filter by category if specified
    if (params.category) {
      results = results.filter(activity => 
        activity.category?.toLowerCase().includes(params.category!.toLowerCase())
      );
    }

    // Filter by query if specified
    if (params.query) {
      const queryLower = params.query.toLowerCase();
      results = results.filter(activity => 
        activity.title.toLowerCase().includes(queryLower) ||
        activity.city.toLowerCase().includes(queryLower)
      );
    }

    // Filter by minimum rating
    const minRating = params.minRating || 0;
    results = results.filter(activity => 
      (activity.rating || 0) >= minRating
    );

    // Sort by rating (highest first)
    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    console.log(`[TOUR_SEARCH] Found ${results.length} activities in Morocco`);
    return results;

  } catch (error) {
    console.error('[TOUR_SEARCH] Error searching external activities:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Get available Morocco cities
 * @returns string[] - Array of Morocco city names
 */
export function getMoroccoCities(): string[] {
  return [...MOROCCO_CITIES];
}

/**
 * Get available activity categories
 * @returns string[] - Array of activity categories
 */
export function getActivityCategories(): string[] {
  return [
    'Culture', 'Désert', 'Nature', 'Plage', 'Montagnes', 
    'Gastronomie', 'Bien-être', 'Aventure', 'Ville'
  ];
}
