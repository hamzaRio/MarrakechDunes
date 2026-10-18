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
  const uniqueLetters = crypto.randomUUID().replace(/[^a-z]/gi, '').slice(0, 8);
  const testCustomerName = `Phase One Customer ${uniqueLetters}`;
  const testCustomerEmail = `phase1-${Date.now()}@example.invalid`;
  publicPage.on('console', (message) => console.log(`[public:${message.type()}] ${message.text()}`));
  publicPage.on('response', (response) => { if (response.url().includes('/api/')) console.log(`[public:response] ${response.status()} ${response.url()}`); });
  const activitiesResponse = await publicPage.request.get(`http://127.0.0.1:${ports.api}/api/activities`);
  if (!activitiesResponse.ok()) throw new Error(`public activities request failed: ${activitiesResponse.status()}`);
  const activities = await activitiesResponse.json();
  const activity = Array.isArray(activities) ? activities[0] : activities.data?.[0];
  if (!activity?.id && !activity?._id) throw new Error('isolated activity fixture missing');
  const activityId = activity.id || activity._id;
  await publicPage.goto(`http://127.0.0.1:${ports.public}/booking?activity=${activityId}`, { waitUntil: 'networkidle' });
  await expect(publicPage.getByRole('heading', { name: /sélectionnez votre date|select date/i })).toBeVisible();
  const day = publicPage.locator('button.rdp-day_button:not([disabled])').first();
  await expect(day).toBeVisible();
  await day.click();
  await expect(publicPage.getByRole('heading', { name: /vos informations|your information/i })).toBeVisible();
  await publicPage.locator('input[name="customerName"]').fill(testCustomerName);
  await publicPage.locator('input[name="customerPhone"]').fill('+212600000001');
  await publicPage.locator('input[name="customerEmail"]').fill(testCustomerEmail);
  await publicPage.locator('input[name^="participantNames"]').first().fill(testCustomerName);
  const reviewButton = publicPage.getByRole('button', { name: /continue to review|vérifier et envoyer/i });
  await expect(reviewButton).toBeVisible();
  await reviewButton.click();
  await expect(publicPage.getByRole('heading', { name: /vérifier votre demande|review your booking/i })).toBeVisible();
  const bookingPost = new Promise((resolve, reject) => {
    const onResponse = async (response) => {
      if (response.request().method() !== 'POST' || !response.url().endsWith('/api/bookings')) return;
      publicPage.off('response', onResponse);
      resolve({ status: response.status(), ok: response.ok(), url: response.url() });
    };
    publicPage.on('response', onResponse);
    setTimeout(() => {
      publicPage.off('response', onResponse);
      reject(new Error('timed out waiting for booking POST response'));
    }, 30_000).unref?.();
  });
  const bookingSubmit = publicPage.getByRole('button', { name: /submit booking request|envoyer la demande de réservation/i });
  await expect(bookingSubmit).toBeVisible();
  await expect(bookingSubmit).toBeEnabled();
  await bookingSubmit.click();
  const cashSubmit = publicPage.getByRole('button', { name: /submit booking/i });
  await expect(cashSubmit).toBeVisible();
  await cashSubmit.click();
  const bookingResponse = await bookingPost.catch(async (error) => {
    const diagnostics = (await publicPage.locator('body').innerText()).slice(0, 2000);
    await publicPage.screenshot({ path: 'phase1-admin-e2e-booking-failure.png', fullPage: true }).catch(() => {});
    throw new Error(`booking POST was not observed at ${publicPage.url()}; visible state: ${diagnostics}; ${error.message}`);
  });
  if (!bookingResponse.ok) throw new Error(`booking POST failed (${bookingResponse.status}) at ${bookingResponse.url}`);
  await publicPage.waitForURL(/confirmation-and-pay/, { timeout: 20_000 }).catch(async (error) => { throw new Error(`booking POST returned 201 but confirmation navigation failed at ${publicPage.url()}: ${(await publicPage.locator('body').innerText()).slice(0, 800)}; ${error.message}`); });
  if (!(await publicPage.locator('body').innerText()).match(/pending|submitted|confirmation|booking/i)) throw new Error('public booking submission did not produce a confirmation state');
  const lookupResponse = await page.request.get(`http://127.0.0.1:${ports.api}/api/admin/bookings?page=1&limit=50&search=${encodeURIComponent(testCustomerName)}`);
  if (!lookupResponse.ok()) throw new Error(`Admin booking lookup failed (${lookupResponse.status()}) for ${testCustomerName}`);
  const lookupPayload = await lookupResponse.json();
  const matchingBookings = Array.isArray(lookupPayload) ? lookupPayload : (lookupPayload.bookings || lookupPayload.data || []);
  if (matchingBookings.length !== 1) throw new Error(`expected exactly one persisted booking for ${testCustomerName}, found ${matchingBookings.length}`);
  const booking = matchingBookings[0];
  const bookingId = String(booking._id || booking.id || '');
  if (!bookingId || booking.customerName !== testCustomerName) throw new Error(`persisted booking identity mismatch: ${JSON.stringify({ bookingId, customerName: booking.customerName })}`);
  console.log(`Booking identity verified: POST 201, confirmation route, exactly one Admin booking ${bookingId} for ${testCustomerName}`);
  // Re-open the booking in the real Admin reservations UI and exercise the
  // operational controls that are available to staff.
  await page.goto(`http://127.0.0.1:${ports.admin}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: /réservations/i }).click();
  const bookingNameMatches = page.getByText(testCustomerName, { exact: true });
  await expect(bookingNameMatches.first()).toBeVisible({ timeout: 20_000 });
  if (await bookingNameMatches.count() < 1) throw new Error(`Admin UI did not render booking ${bookingId}`);
  const bookingCard = page.getByTestId(`booking-row-${bookingId}`);
  await expect(bookingCard).toHaveAttribute('data-booking-id', bookingId);
  await bookingCard.getByRole('button', { name: /détails/i }).click();
  await page.getByText('Partner coordination', { exact: true }).waitFor();
  const bookingDrawer = page.getByRole('dialog');
  const availability = page.getByLabel('Partner availability');
  if (!(await availability.count())) throw new Error('partner availability control missing from booking drawer');
  await availability.selectOption('AVAILABLE');
  const confirmation = bookingDrawer.getByRole('button', { name: /^Confirmer$/i });
  if (!(await confirmation.isDisabled())) throw new Error('confirmation was enabled before payment');
  await page.getByRole('button', { name: /gérer le paiement/i }).click();
  await page.getByText('Type de Paiement').waitFor();
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /acompte/i }).click();
  await page.getByLabel('Montant (MAD)').fill('100');
  await page.getByRole('button', { name: /mettre à jour le paiement/i }).click();
  await bookingDrawer.getByText('Partner coordination', { exact: true }).waitFor();
  await confirmation.click();
  await expect(bookingDrawer.getByText('CONFIRMED', { exact: true })).toBeVisible();
  await expect(bookingCard.getByText('CONFIRMED', { exact: true })).toBeVisible();
  const confirmedResponse = await page.request.get(`http://127.0.0.1:${ports.api}/api/admin/bookings/${bookingId}`);
  if (!confirmedResponse.ok()) throw new Error(`confirmed booking read failed (${confirmedResponse.status()})`);
  const confirmedPayload = await confirmedResponse.json();
  const confirmedBooking = confirmedPayload.booking || confirmedPayload.data || confirmedPayload;
  if (String(confirmedBooking.status).toUpperCase() !== 'CONFIRMED') throw new Error(`independent status check expected CONFIRMED, got ${confirmedBooking.status}`);
  await page.getByLabel('Pickup location').fill('Marrakech Medina');
  await page.getByLabel('Pickup location').blur();
  await page.getByLabel('Return arrangements').fill('Return to hotel');
  await page.getByLabel('Return arrangements').blur();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText(testCustomerName, { exact: true }).first()).toBeVisible();
  await page.getByTestId(`booking-row-${bookingId}`).getByRole('button', { name: /détails/i }).click();
  await page.getByLabel('Pickup location').waitFor();
  if (await page.getByLabel('Pickup location').inputValue() !== 'Marrakech Medina') throw new Error('pickup detail did not persist');
  if (await page.getByLabel('Return arrangements').inputValue() !== 'Return to hotel') throw new Error('return detail did not persist');
  console.log('Phase 1 Admin/public browser workflow: PASS (login, booking UI, reservation drawer, partner availability, payment gate, confirmation, transport persistence, mobile viewport)');
} finally {
  await browser?.close();
  launcher.kill('SIGTERM');
  await new Promise((resolve) => launcher.once('exit', resolve));
}
