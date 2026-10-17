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
  page.on('console', (message) => console.log(`[browser:${message.type()}] ${message.text()}`));
  page.on('requestfailed', (request) => console.log(`[browser:requestfailed] ${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', (response) => { if (response.url().includes('/api/')) console.log(`[browser:response] ${response.status()} ${response.url()}`); });
  await page.goto(`http://127.0.0.1:${ports.admin}/admin/login`, { waitUntil: 'networkidle' });
  await page.locator('input[name="username"], input[type="text"]').first().fill('phase1-launcher-admin');
  await page.locator('input[name="password"], input[type="password"]').first().fill('Phase1-launcher-password-123!');
  await page.locator('form button[type="submit"]').click();
  await page.waitForFunction(() => /\/admin\/(dashboard|$)/.test(window.location.pathname), null, { timeout: 20_000 }).catch(async (error) => {
    const body = (await page.locator('body').innerText()).slice(0, 1200);
    throw new Error(`admin login did not reach dashboard (url=${page.url()}): ${body}\n${error.message}`);
  });
  if (!page.url().includes('/admin/dashboard')) throw new Error(`admin dashboard route not reached: ${page.url()}`);
  await page.reload({ waitUntil: 'networkidle' });
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('admin mobile layout overflows viewport');

  // Exercise the real public booking form against the same disposable API.
  const publicPage = await context.newPage();
  const activitiesResponse = await publicPage.request.get(`http://127.0.0.1:${ports.api}/api/activities`);
  if (!activitiesResponse.ok()) throw new Error(`public activities request failed: ${activitiesResponse.status()}`);
  const activities = await activitiesResponse.json();
  const activity = Array.isArray(activities) ? activities[0] : activities.data?.[0];
  if (!activity?.id && !activity?._id) throw new Error('isolated activity fixture missing');
  const activityId = activity.id || activity._id;
  await publicPage.goto(`http://127.0.0.1:${ports.public}/booking?activity=${activityId}`, { waitUntil: 'networkidle' });
  await publicPage.getByRole('button', { name: /continue|next|suivant|continuer/i }).last().click();
  const day = publicPage.locator('button.rdp-day_button:not([disabled])').first();
  if (await day.count()) await day.click();
  await publicPage.getByRole('button', { name: /continue|next|suivant|continuer/i }).last().click();
  await publicPage.locator('input[name="customerName"]').fill('Phase One Customer');
  await publicPage.locator('input[name="customerPhone"]').fill('+212600000001');
  await publicPage.locator('input[name="customerEmail"]').fill('phase1@example.invalid');
  await publicPage.locator('input[name^="participantNames"]').first().fill('Phase One Customer');
  await publicPage.getByRole('button', { name: /continue|next|suivant|continuer/i }).last().click();
  await publicPage.locator('form button[type="submit"]').last().click();
  await publicPage.waitForTimeout(500);
  if (!(await publicPage.locator('body').innerText()).match(/pending|submitted|confirmation|booking/i)) throw new Error('public booking submission did not produce a confirmation state');
  // Re-open the booking in the real Admin reservations UI and exercise the
  // operational controls that are available to staff.
  await page.goto(`http://127.0.0.1:${ports.admin}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: /réservations/i }).click();
  await page.getByText('Phase One Customer', { exact: true }).waitFor({ timeout: 20_000 });
  const bookingCard = page.getByText('Phase One Customer', { exact: true }).locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
  await bookingCard.getByRole('button', { name: /détails/i }).click();
  await page.getByText('Partner coordination', { exact: true }).waitFor();
  const availability = page.getByLabel('Partner availability');
  if (!(await availability.count())) throw new Error('partner availability control missing from booking drawer');
  await availability.selectOption('AVAILABLE');
  const confirmation = page.getByRole('button', { name: /^Confirmer$/i }).first();
  if (!(await confirmation.isDisabled())) throw new Error('confirmation was enabled before payment');
  await page.getByRole('button', { name: /gérer le paiement/i }).click();
  await page.getByText('Type de Paiement').waitFor();
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /acompte/i }).click();
  await page.getByLabel('Montant (MAD)').fill('100');
  await page.getByRole('button', { name: /mettre à jour le paiement/i }).click();
  await page.getByText('Partner coordination', { exact: true }).waitFor();
  await page.getByRole('button', { name: /^Confirmer$/i }).first().click();
  await page.getByText('CONFIRMED', { exact: true }).waitFor();
  await page.getByLabel('Pickup location').fill('Marrakech Medina');
  await page.getByLabel('Pickup location').blur();
  await page.getByLabel('Return arrangements').fill('Return to hotel');
  await page.getByLabel('Return arrangements').blur();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('Phase One Customer', { exact: true }).waitFor();
  await page.getByRole('button', { name: /détails/i }).click();
  await page.getByLabel('Pickup location').waitFor();
  if (await page.getByLabel('Pickup location').inputValue() !== 'Marrakech Medina') throw new Error('pickup detail did not persist');
  if (await page.getByLabel('Return arrangements').inputValue() !== 'Return to hotel') throw new Error('return detail did not persist');
  console.log('Phase 1 Admin/public browser workflow: PASS (login, booking UI, reservation drawer, partner availability, payment gate, confirmation, transport persistence, mobile viewport)');
} finally {
  await browser?.close();
  launcher.kill('SIGTERM');
  await new Promise((resolve) => launcher.once('exit', resolve));
}
