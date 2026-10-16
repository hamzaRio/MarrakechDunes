import assert from 'node:assert/strict';
import { depositDeadlineFor, isBelowRequiredDeposit, parseCasablancaDateTime } from '../server/src/utils/booking-deadline.js';

const start = parseCasablancaDateTime('2035-06-15', '12:00');
assert(start, 'valid Casablanca start time should parse');
assert.equal(depositDeadlineFor('2035-06-15', '12:00')?.getTime(), start.getTime() - 24 * 60 * 60 * 1000);
assert.equal(depositDeadlineFor('2035-06-15'), null, 'missing start time must remain manual review');
assert.equal(depositDeadlineFor('2035-06-15', '25:00'), null, 'invalid start time must not be guessed');
assert.equal(depositDeadlineFor('2035-02-30', '12:00'), null, 'invalid calendar date must not roll over');
assert.equal(depositDeadlineFor('2035-06-15'), null, 'missing activity start time must remain manual review');
assert.equal(isBelowRequiredDeposit('100', 0), true);
assert.equal(isBelowRequiredDeposit('100', 20), true);
assert.equal(isBelowRequiredDeposit('100', 49), true);
assert.equal(isBelowRequiredDeposit('100', 50), false);
assert.equal(isBelowRequiredDeposit('100', 100), false);
assert.equal(isBelowRequiredDeposit('100', Number.NaN), true, 'invalid paid amount is treated as unpaid');
console.log('Phase 1 reservation deadline harness: PASS');
