import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ObjectStorageService, type ObjectStorageProvider } from '../server/src/objectStorage.js';

const grant = { uploadUrl: 'https://storage.example.test/upload-token', objectPath: '/objects/uploads/test-id' };
const calls: number[] = [];
const provider: ObjectStorageProvider = { async createUploadGrant() { calls.push(1); return grant; } };
const service = new ObjectStorageService(provider);
assert.deepEqual(await service.getObjectEntityUploadGrant(), grant);
assert.equal(await service.getObjectEntityUploadURL(), grant.uploadUrl);
assert.equal(calls.length, 2);

const source = await readFile('server/src/routes/upload.ts', 'utf8');
assert.match(source, /uploadURL: grant\.uploadUrl/);
assert.match(source, /requireSuperAdmin/);
assert.doesNotMatch(source, /PRIVATE_OBJECT_DIR|127\.0\.0\.1:1106/);
console.log('Object storage abstraction harness: PASS');
