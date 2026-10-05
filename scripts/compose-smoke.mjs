import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';

const root = process.cwd();
const project = 'marrakechdunes-phase6-smoke';
const envDir = mkdtempSync(path.join(tmpdir(), 'marrakechdunes-compose-'));
const envFile = path.join(envDir, 'compose.env');
const baseEnv = [
  'MONGO_DB_NAME=marrakechdunes_smoke',
  'SESSION_SECRET=phase6-disposable-session-secret-012345678901234567890',
  'JWT_SECRET=phase6-disposable-jwt-secret',
  'BOOTSTRAP_ADMIN_USERNAME=phase6admin',
  'CLIENT_URL=http://localhost:8080',
  'CORS_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:8081,http://localhost:10000',
  'COOKIE_SAMESITE=lax',
  'PUBLIC_API_URL=http://localhost:10000/api',
  'ADMIN_API_URL=http://localhost:10000/api',
].join('\n') + '\n';
const firstPassword = 'phase6-disposable-password-12345';
const secondPassword = 'phase6-different-password-67890';
const writeEnv = (password) => writeFileSync(envFile, `${baseEnv}BOOTSTRAP_ADMIN_PASSWORD=${password}\n`, { mode: 0o600 });
writeEnv(firstPassword);
const hostEnv = { PATH: process.env.PATH || process.env.Path, Path: process.env.Path || process.env.PATH, PATHEXT: process.env.PATHEXT, HOME: process.env.HOME, HOMEDRIVE: process.env.HOMEDRIVE, HOMEPATH: process.env.HOMEPATH, USERPROFILE: process.env.USERPROFILE, SYSTEMROOT: process.env.SYSTEMROOT, WINDIR: process.env.WINDIR, TEMP: process.env.TEMP, TMP: process.env.TMP, TMPDIR: process.env.TMPDIR, APPDATA: process.env.APPDATA, LOCALAPPDATA: process.env.LOCALAPPDATA, PROGRAMDATA: process.env.PROGRAMDATA, PROGRAMFILES: process.env.PROGRAMFILES, 'PROGRAMFILES(X86)': process.env['PROGRAMFILES(X86)'], DOCKER_HOST: process.env.DOCKER_HOST, DOCKER_CONTEXT: process.env.DOCKER_CONTEXT, DOCKER_CONFIG: process.env.DOCKER_CONFIG, DOCKER_CERT_PATH: process.env.DOCKER_CERT_PATH, DOCKER_TLS_VERIFY: process.env.DOCKER_TLS_VERIFY, DOCKER_BUILDKIT: '1', COMPOSE_DOCKER_CLI_BUILD: '1', DOCKER_CLI_PLUGIN_EXTRA_DIRS: 'C:\\Program Files\\Docker\\cli-plugins;C:\\Program Files\\Docker\\Docker\\resources\\cli-plugins' };
const composePlugin = 'C:\\Program Files\\Docker\\cli-plugins\\docker-compose.exe';
for (const args of [['version'], ['buildx', 'version']]) {
  const result = spawnSync('docker', args, { env: hostEnv, stdio: 'ignore' });
  if (result.status !== 0) throw new Error(`Docker ${args.join(' ')} is unavailable in the sanitized environment`);
}
const composeBase = spawnSync('docker', ['compose', 'version'], { env: hostEnv, stdio: 'ignore' }).status === 0
  ? ['docker', 'compose']
  : (existsSync(composePlugin) ? [composePlugin] : ['docker-compose']);
const compose = (...args) => execFileSync(composeBase[0], [...composeBase.slice(1), '--env-file', envFile, '-p', project, '-f', path.join(root, 'compose.yaml'), ...args], { cwd: root, stdio: 'inherit', env: hostEnv });
const request = async (url, options = {}) => { const response = await fetch(url, options); return { response, text: await response.text() }; };
const waitFor = async (url, timeout = 120000) => { const end = Date.now() + timeout; while (Date.now() < end) { try { const result = await request(url); if (result.response.ok) return result; } catch {} await new Promise((resolve) => setTimeout(resolve, 2000)); } throw new Error(`Timed out waiting for ${url}`); };
try {
  if (!existsSync(path.join(root, 'compose.yaml'))) throw new Error('compose.yaml is missing');
  compose('config', '--quiet');
  compose('build');
  compose('up', '-d', 'mongo', 'api', 'web-public', 'web-admin');
  await waitFor('http://localhost:10000/api/health/live');
  await waitFor('http://localhost:10000/api/health/ready');
  const publicHome = await request('http://localhost:8080/');
  const publicRoute = await request('http://localhost:8080/activities');
  const adminLogin = await request('http://localhost:8081/admin/login');
  const adminSw = await request('http://localhost:8081/sw.js');
  const publicConfig = await request('http://localhost:8080/config.js');
  const adminConfig = await request('http://localhost:8081/config.js');
  if (!publicHome.response.ok || !publicRoute.response.ok || !adminLogin.response.ok || adminSw.response.status !== 404) throw new Error('web smoke failed');
  for (const config of [publicConfig, adminConfig]) {
    const context = { window: {} };
    runInNewContext(config.text, context, { timeout: 1000 });
    assert.deepEqual(Object.keys(context.window), ['__API_URL__']);
    assert.equal(context.window.__API_URL__, 'http://localhost:10000/api');
  }
  const session = await request('http://localhost:10000/api/session/init', { headers: { Origin: 'http://localhost:8080' } });
  if (!session.response.ok || !session.text.includes('csrfToken')) throw new Error('session init failed');
  const sessionCookies = session.response.headers.getSetCookie?.() || (session.response.headers.get('set-cookie') || '').split(/,(?=[^;]+?=)/);
  const cookieHeader = sessionCookies.map((value) => value.split(';')[0]).join('; ');
  const csrfToken = JSON.parse(session.text).csrfToken;
  const allowedCors = await request('http://localhost:10000/api/health', { headers: { Origin: 'http://localhost:8080' } });
  const deniedCors = await request('http://localhost:10000/api/health', { headers: { Origin: 'https://unrelated.example' } });
  if (allowedCors.response.headers.get('access-control-allow-origin') !== 'http://localhost:8080') throw new Error('allowed CORS failed');
  if (deniedCors.response.headers.has('access-control-allow-origin')) throw new Error('denied CORS emitted ACAO');
  compose('--profile', 'bootstrap', 'run', '--rm', 'bootstrap');
  compose('--profile', 'bootstrap', 'run', '--rm', 'bootstrap');
  const login = async (password) => {
    const result = await request('http://localhost:10000/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json', Origin: 'http://localhost:8081', Cookie: cookieHeader, 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ username: 'phase6admin', password }),
    });
    return result;
  };
  const firstLogin = await login(firstPassword);
  if (!firstLogin.response.ok) throw new Error('admin login failed');
  const loginCookies = firstLogin.response.headers.getSetCookie?.() || (firstLogin.response.headers.get('set-cookie') || '').split(/,(?=[^;]+?=)/);
  let cookie = loginCookies.map((value) => value.split(';')[0]).join('; ');
  if (!cookie || !cookie.includes('marrakech.session=')) throw new Error('session cookie missing');
  const authUser = await request('http://localhost:10000/api/auth/user', { headers: { Origin: 'http://localhost:8081', Cookie: cookie } });
  if (!authUser.response.ok || !authUser.text.includes('phase6admin') || !authUser.text.includes('superadmin')) throw new Error(`authenticated user check failed: ${authUser.response.status} ${authUser.text.slice(0, 200)}`);
  const logout = await request('http://localhost:10000/api/auth/logout', { method: 'POST', headers: { Origin: 'http://localhost:8081', Cookie: cookie, 'X-CSRF-Token': csrfToken } });
  if (!logout.response.ok) throw new Error('admin logout failed');
  const afterLogout = await request('http://localhost:10000/api/auth/user', { headers: { Origin: 'http://localhost:8081', Cookie: cookie } });
  if (afterLogout.response.status !== 401) throw new Error('logout did not invalidate session');
  writeEnv(secondPassword);
  compose('--profile', 'bootstrap', 'run', '--rm', 'bootstrap');
  const oldPassword = await login(firstPassword);
  if (!oldPassword.response.ok) throw new Error('original password was replaced');
  const newPassword = await login(secondPassword);
  if (newPassword.response.ok) throw new Error('second bootstrap password unexpectedly worked');
  compose('down');
  compose('up', '-d', 'mongo', 'api', 'web-public', 'web-admin');
  await waitFor('http://localhost:10000/api/health/ready');
  const afterRestart = await login(firstPassword);
  if (!afterRestart.response.ok) throw new Error('original password failed after restart');
  console.log('Compose smoke PASS: config, builds, health, web routes, CORS, session init, authenticated user, logout invalidation, bootstrap no-op/password preservation, and Mongo volume persistence');
} finally {
  try { compose('down', '-v'); } catch {}
  rmSync(envDir, { recursive: true, force: true });
}
