import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { CreateBucketCommand, DeleteBucketCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { copyAndVerifyObject, downloadTrustedSource, readValidatedSourceResponse, rollbackFixture, rewriteFixture } from './object-storage-migration-executor.js';
import { planMigration } from './object-storage-migration.js';

const image = Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const suffix = `${process.pid}-${Date.now()}-${randomUUID().slice(0, 8)}`;
const container = `marrakechdunes-migration-${suffix}`;
const bucket = `migration-${suffix}`.slice(0, 63);
const port = 16000 + (process.pid % 1000);
const endpoint = `http://127.0.0.1:${port}`;
const accessKeyId = 'phase10-rehearsal-access';
const secretAccessKey = 'phase10-rehearsal-secret-0123456789';
const client = new S3Client({ region: 'us-east-1', endpoint, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
let server: ReturnType<typeof createServer> | undefined;
function docker(args: string[], allowFailure = false): void { const result = spawnSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); if (!allowFailure && result.status !== 0) throw new Error(`Docker failed: ${args[0]}`); }
try {
  await assert.rejects(() => downloadTrustedSource('http://127.0.0.1:9/private', { allowedPrefixes: ['http://127.0.0.1/'] }));
  await assert.rejects(() => readValidatedSourceResponse(new Response(Buffer.from('bad'), { headers: { 'content-type': 'image/png' } })));
  await assert.rejects(() => readValidatedSourceResponse(new Response('x', { headers: { 'content-type': 'image/png', 'content-length': String(5 * 1024 * 1024 + 1) } })));
  server = createServer((request, response) => { if (request.url === '/objects/uploads/source') { response.setHeader('Content-Type', 'image/png'); response.end(image); } else { response.statusCode = 404; response.end(); } });
  await new Promise<void>((resolve, reject) => { server!.once('error', reject); server!.listen(port, '127.0.0.1', resolve); });
  docker(['run', '--detach', '--name', container, '--publish', `127.0.0.1:${port + 1}:9000`, '--env', `MINIO_ROOT_USER=${accessKeyId}`, '--env', `MINIO_ROOT_PASSWORD=${secretAccessKey}`, 'bitnamilegacy/minio@sha256:451fe6858cb770cc9d0e77ba811ce287420f781c7c1b806a386f6896471a349c']);
  const minioEndpoint = `http://127.0.0.1:${port + 1}`;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${minioEndpoint}/minio/health/ready`)).ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); }
  const minioClient = new S3Client({ region: 'us-east-1', endpoint: minioEndpoint, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
  await minioClient.send(new CreateBucketCommand({ Bucket: bucket }));
  const sourceUrl = `${endpoint}/objects/uploads/source`;
  const original = [{ recordId: 'activity/10', imageUrls: [sourceUrl, 'https://external.example/image.jpg'] }];
  const manifest = planMigration(original, `${minioEndpoint}/${bucket}`, [endpoint]);
  const planned = manifest.filter((entry) => entry.migrationState === 'planned');
  assert.equal(planned.length, 1);
  assert.match(planned[0].targetObjectKey || '', /^uploads\/migrated\//);
  const fixtureResponse = await fetch(sourceUrl, { redirect: 'manual' });
  const downloaded = await readValidatedSourceResponse(fixtureResponse);
  const verified = await copyAndVerifyObject(minioClient, bucket, planned[0], downloaded);
  const verifiedManifest = manifest.map((entry) => entry === planned[0] ? verified : entry);
  const blocked = rewriteFixture(original, manifest);
  assert.deepEqual(blocked, original);
  const rewritten = rewriteFixture(original, verifiedManifest);
  assert.notDeepEqual(rewritten, original);
  assert.equal(rewritten[0].imageUrls[1], original[0].imageUrls[1]);
  assert.deepEqual(rollbackFixture(rewritten, verifiedManifest), original);
  const exactOriginal = 'https://EXAMPLE.com:443/image.png?display=1#hero';
  const exactManifest = [{ recordId: 'a', originalUrl: exactOriginal, sourceUrl: 'https://example.com/image.png', sourceClassification: 'legacy-gcs' as const, targetObjectKey: 'uploads/migrated/a/x', targetPublicUrl: 'https://cdn.example/uploads/migrated/a/x', migrationState: 'verified' as const, verificationState: 'pending' as const }];
  assert.deepEqual(rollbackFixture([{ recordId: 'a', imageUrls: [exactManifest[0].targetPublicUrl] }], exactManifest), [{ recordId: 'a', imageUrls: [exactOriginal] }]);
  await assert.rejects(() => copyAndVerifyObject({ send: async () => { throw new Error('target put failed'); } } as any, 'bucket', exactManifest[0], { bytes: image, contentType: 'image/png', sha256: 'bad' }));
  assert.equal(planned[0].targetObjectKey, planMigration(original, `${minioEndpoint}/${bucket}`, [endpoint])[0].targetObjectKey);
  await minioClient.send(new DeleteObjectCommand({ Bucket: bucket, Key: planned[0].targetObjectKey! }));
  await minioClient.send(new DeleteBucketCommand({ Bucket: bucket }));
  minioClient.destroy();
  console.log('Object storage migration rehearsal harness: PASS');
} finally {
  server?.close();
  client.destroy();
  docker(['rm', '--force', '-v', container], true);
}
