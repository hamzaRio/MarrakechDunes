import assert from 'node:assert/strict';
import { classifyImageUrl, deterministicTargetKey, planMigration } from './object-storage-migration.js';

const records = [{ recordId: 'activity/1', imageUrls: [
  'https://marrakech.example/objects/uploads/old-image',
  'https://images.example/external.jpg',
  'not-a-url',
] }];
assert.equal(classifyImageUrl(records[0].imageUrls[0], ['https://marrakech.example']), 'replit-object');
assert.equal(classifyImageUrl(records[0].imageUrls[0]), 'external');
assert.equal(classifyImageUrl(records[0].imageUrls[1]), 'external');
assert.equal(classifyImageUrl(records[0].imageUrls[2]), 'unknown');
assert.equal(deterministicTargetKey('activity/1', records[0].imageUrls[0]), deterministicTargetKey('activity/1', records[0].imageUrls[0]));
const manifest = planMigration(records, 'https://cdn.example/images', ['https://marrakech.example']);
assert.equal(manifest.length, 3);
assert.equal(manifest[0].migrationState, 'planned');
assert.match(manifest[0].targetPublicUrl || '', /^https:\/\/cdn\.example\/images\/migrated\//);
assert.equal(manifest[1].migrationState, 'skipped');
assert.equal(manifest[2].migrationState, 'skipped');
assert.equal(JSON.stringify(manifest).includes('secret'), false);
console.log('Object storage migration harness: PASS');
