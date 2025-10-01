/**
 * GetYourGuide API Integration
 * Fetches competitor pricing and activity information
 */

export interface GetYourGuideActivity {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  location: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  description: string;
  category: string;
  difficulty: string;
}

export interface GetYourGuideSearchResult {
  activities: GetYourGuideActivity[];
  totalResults: number;
  searchTerm: string;
}

/**
 * Find exact activity match on GetYourGuide
 * This simulates finding the exact same activity by name
 */
export async function findExactGetYourGuideActivity(activityName: string): Promise<GetYourGuideActivity | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Normalize the activity name for matching
  const normalizedName = activityName.toLowerCase().trim();
  
  // Mock database of exact GetYourGuide activities
  const getyourguideActivities: GetYourGuideActivity[] = [
    {
      id: "gyg-1",
      name: "Hot Air Balloon Ride in Marrakech",
      price: 450,
      currency: "MAD",
      duration: "4 hours",
      location: "Marrakech",
      rating: 4.8,
      reviewCount: 1247,
      imageUrl: "https://example.com/balloon.jpg",
      description: "Experience the magic of Marrakech from above with a hot air balloon ride",
      category: "adventure",
      difficulty: "easy"
    },
    {
      id: "gyg-2", 
      name: "Atlas Mountains Day Trip",
      price: 380,
      currency: "MAD",
      duration: "8 hours",
      location: "Atlas Mountains",
      rating: 4.7,
      reviewCount: 892,
      imageUrl: "https://example.com/atlas.jpg",
      description: "Explore the stunning Atlas Mountains with a guided day trip",
      category: "nature",
      difficulty: "medium"
    },
    {
      id: "gyg-3",
      name: "Ouzoud Waterfalls Day Trip",
      price: 320,
      currency: "MAD", 
      duration: "6 hours",
      location: "Ouzoud",
      rating: 4.6,
      reviewCount: 654,
      imageUrl: "https://example.com/ouzoud.jpg",
      description: "Visit the beautiful Ouzoud Waterfalls with a guided tour",
      category: "nature",
      difficulty: "easy"
    },
    {
      id: "gyg-4",
      name: "Essaouira Day Trip",
      price: 280,
      currency: "MAD",
      duration: "10 hours", 
      location: "Essaouira",
      rating: 4.5,
      reviewCount: 423,
      imageUrl: "https://example.com/essaouira.jpg",
      description: "Discover the coastal city of Essaouira on a day trip",
      category: "cultural",
      difficulty: "easy"
    },
    {
      id: "gyg-5",
      name: "Agafay Desert Experience",
      price: 520,
      currency: "MAD",
      duration: "6 hours",
      location: "Agafay Desert",
      rating: 4.9,
      reviewCount: 789,
      imageUrl: "https://example.com/agafay.jpg", 
      description: "Experience the Agafay Desert with camel riding and dinner",
      category: "desert",
      difficulty: "easy"
    },
    {
      id: "gyg-6",
      name: "Ourika Valley Day Trip",
      price: 350,
      currency: "MAD",
      duration: "7 hours",
      location: "Ourika Valley",
      rating: 4.4,
      reviewCount: 567,
      imageUrl: "https://example.com/ourika.jpg",
      description: "Trek through the beautiful Ourika Valley",
      category: "nature", 
      difficulty: "medium"
    },
    {
      id: "gyg-7",
      name: "Montgolfière (Hot Air Balloon)",
      price: 480,
      currency: "MAD",
      duration: "4 hours",
      location: "Marrakech",
      rating: 4.9,
      reviewCount: 1156,
      imageUrl: "https://example.com/montgolfiere.jpg",
      description: "Hot air balloon ride over Marrakech with breakfast",
      category: "adventure",
      difficulty: "easy"
    },
    {
      id: "gyg-8",
      name: "Bahia Palace Tour",
      price: 120,
      currency: "MAD",
      duration: "2 hours",
      location: "Marrakech",
      rating: 4.3,
      reviewCount: 234,
      imageUrl: "https://example.com/bahia.jpg",
      description: "Guided tour of the beautiful Bahia Palace",
      category: "cultural",
      difficulty: "easy"
    },
    {
      id: "gyg-9",
      name: "Majorelle Garden Entry Tickets",
      price: 299,
      currency: "MAD",
      duration: "1 hour",
      location: "Marrakech",
      rating: 4.5,
      reviewCount: 7961,
      imageUrl: "https://example.com/majorelle.jpg",
      description: "Visit the famous Majorelle Garden in Marrakech",
      category: "cultural",
      difficulty: "easy"
    },
    {
      id: "gyg-10",
      name: "Toubkal Mountain Trek",
      price: 650,
      currency: "MAD",
      duration: "2 days",
      location: "Atlas Mountains",
      rating: 4.7,
      reviewCount: 342,
      imageUrl: "https://example.com/toubkal.jpg",
      description: "Trek to the highest peak in North Africa",
      category: "adventure",
      difficulty: "hard"
    }
  ];

  // Create a more intelligent matching function
  const findMatch = (searchTerm: string, activityName: string): boolean => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const normalizedActivity = activityName.toLowerCase().trim();
    
    // Exact match
    if (normalizedSearch === normalizedActivity) {
      return true;
    }
    
    // Direct substring match
    if (normalizedActivity.includes(normalizedSearch) || normalizedSearch.includes(normalizedActivity)) {
      return true;
    }
    
    // Handle common variations and synonyms
    const variations = [
      // Remove common suffixes
      normalizedSearch.replace(/\s+(day\s+trip|tour|experience|ride|trip|visit|explore|discover|adventure|excursion|journey|expedition|trek|hike|walk|safari|cruise|flight|balloon|entry|tickets?)$/i, ''),
      // Remove common prefixes
      normalizedSearch.replace(/^(visit|explore|discover|tour|experience|trip\s+to|day\s+trip\s+to)\s+/i, ''),
      // Handle French/English variations
      normalizedSearch.replace(/montgolfière|montgolfiere/gi, 'hot air balloon'),
      normalizedSearch.replace(/cascades/gi, 'waterfalls'),
      normalizedSearch.replace(/oued/gi, 'valley'),
      normalizedSearch.replace(/palais/gi, 'palace'),
      normalizedSearch.replace(/jardin/gi, 'garden'),
      normalizedSearch.replace(/montagne/gi, 'mountain'),
      normalizedSearch.replace(/désert/gi, 'desert'),
      // Handle specific activity names
      normalizedSearch.replace(/bahia/gi, 'bahia palace'),
      normalizedSearch.replace(/majorelle/gi, 'majorelle garden'),
      normalizedSearch.replace(/toubkal/gi, 'toubkal mountain'),
      normalizedSearch.replace(/atlas/gi, 'atlas mountains'),
      normalizedSearch.replace(/ouzoud/gi, 'ouzoud waterfalls'),
      normalizedSearch.replace(/ourika/gi, 'ourika valley'),
      normalizedSearch.replace(/essaouira/gi, 'essaouira'),
      normalizedSearch.replace(/agafay/gi, 'agafay desert')
    ];
    
    // Check if any variation matches
    return variations.some(variation => {
      if (!variation.trim()) return false;
      
      // Direct match with variation
      if (normalizedActivity.includes(variation) || variation.includes(normalizedActivity)) {
        return true;
      }
      
      // Word-by-word matching for better accuracy
      const searchWords = variation.split(/\s+/).filter(word => word.length > 2);
      const activityWords = normalizedActivity.split(/\s+/).filter(word => word.length > 2);
      
      if (searchWords.length > 0 && activityWords.length > 0) {
        const matchCount = searchWords.filter(searchWord => 
          activityWords.some(activityWord => 
            activityWord.includes(searchWord) || searchWord.includes(activityWord)
          )
        ).length;
        
        // If more than 50% of words match, consider it a match
        return matchCount / searchWords.length >= 0.5;
      }
      
      return false;
    });
  };

  // Find the best match
  const match = getyourguideActivities.find(activity => 
    findMatch(normalizedName, activity.name)
  );

  return match || null;
}

/**
 * Get competitive pricing suggestions based on GetYourGuide prices
 */
export function getCompetitivePricingSuggestions(getyourguidePrice: number): {
  aggressive: number;
  competitive: number;
  premium: number;
  description: string;
} {
  const aggressive = Math.round(getyourguidePrice * 0.85); // 15% below competitor
  const competitive = Math.round(getyourguidePrice * 0.95); // 5% below competitor  
  const premium = Math.round(getyourguidePrice * 1.1); // 10% above competitor

  let description = "";
  if (aggressive < 300) {
    description = "Budget-friendly pricing to attract price-sensitive customers";
  } else if (competitive < 500) {
    description = "Competitive pricing to match market standards";
  } else {
    description = "Premium pricing for high-value experiences";
  }

  return {
    aggressive,
    competitive, 
    premium,
    description
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = "MAD"): string {
  return `${price} ${currency}`;
}
