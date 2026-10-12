#!/usr/bin/env node
// H1/M12: sitemap.xml and robots.txt used to hardcode the original
// developer's own Vercel domain. Vite copies client/public/* verbatim, so
// these two files are generated here, from VITE_SITE_URL, before the public
// build runs. If VITE_SITE_URL is not set, a clearly-labeled placeholder
// domain is written instead of a real (and wrong) owner domain - the
// deployment owner must set VITE_SITE_URL for a correct sitemap/robots.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = (process.env.VITE_SITE_URL || 'https://example.com').replace(/\/+$/, '');
const today = new Date().toISOString().slice(0, 10);

const pages = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/activities', changefreq: 'daily', priority: '0.9' },
  { path: '/booking', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
  .map((p) => `  <url>\n    <loc>${siteUrl}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`)
  .join('\n')}\n</urlset>\n`;

const robots = `# Allow all search engines to crawl\nUser-agent: *\nAllow: /\n\n# Disallow API routes\nDisallow: /api\n\n# Sitemap location\nSitemap: ${siteUrl}/sitemap.xml\n`;

writeFileSync(path.join(clientRoot, 'public', 'sitemap.xml'), sitemap);
writeFileSync(path.join(clientRoot, 'public', 'robots.txt'), robots);
console.log(`[seo] Generated sitemap.xml and robots.txt for ${siteUrl}${process.env.VITE_SITE_URL ? '' : ' (VITE_SITE_URL not set — using placeholder domain)'}`);
