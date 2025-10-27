import { Router } from 'express';
import { z } from 'zod';
// Placeholder functions for deleted services
const searchExternalActivities = async (params: { query?: string; city?: string; category?: string; minRating: number }) => {
  // Mock implementation - return empty results
  return [];
};

const getMoroccoCities = () => {
  // Mock implementation
  return ['Marrakech', 'Casablanca', 'Fez', 'Rabat', 'Agadir'];
};

const getActivityCategories = () => {
  // Mock implementation
  return ['Desert Tours', 'City Tours', 'Cultural Experiences', 'Adventure'];
};

const router = Router();

/**
 * Zod schema for external activities search parameters
 */
const searchParamsSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).default(0)
});

/**
 * GET /api/external-activities
 * Search for external activities in Morocco
 * Returns activities from external providers (GetYourGuide, Viator) or mock data
 */
router.get('/', async (req, res) => {
  try {
    // Validate query parameters
    const validationResult = searchParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres de recherche invalides',
        details: validationResult.error.errors
      });
    }

    const { query, city, category, minRating } = validationResult.data;

    console.log(`[EXTERNAL_ACTIVITIES] Search request:`, { query, city, category, minRating });

    // Search external activities
    const activities = await searchExternalActivities({
      query,
      city,
      category,
      minRating
    });

    console.log(`[EXTERNAL_ACTIVITIES] Found ${activities.length} activities`);

    return res.status(200).json({
      success: true,
      data: activities,
      count: activities.length,
      searchParams: { query, city, category, minRating }
    });

  } catch (error) {
    console.error('[EXTERNAL_ACTIVITIES] Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche d\'activités'
    });
  }
});

/**
 * GET /api/external-activities/cities
 * Get list of available Morocco cities
 */
router.get('/cities', (req, res) => {
  try {
    const cities = getMoroccoCities();
    return res.status(200).json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('[EXTERNAL_ACTIVITIES] Cities error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des villes'
    });
  }
});

/**
 * GET /api/external-activities/categories
 * Get list of available activity categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = getActivityCategories();
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('[EXTERNAL_ACTIVITIES] Categories error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des catégories'
    });
  }
});

export default router;
