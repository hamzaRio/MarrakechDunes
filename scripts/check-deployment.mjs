import fs from 'fs';
import path from 'path';

const API_BASES = (process.env.API_BASES || 'http://localhost:5000,https://your-render-url').split(',');
const SITE_BASES = (process.env.SITE_BASES || 'http://localhost:5173,https://your-vercel-url').split(',');
const REQUIRED_ENV_VARS = ['MONGODB_URI', 'SESSION_SECRET', 'JWT_SECRET', 'CLIENT_URL'];

const API_ENDPOINTS = ['/api/activities', '/api/health'];

const assetsDir = path.resolve(process.cwd(), 'attached_assets');
const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];

async function checkUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`${url} -> ${res.status}`);
    } else {
      console.log(`${url} OK`);
    }
  } catch (err) {
    console.error(`${url} -> ${err.message}`);
  }
}

(async () => {
  for (const base of API_BASES) {
    for (const ep of API_ENDPOINTS) {
      await checkUrl(`${base}${ep}`);
    }
  }

  for (const base of SITE_BASES) {
    for (const file of assetFiles) {
      await checkUrl(`${base}/attached_assets/${file}`);
    }
  }

  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(', ')}`);
  } else {
    console.log('All required environment variables are set');
  }
})();
