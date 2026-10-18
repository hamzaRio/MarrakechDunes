import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [csrfSource, sessionSource, clientSource] = await Promise.all([
  readFile('server/src/csrf-protection.ts', 'utf8'),
  readFile('server/src/security-middleware.ts', 'utf8'),
  readFile('client/src/lib/api.ts', 'utf8'),
]);

assert.match(csrfSource, /sameSite:\s*process\.env\.NODE_ENV === 'production' \? 'none' : 'lax'/);
assert.match(csrfSource, /partitioned:\s*process\.env\.NODE_ENV === 'production'/);
assert.match(sessionSource, /sameSite:\s*runtimeConfig\.cookie\.sameSite/);
assert.match(sessionSource, /partitioned:\s*runtimeConfig\.cookie\.secure && runtimeConfig\.cookie\.sameSite === 'none'/);
assert.match(clientSource, /withCredentials:\s*true/);
assert.match(clientSource, /X-CSRF-Token/);

console.log('[csrf-cookie] cross-site session and CSRF cookie contract: PASS');
