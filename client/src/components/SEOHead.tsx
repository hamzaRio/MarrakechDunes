import { Helmet, HelmetProvider } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEOHead({
  title = 'MarrakechDunes - Authentic Desert Adventures & Tours',
  description = 'Book authentic Marrakech desert tours, hot air balloon rides, camel rides, Atlas Mountains trips, and Agafay Desert experiences. Professional guides, competitive prices, instant confirmation.',
  keywords = 'Marrakech tours, desert tours, camel rides, hot air balloon Marrakech, Agafay Desert, Atlas Mountains, Ouzoud waterfalls, quad biking, Morocco adventures, Essaouira day trip',
  image = 'https://marrakech-dunes.vercel.app/images/riad-kheirredine_1756041288677.jpg',
  url = 'https://marrakech-dunes.vercel.app',
  type = 'website'
}: SEOHeadProps) {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English, French" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="MarrakechDunes" />
      
      {/* Geo Tags */}
      <meta name="geo.region" content="MA-MAR" />
      <meta name="geo.placename" content="Marrakech" />
      <meta name="geo.position" content="31.628746;-7.988845" />
      <meta name="ICBM" content="31.628746, -7.988845" />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}

export { HelmetProvider };
