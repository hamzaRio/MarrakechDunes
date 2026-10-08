import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { LoggingService } from '../server/src/services/logging-service.js';

process.env.NODE_ENV = 'development';
process.env.LOG_DIR = `${process.cwd()}/.tmp-log-privacy`;
const lines: string[] = [];
const originalLog = console.log;
console.log = (...args: unknown[]) => { lines.push(args.join(' ')); };
let logger: LoggingService | undefined;
try {
  logger = new LoggingService();
  logger.info('privacy test', {
    requestId: 'req-privacy-1',
    endpoint: '/api/test?token=SECRET_QUERY_TOKEN',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    userId: 'user-1',
  });
  logger.logRequest({
    method: 'GET',
    url: '/api/test?token=SECRET_QUERY_TOKEN',
    ip: '127.0.0.1',
    connection: {},
    get: (name: string) => name.toLowerCase() === 'cookie' ? 'SECRET_COOKIE' : undefined,
    requestId: 'req-privacy-2',
  } as never, { statusCode: 200 } as never, 1);
  assert.equal(lines.some((line) => line.includes('req-privacy-1')), true);
  assert.equal(lines.some((line) => line.includes('req-privacy-2')), true);
  for (const secret of ['SECRET_AUTH_TOKEN', 'SECRET_COOKIE', 'SECRET_QUERY_TOKEN', 'SECRET_PASSWORD']) {
    assert.equal(lines.some((line) => line.includes(secret)), false, `secret leaked: ${secret}`);
  }
  assert.equal(lines.some((line) => line.includes('127.0.0.1')), true);
} finally {
  await logger?.close();
  console.log = originalLog;
  rmSync(process.env.LOG_DIR || '', { recursive: true, force: true });
}
console.log('Log privacy harness: PASS');
