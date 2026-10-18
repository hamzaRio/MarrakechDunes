import { spawn } from 'node:child_process';
import { chromium, expect } from '@playwright/test';

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
  await page.locator('input[name="username"], input[type="text"]').first().fill('phase1-launcher-superadmin');
  await page.locator('input[name="password"], input[type="password"]').first().fill('Phase1-launcher-password-123!');
  await page.locator('form button[type="submit"]').click();
  await page.waitForFunction(() => /\/admin\/(dashboard|$)/.test(window.location.pathname), null, { timeout: 20_000 }).catch(async (error) => {
    const body = (await page.locator('body').innerText()).slice(0, 1200);
    throw new Error(`admin login did not reach dashboard (url=${page.url()}): ${body}\n${error.message}`);
  });
  if (!page.url().includes('/admin/dashboard')) throw new Error(`admin dashboard route not reached: ${page.url()}`);
  await page.reload({ waitUntil: 'networkidle' });
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('admin mobile layout overflows viewport');
  await page.getByRole('tab', { name: /activités/i }).click();
  await page.getByRole('button', { name: /add partner/i }).click();
  await page.getByLabel('Name', { exact: true }).fill('Phase 1 Browser Partner');
  await page.getByLabel('Contact name', { exact: true }).fill('Phase 1 Contact');
  await page.getByLabel('Phone', { exact: true }).fill('+212600000099');
  await page.getByLabel('Email', { exact: true }).fill('partner@example.invalid');
  const partnerCreate = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith('/api/admin/partners'));
  const partnerListRefresh = page.waitForResponse((response) => response.request().method() === 'GET' && response.url().endsWith('/api/admin/partners'), { timeout: 25_000 });
  await page.getByRole('button', { name: /^create partner$/i }).click();
  const partnerResponse = await partnerCreate;
  const partnerBody = await partnerResponse.text();
  if (partnerResponse.status() !== 201) throw new Error(`partner creation failed (${partnerResponse.status()}): ${partnerBody.slice(0, 500)}`);
  let partnerPayload; try { partnerPayload = JSON.parse(partnerBody); } catch { throw new Error(`partner creation returned non-JSON: ${partnerBody.slice(0, 500)}`); }
  const partnerId = partnerPayload?._id || partnerPayload?.id;
  if (!partnerId) throw new Error(`partner creation did not return an id: ${partnerBody.slice(0, 500)}`);
  const refreshedPartnersResponse = await partnerListRefresh;
  if (!refreshedPartnersResponse.ok()) throw new Error(`partner list refresh failed (${refreshedPartnersResponse.status()})`);
  const refreshedPartners = await refreshedPartnersResponse.json();
  const refreshedPartner = (Array.isArray(refreshedPartners) ? refreshedPartners : refreshedPartners?.data || [])
    .find((partner) => String(partner._id || partner.id) === String(partnerId));
  if (!refreshedPartner) throw new Error(`created partner ${partnerId} missing from refreshed partner list`);
  if (refreshedPartner.name !== 'Phase 1 Browser Partner') throw new Error(`partner list returned unexpected name for ${partnerId}`);
  const partnerSelect = page.getByLabel(/Partner for Phase 1 Test Desert Tour/i);
  await expect(partnerSelect.locator(`option[value="${partnerId}"]`)).toHaveText('Phase 1 Browser Partner', { timeout: 20_000 });
  const association = page.waitForResponse((response) => response.request().method() === 'PATCH' && response.url().includes('/api/admin/activities/'));
  await partnerSelect.selectOption(String(partnerId));
  const associationResponse = await association;
  if (!associationResponse.ok()) throw new Error(`partner association failed (${associationResponse.status()}): ${(await associationResponse.text()).slice(0, 500)}`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: /activités/i }).click();
  await expect(page.getByLabel(/Partner for Phase 1 Test Desert Tour/i)).toHaveValue(String(partnerId), { timeout: 20_000 });

  // Exercise the real public booking form against the same disposable API.
  const publicPage = await context.newPage();
  publicPage.on('console', (message) => console.log(`[public:${message.type()}] ${message.text()}`));
  publicPage.on('response', (response) => { if (response.url().includes('/api/')) console.log(`[public:response] ${response.status()} ${response.url()}`); });
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
  const bookingPost = publicPage.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith('/api/bookings'));
  const bookingSubmit = publicPage.locator('form button[type="submit"]:visible').last();
  await expect(bookingSubmit).toBeVisible();
  await expect(bookingSubmit).toBeEnabled();
  await bookingSubmit.click();
  const bookingResponse = await bookingPost.catch(async (error) => {
    const diagnostics = (await publicPage.locator('body').innerText()).slice(0, 2000);
    await publicPage.screenshot({ path: 'phase1-admin-e2e-booking-failure.png', fullPage: true }).catch(() => {});
    throw new Error(`booking POST was not observed at ${publicPage.url()}; visible state: ${diagnostics}; ${error.message}`);
  });
  const bookingBody = await bookingResponse.text();
  if (!bookingResponse.ok()) throw new Error(`booking POST failed (${bookingResponse.status()}): ${bookingBody.slice(0, 500)}`);
  let bookingPayload; try { bookingPayload = JSON.parse(bookingBody); } catch { throw new Error(`booking POST returned non-JSON: ${bookingBody.slice(0, 500)}`); }
  const bookingId = bookingPayload?.booking?._id || bookingPayload?.booking?.id || bookingPayload?._id || bookingPayload?.id;
  if (!bookingId) throw new Error(`booking POST did not return a booking id: ${bookingBody.slice(0, 500)}`);
  await publicPage.waitForURL(/confirmation-and-pay/, { timeout: 20_000 }).catch(async (error) => { throw new Error(`booking created (${bookingId}) but confirmation navigation failed at ${publicPage.url()}: ${(await publicPage.locator('body').innerText()).slice(0, 800)}; ${error.message}`); });
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
