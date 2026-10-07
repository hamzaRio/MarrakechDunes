import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const root = join(process.cwd(), 'client');
const requests = [];
const api = createServer((req, res) => {
  requests.push(req.url);
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:4173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(req.url?.includes('/activities') ? [] : {}));
});
const web = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  const file = pathname === '/' || !extname(pathname) ? join(root, 'dist', 'index.html') : join(root, 'dist', pathname);
  try {
    const body = await readFile(file);
    const types = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' http://127.0.0.1:18080; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    res.end(body);
  } catch { res.statusCode = 404; res.end('Not found'); }
});

await new Promise((resolve) => api.listen(18080, '127.0.0.1', resolve));
await new Promise((resolve) => web.listen(4173, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('http://127.0.0.1:4173/activities', { waitUntil: 'networkidle' });
  console.log({ requests, consoleErrors });
  if (!await page.locator('#root').count()) throw new Error('Public root did not render');
  if (!requests.some((url) => url?.includes('/activities'))) throw new Error(`Configured API origin was not requested: ${requests.join(',')}`);
  if (consoleErrors.some((message) => /CSP|unsafe-eval|blocked/i.test(message) && !/frame-ancestors.*meta/i.test(message))) throw new Error(consoleErrors.join('\n'));
  console.log('Chromium public portability/CSP harness: PASS');
} finally {
  await browser.close();
  await new Promise((resolve) => web.close(resolve));
  await new Promise((resolve) => api.close(resolve));
}
