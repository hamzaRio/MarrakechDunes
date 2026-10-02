import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.NODE_ENV = 'production';
const logDir = join(tmpdir(), `marrakechdunes-phase2a-${Date.now()}`);
process.env.LOG_DIR = logDir;

const { CacheService } = await import('../server/src/services/cache-service.js');
const { LoggingService } = await import('../server/src/services/logging-service.js');
const { createGracefulShutdown } = await import('../server/src/utils/graceful-shutdown.js');

const cache = new CacheService();
await cache.set('activities', 'ttl', { value: 'temporary' }, 0.02);
await new Promise((resolve) => setTimeout(resolve, 35));
assert.equal(await cache.get('activities', 'ttl'), null, 'expired values are not returned');

await cache.clearMemoryCache();
await cache.clearStats();
for (let i = 0; i < 500; i += 1) {
  await cache.set('activities', `entry-${i}`, { value: i }, 60);
}
await cache.get('activities', 'entry-0');
await cache.set('activities', 'entry-500', { value: 500 }, 60);
assert.ok((await cache.getMemoryCacheSize()) <= 500, 'cache has a hard entry bound');
assert.deepEqual(await cache.get('activities', 'entry-0'), { value: 0 }, 'hot entry survives LRU eviction');
assert.equal(await cache.get('activities', 'entry-1'), null, 'least-recent entry is evicted');
assert.deepEqual(await cache.get('activities', 'entry-500'), { value: 500 }, 'newest entry survives');
await cache.clearMemoryCache();
await cache.clearStats();
await cache.set('activities', 'invalidated-1', true, 60);
await cache.set('activities', 'invalidated-2', true, 60);
await cache.set('activities', 'other', true, 60);
const beforePatternDeletes = (await cache.getStats()).deletes;
await cache.invalidatePattern('activities:*');
assert.equal((await cache.getStats()).deletes - beforePatternDeletes, 3, 'pattern deletion stats count actual removals');
const beforeNoMatch = (await cache.getStats()).deletes;
await cache.invalidatePattern('not-present:*');
assert.equal((await cache.getStats()).deletes, beforeNoMatch, 'no-match invalidation does not increment deletes');
await cache.set('activities', 'single-delete', true, 60);
const beforeDelete = (await cache.getStats()).deletes;
await cache.del('activities', 'single-delete');
await cache.del('activities', 'single-delete');
assert.equal((await cache.getStats()).deletes - beforeDelete, 1, 'explicit delete stats count one actual removal');
await cache.set('activities', 'stats-hit', true, 60);
await cache.get('activities', 'stats-hit');
await cache.get('activities', 'missing');
const stats = await cache.getStats();
assert.ok(stats.hits > 0 && stats.misses > 0 && stats.sets > 0, 'cache statistics remain coherent');
await cache.disconnect();

const logger = new LoggingService();
logger.info('phase2a production logging test');
logger.logRequest({ method: 'GET', url: '/api/health', ip: '127.0.0.1', connection: {}, get: () => undefined } as any, { statusCode: 200 } as any, 1);
assert.equal(existsSync(logDir), false, 'production logging does not create files');
await logger.close();

process.env.NODE_ENV = 'development';
const developmentLogger = new LoggingService();
developmentLogger.info('phase2a development logging test');
developmentLogger.warn('phase2a development logging test');
await developmentLogger.close();
const applicationLog = readFileSync(join(logDir, 'application.log'), 'utf8');
assert.equal(applicationLog.trim().split(/\r?\n/).length, 2, 'development logging reuses an append stream');
rmSync(logDir, { recursive: true, force: true });

let timeoutCalls = 0;
const timeoutShutdown = createGracefulShutdown({
  closeServer: async () => new Promise<void>(() => {}),
  stopTimers: () => {},
  closeLogging: async () => {},
  closeCache: async () => {},
  closeDatabase: async () => {},
  timeoutMs: 20,
  onTimeout: () => { timeoutCalls += 1; },
});
timeoutShutdown();
timeoutShutdown();
await new Promise((resolve) => setTimeout(resolve, 50));
assert.equal(timeoutCalls, 1, 'hard timeout fallback fires once for duplicate shutdown calls');

let closeServerCalls = 0;
let stopTimerCalls = 0;
let closeLoggingCalls = 0;
let closeCacheCalls = 0;
let closeDatabaseCalls = 0;
let releaseServer!: () => void;
const serverClosed = new Promise<void>((resolve) => { releaseServer = resolve; });
const shutdown = createGracefulShutdown({
  closeServer: async () => { closeServerCalls += 1; await serverClosed; },
  stopTimers: () => { stopTimerCalls += 1; },
  closeLogging: async () => { closeLoggingCalls += 1; },
  closeCache: async () => { closeCacheCalls += 1; },
  closeDatabase: async () => { closeDatabaseCalls += 1; },
  timeoutMs: 1000,
});
const firstShutdown = shutdown();
const secondShutdown = shutdown();
releaseServer();
await Promise.all([firstShutdown, secondShutdown]);
assert.equal(closeServerCalls, 1, 'shutdown is idempotent');
assert.equal(stopTimerCalls, 1, 'timers stop once');
assert.equal(closeLoggingCalls, 1, 'logging closes once');
assert.equal(closeCacheCalls, 1, 'cache closes once');
assert.equal(closeDatabaseCalls, 1, 'database closes once');

console.log('Phase 2A runtime harness: PASS');
