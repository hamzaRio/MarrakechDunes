import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { spawn } from 'node:child_process';
import { MongoClient, ObjectId } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';

const host = '127.0.0.1';
const root = process.cwd();
const password = 'Phase1-launcher-password-123!';
const keepAlive = process.argv.includes('--keep-alive');
const processes = [];
const servers = [];
let replSet;
let mongoClient;
const startedAt = Date.now();
const timestamp = () => `[launcher +${Date.now() - startedAt}ms]`;
const log = (message) => console.log(`${timestamp()} ${message}`);

const freePort = async () => new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(0, host, () => { const port = probe.address().port; probe.close(() => resolve(port)); });
});

const waitFor = async (check, label, timeout = 60_000) => {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try { if (await check()) return; } catch (error) { lastError = error; }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${label} did not become ready${lastError ? `: ${lastError.message}` : ''}`);
};

const fetchWithTimeout = async (url, options = {}, timeout = 5_000) => {
  const signal = AbortSignal.timeout(timeout);
  return fetch(url, { ...options, signal });
};

const withTimeout = (promise, label, timeout = 120_000) => {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeout}ms`)), timeout);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
};

const staticServer = async (directory, port, apiUrl) => {
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || '/', `http://${host}`).pathname);
    if (pathname === '/config.js' && apiUrl) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      return res.end(`window.__API_URL__ = ${JSON.stringify(apiUrl)};`);
    }
    const relative = pathname === '/' || !extname(pathname) ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = normalize(join(directory, relative));
    if (!file.startsWith(normalize(directory))) { res.statusCode = 400; return res.end('Bad path'); }
    try {
      let body = await readFile(file);
      if (extname(file) === '.html' && apiUrl) {
        body = body.toString().replaceAll('http://127.0.0.1:18080', apiUrl);
      }
      const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
      res.setHeader('Content-Type', contentTypes[extname(file)] || 'application/octet-stream');
      res.end(body);
    } catch { res.statusCode = 404; res.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
  servers.push(server);
};

const waitForChildExit = (child, timeout = 5_000) => {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return withTimeout(new Promise((resolve) => child.once('exit', resolve)), 'API process exit', timeout)
    .catch((error) => { child.kill('SIGKILL'); return withTimeout(new Promise((resolve) => child.once('exit', resolve)), 'API process SIGKILL exit', 2_000).catch(() => { throw error; }); });
};

const stop = async () => {
  const failures = [];
  log('cleanup: API child termination starting');
  for (const child of processes) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
  await Promise.all(processes.map((child) => waitForChildExit(child).catch((error) => failures.push(`API child: ${error.message}`))));
  log('cleanup: API child termination complete');

  log('cleanup: static HTTP server shutdown starting');
  await Promise.all(servers.map((server) => withTimeout(new Promise((resolve, reject) => {
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    server.close((error) => error ? reject(error) : resolve());
  }), 'static server shutdown', 5_000).catch((error) => failures.push(`static server: ${error.message}`))));
  log('cleanup: static HTTP server shutdown complete');

  if (mongoClient) {
    log('cleanup: MongoClient.close() starting');
    await withTimeout(mongoClient.close(), 'MongoClient.close()', 5_000).catch((error) => failures.push(`MongoClient.close(): ${error.message}`));
    log('cleanup: MongoClient.close() complete');
  }
  if (replSet) {
    log('cleanup: MongoMemoryReplSet.stop() starting');
    await withTimeout(replSet.stop(), 'MongoMemoryReplSet.stop()', 10_000).catch((error) => failures.push(`MongoMemoryReplSet.stop(): ${error.message}`));
    log('cleanup: MongoMemoryReplSet.stop() complete');
  }
  if (failures.length) {
    for (const failure of failures) console.error(`${timestamp()} cleanup failure: ${failure}`);
    process.exitCode = 1;
  }
};

try {
  if (!existsSync('server/dist/index.js') || !existsSync('client/dist/index.html') || !existsSync('client/dist-admin/index.html')) {
    throw new Error('Build artifacts missing; run npm run build, npm run build:public, and npm run build:admin first');
  }
  const [apiPort, publicPort, adminPort] = await Promise.all([freePort(), freePort(), freePort()]);
  log('starting disposable Mongo replica set');
  replSet = await withTimeout(MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } }), 'MongoMemoryReplSet startup');
  log('Mongo replica set ready');
  const mongoUri = replSet.getUri('phase1_launcher');
  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  const db = mongoClient.db('phase1_launcher');
  const userId = new ObjectId();
  await db.collection('users').insertOne({ _id: userId, username: 'phase1-launcher-admin', password: await bcrypt.hash(password, 12), role: 'admin', createdAt: new Date(), updatedAt: new Date() });

  const env = { ...process.env, NODE_ENV: 'test', PORT: String(apiPort), DATABASE_URL: mongoUri, SESSION_SECRET: 'phase1-launcher-session-secret-1234567890', JWT_SECRET: 'phase1-launcher-jwt-secret', CORS_ALLOWED_ORIGINS: `http://${host}:${publicPort},http://${host}:${adminPort}`, LEGACY_STARTUP_SEEDING: 'false', SEED_DEMO_DATA: 'false', MONGO_AUTO_INDEX: 'false', ROLE: 'all', ENABLE_DEPOSIT_EXPIRATION: 'false', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '' };
  const child = spawn(process.execPath, ['server/dist/index.js'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  processes.push(child);
  let output = '';
  let childExit;
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  child.once('exit', (code, signal) => { childExit = `code=${code ?? 'null'} signal=${signal ?? 'null'}`; });
  await waitFor(async () => {
    if (childExit) throw new Error(`API exited (${childExit})${output ? `: ${output.slice(-2000)}` : ''}`);
    return (await fetchWithTimeout(`http://${host}:${apiPort}/api/health/live`)).ok;
  }, 'API health', 90_000);
  const apiUrl = `http://${host}:${apiPort}/api`;
  await staticServer(join(root, 'client', 'dist'), publicPort, apiUrl);
  await staticServer(join(root, 'client', 'dist-admin'), adminPort, apiUrl);
  const session = await fetchWithTimeout(`http://${host}:${apiPort}/api/session/init`);
  if (!session.ok) throw new Error(`session init failed: ${session.status}`);
  const csrf = (await session.json()).csrfToken;
  const cookies = session.headers.get('set-cookie')?.split(';')[0] || '';
  const login = await fetchWithTimeout(`http://${host}:${apiPort}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf, cookie: cookies }, body: JSON.stringify({ username: 'phase1-launcher-admin', password }) });
  if (!login.ok) throw new Error(`admin login failed: ${login.status} ${await login.text()}`);
  if (!(await fetchWithTimeout(`http://${host}:${publicPort}/`)).ok) throw new Error('public frontend was not reachable');
  if (!(await fetchWithTimeout(`http://${host}:${adminPort}/admin/login`)).ok) throw new Error('admin frontend was not reachable');
  log(`PASS (api=${apiPort}, public=${publicPort}, admin=${adminPort})`);
  if (keepAlive) await new Promise((resolve) => { process.once('SIGTERM', resolve); process.once('SIGINT', resolve); });
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
} finally {
  await stop();
}
