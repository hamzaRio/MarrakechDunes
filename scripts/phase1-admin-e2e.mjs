import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const launcher = spawn(process.execPath, ['scripts/phase1-isolated-launcher.mjs', '--keep-alive'], { stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
launcher.stdout.on('data', (chunk) => { output += chunk.toString(); process.stdout.write(chunk); });
launcher.stderr.on('data', (chunk) => { output += chunk.toString(); process.stderr.write(chunk); });
const waitForPorts = async () => {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const match = output.match(/PASS \(api=(\d+), public=(\d+), admin=(\d+)\)/);
    if (match) return { api: match[1], public: match[2], admin: match[3] };
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`isolated launcher did not become ready${output ? `: ${output.slice(-3000)}` : ''}`);
};
let browser;
try {
  const ports = await waitForPorts();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${ports.admin}/admin/login`, { waitUntil: 'networkidle' });
  await page.locator('input[name="username"], input[type="text"]').first().fill('phase1-launcher-admin');
  await page.locator('input[name="password"], input[type="password"]').first().fill('Phase1-launcher-password-123!');
  await page.locator('form button[type="submit"]').click();
  await page.waitForFunction(() => /\/admin\/(dashboard|$)/.test(window.location.pathname), null, { timeout: 20_000 }).catch(async (error) => {
    const body = (await page.locator('body').innerText()).slice(0, 1200);
    throw new Error(`admin login did not reach dashboard (url=${page.url()}): ${body}\n${error.message}`);
  });
  if (!(await page.getByText(/dashboard|bookings/i).first().isVisible())) throw new Error('admin dashboard shell not visible');
  await page.reload({ waitUntil: 'networkidle' });
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('admin mobile layout overflows viewport');
  console.log('Phase 1 Admin browser smoke: PASS (login, dashboard, refresh, mobile viewport)');
} finally {
  await browser?.close();
  launcher.kill('SIGTERM');
  await new Promise((resolve) => launcher.once('exit', resolve));
}
