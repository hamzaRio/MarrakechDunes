import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createObjectStorageProvider, ObjectStorageService } from '../server/src/objectStorage.js';
import { ReplitSidecarObjectStorageProvider } from '../server/src/object-storage/replit-sidecar.js';
import { S3CompatibleObjectStorageProvider } from '../server/src/object-storage/s3-compatible.js';
import { parseUploadRequest } from '../server/src/object-storage/upload-policy.js';
import { getDurableObjectUrl } from '../client/src/lib/object-upload.js';

const envKeys = [
  'OBJECT_STORAGE_PROVIDER', 'PRIVATE_OBJECT_DIR', 'OBJECT_STORAGE_SIDECAR_ENDPOINT',
  'OBJECT_STORAGE_S3_ENDPOINT', 'OBJECT_STORAGE_S3_REGION', 'OBJECT_STORAGE_S3_BUCKET',
  'OBJECT_STORAGE_S3_ACCESS_KEY_ID', 'OBJECT_STORAGE_S3_SECRET_ACCESS_KEY',
  'OBJECT_STORAGE_S3_FORCE_PATH_STYLE', 'OBJECT_STORAGE_S3_UPLOAD_EXPIRES_SECONDS',
  'OBJECT_STORAGE_S3_PUBLIC_BASE_URL',
];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;

try {
  process.env.OBJECT_STORAGE_PROVIDER = 'replit-sidecar';
  process.env.PRIVATE_OBJECT_DIR = '/bucket/private';
  process.env.OBJECT_STORAGE_SIDECAR_ENDPOINT = 'http://sidecar.test';
  let sidecarRequest: Record<string, unknown> | undefined;
  globalThis.fetch = (async (_input, init) => {
    sidecarRequest = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ signed_url: 'https://sidecar.test/signed' }), { status: 200 });
  }) as typeof fetch;
  const replit = createObjectStorageProvider();
  assert.ok(replit instanceof ReplitSidecarObjectStorageProvider);
  const replitGrant = await replit.createUploadGrant({ contentType: 'image/png', size: 1024 });
  assert.match(replitGrant.objectPath, /^\/objects\/uploads\/[0-9a-f-]+$/);
  assert.equal(sidecarRequest?.method, 'PUT');
  assert.deepEqual(parseUploadRequest({ contentType: 'IMAGE/PNG', size: 1024 }), { contentType: 'image/png', size: 1024 });
  assert.deepEqual(parseUploadRequest({ size: 1024 }), { size: 1024 });
  assert.throws(() => parseUploadRequest({ contentType: 'application/pdf' }), /Unsupported image content type/);
  assert.throws(() => parseUploadRequest({ size: 5 * 1024 * 1024 + 1 }), /Image size/);

  process.env.OBJECT_STORAGE_PROVIDER = 's3';
  process.env.OBJECT_STORAGE_S3_ENDPOINT = 'https://minio.test';
  process.env.OBJECT_STORAGE_S3_REGION = 'auto';
  process.env.OBJECT_STORAGE_S3_BUCKET = 'images';
  process.env.OBJECT_STORAGE_S3_ACCESS_KEY_ID = 'test-access';
  process.env.OBJECT_STORAGE_S3_SECRET_ACCESS_KEY = 'test-secret-value';
  process.env.OBJECT_STORAGE_S3_FORCE_PATH_STYLE = 'true';
  process.env.OBJECT_STORAGE_S3_UPLOAD_EXPIRES_SECONDS = '600';
  process.env.OBJECT_STORAGE_S3_PUBLIC_BASE_URL = 'https://cdn.test/images';
  const s3 = createObjectStorageProvider();
  assert.ok(s3 instanceof S3CompatibleObjectStorageProvider);
  const s3Grant = await s3.createUploadGrant({ contentType: 'image/jpeg', size: 2048 });
  const signedUrl = new URL(s3Grant.uploadUrl);
  assert.match(s3Grant.objectPath, /^\/objects\/uploads\/[0-9a-f-]+$/);
  assert.match(s3Grant.objectKey || '', /^uploads\/[0-9a-f-]+$/);
  assert.match(s3Grant.uploadUrl, /^https:\/\/minio\.test\/images\/uploads\//);
  assert.match(s3Grant.uploadUrl, /X-Amz-Credential=/);
  assert.equal(signedUrl.searchParams.has('x-amz-checksum-crc32'), false);
  assert.equal(signedUrl.searchParams.has('x-amz-sdk-checksum-algorithm'), false);
  assert.equal(signedUrl.searchParams.get('X-Amz-SignedHeaders'), 'content-type;host');
  assert.equal(s3Grant.method, 'PUT');
  assert.deepEqual(s3Grant.headers, { 'Content-Type': 'image/jpeg' });
  assert.match(s3Grant.publicUrl || '', /^https:\/\/cdn\.test\/images\/uploads\//);
  assert.ok(!JSON.stringify(s3Grant).includes('test-secret-value'));
  assert.equal(signedUrl.hostname, 'minio.test');
  assert.match(signedUrl.pathname, /^\/images\/uploads\//);
  assert.equal(s3Grant.objectPath.slice('/objects/'.length), decodeURIComponent(signedUrl.pathname.replace(/^\/images\//, '')));
  await assert.rejects(() => s3.createUploadGrant({ size: 128 }), /Image content type is required/);
  await assert.rejects(() => s3.createUploadGrant({ contentType: 'application/pdf' }), /Unsupported image content type/);

  delete process.env.OBJECT_STORAGE_S3_PUBLIC_BASE_URL;
  assert.throws(() => createObjectStorageProvider(), /OBJECT_STORAGE_S3_PUBLIC_BASE_URL/);
  process.env.OBJECT_STORAGE_S3_PUBLIC_BASE_URL = 'https://cdn.test/images';

  delete process.env.OBJECT_STORAGE_S3_BUCKET;
  assert.throws(() => createObjectStorageProvider(), /OBJECT_STORAGE_S3_BUCKET/);
  process.env.OBJECT_STORAGE_S3_BUCKET = 'images';
  process.env.OBJECT_STORAGE_PROVIDER = 'unknown';
  assert.throws(() => createObjectStorageProvider(), /Unsupported OBJECT_STORAGE_PROVIDER/);

  const fakeGrant = { uploadUrl: 'https://storage.test/upload', objectPath: '/objects/uploads/id' };
  const service = new ObjectStorageService({ async createUploadGrant() { return fakeGrant; } });
  assert.deepEqual(await service.getObjectEntityUploadGrant(), fakeGrant);
  assert.equal(await service.getObjectEntityUploadURL(), fakeGrant.uploadUrl);
  await assert.rejects(() => service.statObject('uploads/example'), /not supported/);
  await assert.rejects(() => service.deleteObject('uploads/example'), /not supported/);

  assert.equal(getDurableObjectUrl({ uploadURL: 'https://upload.test/presigned' }), 'https://upload.test/presigned');
  assert.equal(getDurableObjectUrl({
    uploadURL: 'https://upload.test/presigned',
    meta: { publicUrl: 'https://cdn.test/images/object' },
  }), 'https://cdn.test/images/object');
  assert.equal(getDurableObjectUrl({ meta: { publicUrl: '' } }), undefined);

  const route = await readFile('server/src/routes/upload.ts', 'utf8');
  assert.match(route, /uploadRateLimit/);
  assert.match(route, /Image content type/);
  assert.match(route, /uploadURL: grant\.uploadUrl/);
  assert.match(route, /uploadUrl: grant\.uploadUrl/);
  assert.match(route, /publicUrl/);
  assert.doesNotMatch(route, /PRIVATE_OBJECT_DIR|127\.0\.0\.1:1106/);
  console.log('Object storage provider harness: PASS');
} finally {
  globalThis.fetch = originalFetch;
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
}
