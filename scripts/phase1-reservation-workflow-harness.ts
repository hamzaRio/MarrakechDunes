import assert from 'node:assert/strict';
import { depositDeadlineFor, parseCasablancaDateTime } from '../server/src/utils/booking-deadline.js';

const start = parseCasablancaDateTime('2035-06-15', '12:00');
assert(start, 'valid Casablanca start time should parse');
assert.equal(depositDeadlineFor('2035-06-15', '12:00')?.getTime(), start.getTime() - 24 * 60 * 60 * 1000);
assert.equal(depositDeadlineFor('2035-06-15'), null, 'missing start time must remain manual review');
assert.equal(depositDeadlineFor('2035-06-15', '25:00'), null, 'invalid start time must not be guessed');
console.log('Phase 1 reservation deadline harness: PASS');
