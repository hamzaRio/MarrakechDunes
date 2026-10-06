import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createObjectStorageProvider } from '../server/src/objectStorage.js';

const MINIO_IMAGE = 'bitnamilegacy/minio@sha256:451fe6858cb770cc9d0e77ba811ce287420f781c7c1b806a386f6896471a349c';
const accessKeyId = 'phase8b-test-access';
const secretAccessKey = 'phase8b-test-secret-0123456789';
const bucket = 'phase8b-images';
const suffix = `${process.pid}-${Date.now()}`;
const containerName = `marrakechdunes-minio-${suffix}`;
const networkName = `marrakechdunes-minio-net-${suffix}`;
const envKeys = [
  'OBJECT_STORAGE_PROVIDER',
  'OBJECT_STORAGE_S3_ENDPOINT',
  'OBJECT_STORAGE_S3_REGION',
  'OBJECT_STORAGE_S3_BUCKET',
  'OBJECT_STORAGE_S3_ACCESS_KEY_ID',
  'OBJECT_STORAGE_S3_SECRET_ACCESS_KEY',
  'OBJECT_STORAGE_S3_FORCE_PATH_STYLE',
  'OBJECT_STORAGE_S3_UPLOAD_EXPIRES_SECONDS',
  'OBJECT_STORAGE_S3_PUBLIC_BASE_URL',
];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

function docker(args: string[], allowFailure = false): string {
  const result = spawnSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (!allowFailure && result.status !== 0) {
    throw new Error(`Docker command failed (${args[0]}): ${result.stderr.trim() || 'no diagnostic output'}`);
  }
  return result.stdout.trim();
}

async function availablePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not reserve a local MinIO test port'));
        return;
      }
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForMinio(endpoint: string): Promise<void> {
  const deadline = Date.now() + 90_000;
  let lastError = 'no response';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${endpoint}/minio/health/ready`);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`MinIO readiness timed out (${lastError})`);
}

const testImage = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4x8AAAAASUVORK5CYII=',
  'base64',
);

let client: S3Client | undefined;
let uploadedKey: string | undefined;
let mismatchKey: string | undefined;
let bucketCreated = false;
let testFailure: unknown;
const cleanupFailures: string[] = [];

try {
  docker(['version']);
  const port = await availablePort();
  const endpoint = `http://127.0.0.1:${port}`;
  docker(['network', 'create', networkName]);
  docker([
    'run', '--detach', '--name', containerName, '--network', networkName,
    '--publish', `127.0.0.1:${port}:9000`,
    '--env', `MINIO_ROOT_USER=${accessKeyId}`,
    '--env', `MINIO_ROOT_PASSWORD=${secretAccessKey}`,
    MINIO_IMAGE,
  ]);
  await waitForMinio(endpoint);

  client = new S3Client({
    region: 'us-east-1',
    endpoint,
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    credentials: { accessKeyId, secretAccessKey },
  });
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
  bucketCreated = true;

  Object.assign(process.env, {
    OBJECT_STORAGE_PROVIDER: 's3',
    OBJECT_STORAGE_S3_ENDPOINT: endpoint,
    OBJECT_STORAGE_S3_REGION: 'us-east-1',
    OBJECT_STORAGE_S3_BUCKET: bucket,
    OBJECT_STORAGE_S3_ACCESS_KEY_ID: accessKeyId,
    OBJECT_STORAGE_S3_SECRET_ACCESS_KEY: secretAccessKey,
    OBJECT_STORAGE_S3_FORCE_PATH_STYLE: 'true',
    OBJECT_STORAGE_S3_UPLOAD_EXPIRES_SECONDS: '600',
    OBJECT_STORAGE_S3_PUBLIC_BASE_URL: `${endpoint}/${bucket}`,
  });

  const provider = createObjectStorageProvider();
  const grant = await provider.createUploadGrant({ contentType: 'image/png', size: testImage.length });
  const signedUrl = new URL(grant.uploadUrl);
  assert.equal(signedUrl.searchParams.has('x-amz-checksum-crc32'), false);
  assert.equal(signedUrl.searchParams.has('x-amz-sdk-checksum-algorithm'), false);
  assert.equal(signedUrl.searchParams.get('X-Amz-SignedHeaders'), 'content-type;host');
  assert.deepEqual(grant.headers, { 'Content-Type': 'image/png' });
  assert.equal(JSON.stringify(grant).includes(secretAccessKey), false);

  uploadedKey = grant.objectPath.replace(/^\/objects\//, '');
  assert.match(uploadedKey, /^uploads\/[0-9a-f-]+$/);
  assert.equal(grant.publicUrl, `${endpoint}/${bucket}/${uploadedKey}`);
  const put = await fetch(grant.uploadUrl, {
    method: 'PUT',
    headers: grant.headers,
    body: new Uint8Array(testImage),
  });
  assert.equal(put.ok, true, `Presigned PUT failed with HTTP ${put.status}`);

  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: uploadedKey }));
  assert.equal(head.ContentType, 'image/png');
  assert.equal(head.ContentLength, testImage.length);
  const fetched = await client.send(new GetObjectCommand({ Bucket: bucket, Key: uploadedKey }));
  assert.ok(fetched.Body);
  assert.deepEqual(Buffer.from(await fetched.Body.transformToByteArray()), testImage);

  const mismatchGrant = await provider.createUploadGrant({ contentType: 'image/png', size: testImage.length });
  mismatchKey = mismatchGrant.objectPath.replace(/^\/objects\//, '');
  const mismatchPut = await fetch(mismatchGrant.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: new Uint8Array(testImage),
  });
  const mismatchBody = await mismatchPut.text();
  assert.equal(mismatchPut.ok, false, 'PUT with a different signed Content-Type unexpectedly succeeded');
  assert.equal(mismatchPut.status, 403);
  assert.match(mismatchBody, /SignatureDoesNotMatch/i, 'MinIO did not report a signature mismatch');
  await assert.rejects(
    () => client!.send(new HeadObjectCommand({ Bucket: bucket, Key: mismatchKey })),
    (error: unknown) => typeof error === 'object' && error !== null && '$metadata' in error,
  );

  console.log('MinIO object storage E2E: PASS');
  console.log('Presigned PUT: HTTP 200; signed Content-Type mismatch: HTTP 403; readback: exact match; checksum query: absent');
} catch (error) {
  testFailure = error;
} finally {
  if (client && bucketCreated) {
    for (const key of [uploadedKey, mismatchKey]) {
      if (!key) continue;
      try {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch (error) {
        cleanupFailures.push(`object cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    try {
      await client.send(new DeleteBucketCommand({ Bucket: bucket }));
    } catch (error) {
      cleanupFailures.push(`bucket cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  client?.destroy();
  docker(['rm', '--force', '-v', containerName], true);
  docker(['network', 'rm', networkName], true);
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
}

if (testFailure) throw testFailure;
if (cleanupFailures.length > 0) throw new Error(cleanupFailures.join('; '));
