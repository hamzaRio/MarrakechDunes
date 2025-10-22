import assert from 'node:assert/strict';
import { buildGYGSearchRequest } from './gyg.js';

const request = buildGYGSearchRequest({ query: 'agafay dinner', city: 'marrakech' });
const url = new URL(request.url);

assert.equal(url.searchParams.get('q'), 'agafay dinner', 'Query parameter should be preserved');
assert.equal(url.searchParams.get('city'), 'marrakech', 'City parameter should be included');
assert.ok('Authorization' in request.headers, 'Authorization header should be present');
assert.ok(request.headers.Authorization?.includes('<redacted>') || request.headers.Authorization === 'Basic <missing>',
  'Authorization header should redact secrets');

console.log('✅ buildGYGSearchRequest dry-run test passed');
