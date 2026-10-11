import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MongoClient, ObjectId } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import request from 'supertest';

const port = 18181;
const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
const mongoUri = replSet.getUri('integration_test');
const dbClient = new MongoClient(mongoUri);
let server;
let output = '';
let captureDir;
let emailCaptureFile;

function check(condition, message) { if (!condition) throw new Error(message); }
function cookieHeader(response) { return (response.headers['set-cookie'] || []).map((value) => value.split(';')[0]).join('; '); }

try {
  await dbClient.connect();
  const db = dbClient.db('integration_test');
  try { await db.createCollection('auditlogs'); } catch (error) { if (error?.code !== 48) throw error; }
  const setAuditValidator = async (rejectWrites) => {
    await db.command({
      collMod: 'auditlogs',
      validator: rejectWrites ? { $expr: { $eq: [1, 0] } } : {},
      validationLevel: 'strict',
      validationAction: 'error',
    });
  };
  const findAudit = async (action, actorId, bookingId, bookingReference) => {
    const rows = await db.collection('auditlogs').find({ action, userId: String(actorId) }).toArray();
    return rows.find((row) => {
      let details;
      try { details = JSON.parse(row.details || '{}'); } catch { return false; }
      return details.bookingId === String(bookingId) && details.bookingReference === bookingReference;
    });
  };
  captureDir = await mkdtemp(join(tmpdir(), 'marrakech-email-'));
  emailCaptureFile = join(captureDir, 'messages.html');
  const passwordHash = await bcrypt.hash('Integration-password-123!', 12);
  const adminId = new ObjectId();
  const superadminId = new ObjectId();
  await db.collection('users').insertMany([
    { _id: adminId, username: 'integration-admin', password: passwordHash, role: 'admin', createdAt: new Date(), updatedAt: new Date() },
    { _id: superadminId, username: 'integration-superadmin', password: passwordHash, role: 'superadmin', createdAt: new Date(), updatedAt: new Date() },
  ]);
  const activityId = new ObjectId();
  await db.collection('activities').insertOne({ _id: activityId, name: 'Integration activity', description: 'test', category: 'test', price: '100', imageUrls: [], isActive: true, approvalStatus: 'approved', maxParticipants: 10, capacitySettings: { maxParticipants: 10 }, createdAt: new Date(), updatedAt: new Date() });
  const bookingId = new ObjectId();
  await db.collection('bookings').insertOne({ _id: bookingId, bookingReference: 'INT-PAY-1', customerName: '<script>alert(1)</script>', customerPhone: '+491234567890', customerEmail: 'private-test@example.invalid', activityId, numberOfPeople: 1, preferredDate: new Date('2040-01-01T00:00:00.000Z'), status: 'PENDING', totalAmount: '100', paymentStatus: 'unpaid', paidAmount: 0, createdAt: new Date(), updatedAt: new Date() });

  const env = { ...process.env, NODE_ENV: 'test', PORT: String(port), DATABASE_URL: mongoUri, SESSION_SECRET: 'integration-session-secret-123456789012345', JWT_SECRET: 'integration-jwt-secret', CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:4173', CLIENT_URL: 'http://127.0.0.1:4173', LEGACY_STARTUP_SEEDING: 'false', SEED_DEMO_DATA: 'false', MONGO_AUTO_INDEX: 'false', ROLE: 'all', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', TEST_PORTAL_SESSION_SECRET: 'integration-portal-test-secret', EMAIL_CAPTURE_FILE: emailCaptureFile };
  server = spawn(process.execPath, ['server/dist/index.js'], { cwd: process.cwd(), env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', (chunk) => { output += chunk.toString(); });
  server.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const app = request(`http://127.0.0.1:${port}`);
  for (let attempt = 0; attempt < 60; attempt++) {
    try { const health = await app.get('/api/health/live'); if (health.status === 200) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (attempt === 59) throw new Error(`server did not become ready: ${output.slice(-2000)}`);
  }

  const login = async (username) => {
    const agent = request.agent(`http://127.0.0.1:${port}`);
    const initResponse = await agent.get('/api/session/init');
    const csrf = initResponse.body.csrfToken;
    const loginResponse = await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({ username, password: 'Integration-password-123!' });
    check(loginResponse.status === 200, `${username} login failed: ${loginResponse.status}`);
    check(initResponse.status === 200 && csrf, `${username} CSRF init failed`);
    return { agent, csrf };
  };

  const admin = await login('integration-admin');
  check((await admin.agent.get('/api/admin/bookings')).status === 200, 'admin protected route failed');
  const adminRecord = await db.collection('users').findOne({ _id: adminId });
  await db.collection('users').updateOne({ _id: adminId }, { $set: { role: 'customer' } });
  check((await admin.agent.get('/api/admin/bookings')).status === 401, 'stale admin session remained valid after demotion');
  await db.collection('users').deleteOne({ _id: adminId });
  check((await admin.agent.get('/api/admin/bookings')).status === 401, 'deleted user retained access in the same session');
  await db.collection('users').insertOne(adminRecord);
  const activeAdmin = await login('integration-admin');

  const superadmin = await login('integration-superadmin');
  const publicAgent = request.agent(`http://127.0.0.1:${port}`);
  const publicCsrf = (await publicAgent.get('/api/session/init')).body.csrfToken;
  const transmittedMarkers = await app.get('/api/health/live?token=SECRET_QUERY_TOKEN_123')
    .set('Authorization', 'Bearer SECRET_AUTH_TOKEN_123')
    .set('Cookie', 'secret=SECRET_COOKIE_123');
  check(transmittedMarkers.status === 200, 'marker request failed');
  const failedLoginAgent = request.agent(`http://127.0.0.1:${port}`);
  const failedLoginInit = await failedLoginAgent.get('/api/session/init');
  const failedLogin = await failedLoginAgent.post('/api/auth/login')
    .set('X-CSRF-Token', failedLoginInit.body.csrfToken)
    .send({ username: 'missing-user', password: 'SECRET_PASSWORD_123' });
  check([401, 403].includes(failedLogin.status), `failed marker login had unexpected status ${failedLogin.status}`);
  const invalidPayment = await superadmin.agent.patch(`/api/admin/bookings/${bookingId}/payment`).set('X-CSRF-Token', superadmin.csrf).send({ paymentStatus: 'unpaid', paidAmount: null, paymentMethod: 'cash' });
  check(invalidPayment.status === 400, 'null paidAmount was accepted');
  const paymentBeforeFailure = await db.collection('bookings').findOne({ _id: bookingId });
  await setAuditValidator(true);
  const paymentFailure = await superadmin.agent.patch(`/api/admin/bookings/${bookingId}/payment`).set('X-CSRF-Token', superadmin.csrf).send({ type: 'DEPOSIT', paidAmount: 30, paymentMethod: 'cash_deposit' });
  check(paymentFailure.status === 500, `payment audit failure was not surfaced (${paymentFailure.status})`);
  const paymentAfterFailure = await db.collection('bookings').findOne({ _id: bookingId });
  check(paymentAfterFailure.paymentStatus === paymentBeforeFailure.paymentStatus && Number(paymentAfterFailure.paidAmount) === Number(paymentBeforeFailure.paidAmount), 'payment changed despite audit failure');
  check(!(await findAudit('BOOKING_PAYMENT_UPDATE', superadminId, bookingId, 'INT-PAY-1')), 'payment audit appeared after failed transaction');
  await setAuditValidator(false);
  const deposit = await superadmin.agent.patch(`/api/admin/bookings/${bookingId}/payment`).set('X-CSRF-Token', superadmin.csrf).send({ type: 'DEPOSIT', paidAmount: 30, paymentMethod: 'cash_deposit' });
  check(deposit.status === 200 && deposit.body.payment.status === 'deposit_paid', 'valid deposit payment failed');
  const full = await superadmin.agent.patch(`/api/admin/bookings/${bookingId}/payment`).set('X-CSRF-Token', superadmin.csrf).send({ paidAmount: 100, paymentMethod: 'cash' });
  check(full.status === 200 && full.body.payment.status === 'fully_paid', 'valid full payment failed');
  check(await findAudit('BOOKING_PAYMENT_UPDATE', superadminId, bookingId, 'INT-PAY-1'), 'exact payment audit was not retained');
  await db.collection('bookings').updateOne({ _id: bookingId }, { $set: { status: 'CANCELLED' } });
  const cancelledPayment = await superadmin.agent.patch(`/api/admin/bookings/${bookingId}/payment`).set('X-CSRF-Token', superadmin.csrf).send({ paidAmount: 1, paymentMethod: 'cash' });
  check(cancelledPayment.status === 409, 'cancelled booking accepted payment update');

  const lifecycleId = new ObjectId();
  await db.collection('activities').updateOne({ _id: activityId }, { $set: { name: '<img src=x onerror=alert(1)>' } });
  await db.collection('bookings').insertOne({ _id: lifecycleId, bookingReference: 'INT-LIFECYCLE-1', customerName: '<script>alert(1)</script> Hamza & Sons "quoted" \'apostrophe\' <tag>', customerPhone: '+491234567890', customerEmail: 'private-test@example.invalid', activityId, numberOfPeople: 2, preferredDate: new Date('2040-01-02T00:00:00.000Z'), status: 'PENDING', totalAmount: '100', paymentStatus: 'unpaid', paidAmount: 0, createdAt: new Date(), updatedAt: new Date() });
  const confirmed = await activeAdmin.agent.patch(`/api/admin/bookings/${lifecycleId}/status`).set('X-CSRF-Token', activeAdmin.csrf).send({ status: 'CONFIRMED' });
  check(confirmed.status === 200, `atomic confirm failed: ${confirmed.status}`);
  const emailHtml = await readFile(emailCaptureFile, 'utf8');
  for (const escaped of ['&lt;script&gt;alert(1)&lt;/script&gt;', '&lt;img src=x onerror=alert(1)&gt;', 'Hamza &amp; Sons', '&quot;quoted&quot;', '&#39;apostrophe&#39;', '&lt;tag&gt;']) check(emailHtml.includes(escaped), `escaped email value missing: ${escaped}`);
  check(!emailHtml.includes('<script>alert(1)</script>') && !emailHtml.includes('<img src=x onerror=alert(1)>'), 'active email path emitted executable markup');
  const counterAfterConfirm = await db.collection('capacitycounters').findOne({ activityId: String(activityId), dateKey: '2040-01-02' });
  check(counterAfterConfirm?.occupied === 2, 'confirm did not reserve capacity atomically');
  const cancelled = await activeAdmin.agent.patch(`/api/admin/bookings/${lifecycleId}/status`).set('X-CSRF-Token', activeAdmin.csrf).send({ status: 'CANCELLED' });
  check(cancelled.status === 200, `atomic cancel failed: ${cancelled.status}`);
  const counterAfterCancel = await db.collection('capacitycounters').findOne({ activityId: String(activityId), dateKey: '2040-01-02' });
  check(counterAfterCancel?.occupied === 0, 'cancel did not release capacity atomically');

  const rescheduleId = new ObjectId();
  await db.collection('bookings').insertOne({ _id: rescheduleId, bookingReference: 'INT-RESCHEDULE-1', customerName: 'Portal customer', customerPhone: '+491234567890', customerEmail: 'private-test@example.invalid', activityId, numberOfPeople: 2, capacityReserved: 2, preferredDate: new Date('2040-01-04T00:00:00.000Z'), status: 'CONFIRMED', totalAmount: '100', paymentStatus: 'unpaid', paidAmount: 0, createdAt: new Date(), updatedAt: new Date() });
  await db.collection('capacitycounters').insertOne({ activityId: String(activityId), dateKey: '2040-01-04', occupied: 2 });
  const portalAgent = request.agent(`http://127.0.0.1:${port}`);
  const portalCsrf = (await portalAgent.get('/api/session/init')).body.csrfToken;
  const portalSession = await portalAgent.post('/api/portal/__test/session').set('X-CSRF-Token', portalCsrf).set('X-Test-Session-Secret', 'integration-portal-test-secret').send({ phone: '+491234567890' });
  check(portalSession.status === 204, `test portal session setup failed: ${portalSession.status}`);
  const reschedule = await portalAgent.post(`/api/portal/me/bookings/${rescheduleId}/reschedule`).set('X-CSRF-Token', portalCsrf).send({ newDate: '2040-01-05', reason: 'integration test' });
  check(reschedule.status === 200, `real portal reschedule failed: ${reschedule.status}`);
  const rescheduledBooking = await db.collection('bookings').findOne({ _id: rescheduleId });
  const releasedCounter = await db.collection('capacitycounters').findOne({ activityId: String(activityId), dateKey: '2040-01-04' });
  check(rescheduledBooking.status === 'PENDING' && new Date(rescheduledBooking.preferredDate).toISOString().startsWith('2040-01-05'), 'portal reschedule did not apply pending date');
  check(releasedCounter?.occupied === 0, 'portal reschedule did not release old capacity');

  const deleteId = new ObjectId();
  await db.collection('bookings').insertOne({ _id: deleteId, bookingReference: 'INT-DELETE-1', customerName: 'Delete', customerPhone: '+3', activityId, numberOfPeople: 1, preferredDate: new Date('2040-01-03T00:00:00.000Z'), status: 'CONFIRMED', totalAmount: '100', paymentStatus: 'unpaid', paidAmount: 0, capacityReserved: 1, createdAt: new Date(), updatedAt: new Date() });
  await db.collection('capacitycounters').insertOne({ activityId: String(activityId), dateKey: '2040-01-03', occupied: 1 });
  check((await activeAdmin.agent.delete(`/api/admin/bookings/${deleteId}`).set('X-CSRF-Token', activeAdmin.csrf)).status === 403, 'admin could hard-delete a booking');
  await setAuditValidator(true);
  const deleteFailure = await superadmin.agent.delete(`/api/admin/bookings/${deleteId}`).set('X-CSRF-Token', superadmin.csrf);
  check(deleteFailure.status === 500, `delete audit failure was not surfaced (${deleteFailure.status})`);
  check(await db.collection('bookings').findOne({ _id: deleteId }), 'booking was deleted despite audit failure');
  check((await db.collection('capacitycounters').findOne({ activityId: String(activityId), dateKey: '2040-01-03' }))?.occupied === 1, 'capacity changed despite delete audit failure');
  check(!(await findAudit('BOOKING_DELETE', superadminId, deleteId, 'INT-DELETE-1')), 'delete audit appeared after failed transaction');
  await setAuditValidator(false);
  const deletedResponse = await superadmin.agent.delete(`/api/admin/bookings/${deleteId}`).set('X-CSRF-Token', superadmin.csrf);
  check(deletedResponse.status === 200 && !(await db.collection('bookings').findOne({ _id: deleteId })), 'superadmin delete failed');
  check(await findAudit('BOOKING_DELETE', superadminId, deleteId, 'INT-DELETE-1'), 'exact delete audit was not retained');

  const invalidReview = await publicAgent.post('/api/reviews').set('X-CSRF-Token', publicCsrf).send({ customerName: '<script>alert(1)</script>' });
  check(invalidReview.status === 400, `invalid review was accepted (${invalidReview.status})`);
  const unauthAutoResponse = await app.post('/api/auto-response/incoming').send({ message: 'test' });
  check([401, 403].includes(unauthAutoResponse.status), 'auto-response was writable without admin auth');
  check((await superadmin.agent.patch(`/api/admin/bookings/${bookingId}/status`).send({ status: 'CANCELLED' })).status === 403, 'admin mutation bypassed CSRF');
  const securityEvent = await app.post('/api/security-events').send({ event: 'integration', details: { marker: 'integration-event' } });
  check(securityEvent.status === 200, 'security event route failed');

  const headerResponse = await app.get('/api/health/live');
  const csp = String(headerResponse.headers['content-security-policy'] || '');
  check(csp && !csp.includes("'unsafe-eval'") && csp.includes('object-src') && csp.includes('base-uri') && csp.includes('form-action'), 'Helmet CSP contract failed');
  check(headerResponse.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options missing');
  check(headerResponse.headers['referrer-policy'], 'Referrer-Policy missing');
  check(headerResponse.headers['permissions-policy'], 'Permissions-Policy missing');
  for (const marker of ['+491234567890', 'private-test@example.invalid', 'SECRET_AUTH_TOKEN_123', 'SECRET_COOKIE_123', 'SECRET_QUERY_TOKEN_123', 'SECRET_PASSWORD_123']) check(!output.includes(marker), `log privacy leak: ${marker}`);
  check(/request[- ]?id|x-request-id/i.test(output), 'request correlation id was not logged');
  console.log('[non-storage-integration] real Express auth/CSRF/payment/M7/M11 gates: PASS');
} finally {
  if (server) {
    server.kill('SIGTERM');
    const exited = await Promise.race([
      once(server, 'exit').then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
    ]);
    // A test-only child must never keep CI alive if graceful shutdown is
    // delayed by a disposable Mongo process. Production shutdown behavior is
    // exercised separately by the service's own signal handling.
    if (!exited) {
      server.kill('SIGKILL');
      await Promise.race([once(server, 'exit'), new Promise((resolve) => setTimeout(resolve, 1000))]);
    }
  }
  await dbClient.close();
  await replSet.stop();
  if (captureDir) await rm(captureDir, { recursive: true, force: true });
}
