import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { escapeHtml } from '../server/src/utils/html-escape.js';

for (const value of [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  'Hamza & Sons',
  '"quoted"',
  "'apostrophe'",
  '<tag>',
]) {
  const escaped = escapeHtml(value);
  assert.doesNotMatch(escaped, /<|>/);
  assert.doesNotMatch(escaped, /<[^>]*>/);
  assert.ok(escaped.includes('&lt;') || escaped.includes('&amp;') || escaped.includes('&quot;') || escaped.includes('&#39;'));
}

const serviceSource = await readFile('server/src/services/email-service.ts', 'utf8');
const utilitySource = await readFile('server/src/utils/emailService.ts', 'utf8');
assert.match(serviceSource, /import \{ escapeHtml \} from ['"]\.\.\/utils\/html-escape\.js['"]/);
assert.match(utilitySource, /import \{ escapeHtml \} from ['"]\.\/html-escape\.js['"]/);
assert.doesNotMatch(serviceSource, /\$\{data\.(customerName|activityName|bookingId)\}/);
assert.doesNotMatch(utilitySource, /message\.replace\(\/\\n\/g, ['"]<br>/);
console.log('Email escaping harness: PASS');
