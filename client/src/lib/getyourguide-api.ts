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
 * Search for activities on GetYourGuide
 * This is a mock implementation - in production, you would use GetYourGuide's API
 */
export async function searchGetYourGuideActivities(searchTerm: string): Promise<GetYourGuideSearchResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock data based on common Marrakech activities
  const mockActivities: GetYourGuideActivity[] = [
    {
      id: "1",
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
      id: "2", 
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
      id: "3",
      name: "Ouzoud Waterfalls Tour",
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
      id: "4",
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
      id: "5",
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
      id: "6",
      name: "Ourika Valley Trekking",
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
    }
  ];

  // Filter activities based on search term
  const filteredActivities = mockActivities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    activities: filteredActivities,
    totalResults: filteredActivities.length,
    searchTerm
  };
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
