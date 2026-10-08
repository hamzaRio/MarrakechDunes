import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { parseRuntimeConfig } from '../server/src/config/runtime-config.js';
import { isAllowedCorsOrigin } from '../server/src/utils/cors-origins.js';
import { resolveApiBaseUrl } from '../client/src/lib/api-url.js';

const secret = 'test-only-secret-never-log-value-123456789';
const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'mongodb://localhost:27017/test',
  JWT_SECRET: secret,
  SESSION_SECRET: secret,
  ADMIN_PASSWORD: 'test-only-admin-password',
  SUPERADMIN_PASSWORD: 'test-only-superadmin-password',
  CORS_ALLOWED_ORIGINS: 'https://marrakech-dunes.vercel.app,https://marrakech-dunes-admin.vercel.app',
  CORS_ALLOWED_ORIGIN_PATTERNS: 'https://marrakech-dunes-*-hamzarios-projects.vercel.app',
};
const configuredProduction = parseRuntimeConfig(production);
assert.equal(configuredProduction.cors.source, 'configured');
assert.equal(configuredProduction.cookie.secure, true);
assert.equal(configuredProduction.cookie.sameSite, 'none');
assert.equal(configuredProduction.cookie.domain, undefined);
assert.equal(configuredProduction.trustProxy, 1);
assert.ok(isAllowedCorsOrigin('https://marrakech-dunes.vercel.app', configuredProduction.cors.allowedOrigins, true, configuredProduction.cors.patterns));
assert.ok(isAllowedCorsOrigin('https://marrakech-dunes-admin.vercel.app', configuredProduction.cors.allowedOrigins, true, configuredProduction.cors.patterns));
assert.ok(isAllowedCorsOrigin('https://marrakech-dunes-pr123-hamzarios-projects.vercel.app', configuredProduction.cors.allowedOrigins, true, configuredProduction.cors.patterns));
assert.ok(!isAllowedCorsOrigin('https://attacker.vercel.app', configuredProduction.cors.allowedOrigins, true, configuredProduction.cors.patterns));
assert.ok(!isAllowedCorsOrigin('https://evil.example.com', configuredProduction.cors.allowedOrigins, true, configuredProduction.cors.patterns));

const configured = parseRuntimeConfig({
  ...production,
  CLIENT_URL: undefined,
  CORS_ALLOWED_ORIGINS: 'https://www.example.com,https://admin.example.com',
  CORS_ALLOWED_ORIGIN_PATTERNS: 'https://web-*-team.example.com',
  COOKIE_SECURE: 'true',
  COOKIE_SAMESITE: 'lax',
  COOKIE_DOMAIN: '.example.com',
  TRUST_PROXY: '2',
});
assert.equal(configured.cors.source, 'configured');
assert.equal(configured.cookie.secure, true);
assert.equal(configured.cookie.sameSite, 'lax');
assert.equal(configured.cookie.domain, '.example.com');
assert.equal(configured.trustProxy, 2);
for (const origin of ['https://www.example.com', 'https://admin.example.com', 'https://web-pr123-team.example.com']) {
  assert.ok(isAllowedCorsOrigin(origin, configured.cors.allowedOrigins, true, configured.cors.patterns), origin);
}
for (const origin of ['https://attacker.vercel.app', 'https://other.example.com', 'https://web-pr123-team.example.com.evil.test', 'http://web-pr123-team.example.com']) {
  assert.ok(!isAllowedCorsOrigin(origin, configured.cors.allowedOrigins, true, configured.cors.patterns), origin);
}
for (const origin of ['*', 'https://*.vercel.app', 'https://evil.example.com/path']) {
  assert.throws(() => parseRuntimeConfig({ ...production, CORS_ALLOWED_ORIGINS: origin }));
}
assert.throws(() => parseRuntimeConfig({
  ...production,
  CORS_ALLOWED_ORIGINS: 'https://www.example.com',
  CORS_ALLOWED_ORIGIN_PATTERNS: 'https://*.vercel.app',
}));
for (const key of ['DATABASE_URL', 'SESSION_SECRET', 'JWT_SECRET', 'ADMIN_PASSWORD', 'SUPERADMIN_PASSWORD'] as const) {
  try {
    parseRuntimeConfig({ ...production, [key]: undefined });
    assert.fail(`${key} must be required`);
  } catch (error) {
    const message = String(error);
    assert.ok(message.includes(key), key);
    assert.ok(!message.includes(secret), 'Validation must not expose a secret value');
  }
}
assert.throws(() => parseRuntimeConfig({ ...production, COOKIE_SECURE: 'false' }));
assert.throws(() => parseRuntimeConfig({ ...production, COOKIE_SAMESITE: 'none', COOKIE_SECURE: 'false' }));

assert.equal(resolveApiBaseUrl({ configured: 'https://api.example.com/api', production: true }), 'https://api.example.com/api');
assert.equal(resolveApiBaseUrl({ configured: 'https://api.example.com', production: true }), 'https://api.example.com/api');
assert.equal(resolveApiBaseUrl({ origin: 'http://localhost:5173', hostname: 'localhost', production: false }), 'http://localhost:5173/api');
assert.equal(resolveApiBaseUrl({ production: false }), 'http://localhost:10000/api');
assert.throws(() => resolveApiBaseUrl({ hostname: 'some-project.vercel.app', production: true }), /VITE_API_URL/);

const example = await readFile('.env.example', 'utf8');
assert.match(example, /CORS_ALLOWED_ORIGINS=/);
assert.match(example, /VIATOR_API_KEY=<viator-api-key>/);
assert.doesNotMatch(example, /@gmail\.com|hamzarios-projects|marrakechdunes-sppy|\+212\d{9}/i);
const inventory = await readFile('docs/config-portability.md', 'utf8');
for (const name of ['Viator', 'GetYourGuide', 'Bank Al-Maghrib', 'MongoDB', 'Sentry', 'Object storage', 'deployment owner']) {
  assert.ok(inventory.includes(name), `Provider inventory missing ${name}`);
}
const emailSource = await readFile('server/src/utils/emailService.ts', 'utf8');
assert.match(emailSource, /process\.env\.SMTP_USER\s*\|\|\s*process\.env\.EMAIL_USER/);
assert.match(emailSource, /process\.env\.SMTP_PASS\s*\|\|\s*process\.env\.EMAIL_PASS/);
const indexSource = await readFile('server/src/index.ts', 'utf8');
assert.match(indexSource, /credentials:\s*true/);
assert.match(indexSource, /"Idempotency-Key"/);
const sessionSource = await readFile('server/src/security-middleware.ts', 'utf8');
assert.match(sessionSource, /secure:\s*runtimeConfig\.cookie\.secure/);
assert.match(sessionSource, /sameSite:\s*runtimeConfig\.cookie\.sameSite/);

const publicFiles = await readdir('client/dist');
const adminFiles = await readdir('client/dist-admin');
assert.ok(publicFiles.includes('sw.js'));
assert.ok(publicFiles.includes('manifest.webmanifest'));
assert.ok(!adminFiles.includes('sw.js'));
assert.ok(!adminFiles.includes('manifest.webmanifest'));
const sw = await readFile('client/dist/sw.js', 'utf8');
assert.doesNotMatch(sw, /api-cache|marrakechdunes-sppy\.onrender\.com/i);
assert.match(sw, /denylist:/);
console.log('Config portability harness: PASS');
