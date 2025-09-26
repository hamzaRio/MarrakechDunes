import { useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export default function SEOHead({ 
  title,
  description,
  keywords,
  image,
  url,
  type = 'website'
}: SEOHeadProps) {
  const { language } = useLanguage();

  useEffect(() => {
    // Base site information
    const siteName = 'MarrakechDunes';
    const baseUrl = 'https://marrakech-dunes.vercel.app';
    const defaultImage = `${baseUrl}/images/riad-kheirredine_1756041288677.jpg`;
    
    // Construct full title
    const fullTitle = title 
      ? `${title} | ${siteName}` 
      : `${siteName} - Authentic Moroccan Desert Adventures`;
    
    // Default description based on language
    const defaultDescription = language === 'fr' 
      ? 'Découvrez des aventures authentiques dans le désert marocain avec MarrakechDunes. Réservez des expériences inoubliables à Marrakech, Agafay, Essaouira et plus.'
      : 'Discover authentic Moroccan desert adventures with MarrakechDunes. Book unforgettable experiences in Marrakech, Agafay, Essaouira and more.';
    
    const defaultKeywords = language === 'fr'
      ? 'Marrakech, désert, aventures, Maroc, voyage, réservation, Agafay, Essaouira, montgolfière, excursions'
      : 'Marrakech, desert, adventures, Morocco, travel, booking, Agafay, Essaouira, hot air balloon, excursions';

    // Update document title
    document.title = fullTitle;

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      let tag = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Update meta tags
    updateMetaTag('description', description || defaultDescription);
    updateMetaTag('keywords', keywords || defaultKeywords);
    updateMetaTag('language', language);
    
    // Open Graph tags
    updateMetaTag('og:title', fullTitle, 'property');
    updateMetaTag('og:description', description || defaultDescription, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:url', url || baseUrl, 'property');
    updateMetaTag('og:image', image || defaultImage, 'property');
    updateMetaTag('og:site_name', siteName, 'property');
    updateMetaTag('og:locale', language === 'fr' ? 'fr_FR' : 'en_US', 'property');
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description || defaultDescription);
    updateMetaTag('twitter:image', image || defaultImage);
    
    // Additional SEO tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url || baseUrl);

  }, [title, description, keywords, image, url, type, language]);

  return null; // This component doesn't render anything
}

// Predefined SEO configurations for each page
export const seoConfigs = {
  home: (language: string) => ({
    title: language === 'fr' ? 'Accueil' : 'Home',
    description: language === 'fr' 
      ? 'Découvrez des aventures authentiques dans le désert marocain. Réservez des expériences inoubliables à Marrakech, excursions dans le désert d\'Agafay, vols en montgolfière et visites d\'Essaouira.'
      : 'Discover authentic Moroccan desert adventures. Book unforgettable experiences in Marrakech, Agafay desert excursions, hot air balloon rides and Essaouira day trips.',
    keywords: language === 'fr'
      ? 'Marrakech aventures, désert Agafay, montgolfière Marrakech, Essaouira excursion, voyage Maroc, réservation tours'
      : 'Marrakech adventures, Agafay desert, Marrakech hot air balloon, Essaouira day trip, Morocco travel, tour booking'
  }),
  
  activities: (language: string) => ({
    title: language === 'fr' ? 'Nos Activités' : 'Our Activities',
    description: language === 'fr'
      ? 'Explorez notre collection d\'activités authentiques au Maroc. Du désert d\'Agafay aux cascades d\'Ouzoud, découvrez les meilleures expériences que le Maroc a à offrir.'
      : 'Explore our collection of authentic activities in Morocco. From Agafay desert to Ouzoud waterfalls, discover the best experiences Morocco has to offer.',
    keywords: language === 'fr'
      ? 'activités Marrakech, excursions Maroc, désert Agafay, cascades Ouzoud, montgolfière, Essaouira'
      : 'Marrakech activities, Morocco excursions, Agafay desert, Ouzoud waterfalls, hot air balloon, Essaouira'
  }),
  
  booking: (language: string) => ({
    title: language === 'fr' ? 'Réserver une Aventure' : 'Book Your Adventure',
    description: language === 'fr'
      ? 'Réservez facilement votre aventure marocaine. Processus de réservation simple et sécurisé pour toutes nos expériences authentiques au Maroc.'
      : 'Easily book your Moroccan adventure. Simple and secure booking process for all our authentic experiences in Morocco.',
    keywords: language === 'fr'
      ? 'réservation Marrakech, book tour Maroc, réserver excursion, paiement cash Marrakech'
      : 'Marrakech booking, book Morocco tour, reserve excursion, cash payment Marrakech'
  }),
  
  reviews: (language: string) => ({
    title: language === 'fr' ? 'Avis Clients' : 'Customer Reviews',
    description: language === 'fr'
      ? 'Lisez les avis de nos clients satisfaits. Découvrez pourquoi MarrakechDunes est le choix préféré pour des aventures authentiques au Maroc.'
      : 'Read reviews from our satisfied customers. Discover why MarrakechDunes is the preferred choice for authentic adventures in Morocco.',
    keywords: language === 'fr'
      ? 'avis MarrakechDunes, témoignages clients, reviews Marrakech tours, expériences authentiques'
      : 'MarrakechDunes reviews, customer testimonials, Marrakech tour reviews, authentic experiences'
  }),
  
  admin: (language: string) => ({
    title: language === 'fr' ? 'Administration' : 'Admin Portal',
    description: language === 'fr'
      ? 'Portail d\'administration MarrakechDunes pour la gestion des réservations et des activités.'
      : 'MarrakechDunes admin portal for managing bookings and activities.',
    keywords: 'admin, dashboard, management'
  }),
  
  contact: (language: string) => ({
    title: language === 'fr' ? 'Contact' : 'Contact Us',
    description: language === 'fr'
      ? 'Contactez MarrakechDunes pour vos questions sur nos aventures au Maroc. Notre équipe locale est là pour vous aider.'
      : 'Contact MarrakechDunes for questions about our Morocco adventures. Our local team is here to help you.',
    keywords: language === 'fr'
      ? 'contact MarrakechDunes, questions Marrakech tours, aide réservation, support client'
      : 'contact MarrakechDunes, Marrakech tour questions, booking help, customer support'
  })
};
