export const buildGYGSearchUrl = ({
  q,
  city,
  lang = 'en-gb',
  currency = 'MAD',
}: { q: string; city?: string; lang?: string; currency?: string }) => {
  const term = encodeURIComponent([q?.trim(), city?.trim()].filter(Boolean).join(' '));
  return `https://www.getyourguide.com/${lang}/s/?q=${term}&currency=${currency}`;
};

const MOROCCO_LID = 'morocco-l169'; // stable country landing id; if broken, caller should fallback to search
export const buildGYGCountryUrl = (lang = 'en-gb') =>
  `https://www.getyourguide.com/${lang}/${MOROCCO_LID}/`;
