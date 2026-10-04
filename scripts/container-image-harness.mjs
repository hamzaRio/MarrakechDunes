import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

for (const file of ['Dockerfile.api', 'Dockerfile.web', '.dockerignore', 'docker/web-entrypoint.sh', 'docker/nginx-public.conf', 'docker/nginx-admin.conf', 'docker/security-headers.conf', 'docker/admin-robots.conf']) await access(file);
const api = await readFile('Dockerfile.api', 'utf8');
const web = await readFile('Dockerfile.web', 'utf8');
const ignore = await readFile('.dockerignore', 'utf8');
assert.match(api, /USER node/);
assert.match(api, /health\/ready/);
assert.doesNotMatch(api, /client\/dist|dist-admin/);
assert.match(web, /ARG APP=public/);
assert.match(web, /build:\$\{APP\}/);
assert.match(ignore, /\.env/);
assert.match(await readFile('docker/nginx-admin.conf', 'utf8'), /return 404/);
assert.match(await readFile('docker/nginx-public.conf', 'utf8'), /sw\.js/);
assert.match(await readFile('docker/security-headers.conf', 'utf8'), /X-Frame-Options "DENY"/);
assert.match(await readFile('docker/security-headers.conf', 'utf8'), /X-Content-Type-Options/);
assert.match(await readFile('client/src/lib/api-url.ts', 'utf8'), /inputs\.injected\?\.trim\(\) \|\| inputs\.configured/);
console.log('Container image harness: PASS (static checks; Docker smoke tests are run separately)');
