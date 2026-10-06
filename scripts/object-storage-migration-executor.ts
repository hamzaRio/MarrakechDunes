import { createHash } from 'node:crypto';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { MigrationManifestEntry } from './object-storage-migration.js';

export interface DownloadedSource { bytes: Buffer; contentType: string; sha256: string; }

function trustedPrefix(url: URL, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => {
    try {
      const allowed = new URL(prefix);
      return !allowed.username && !allowed.password && allowed.protocol === url.protocol && allowed.hostname === url.hostname && allowed.port === url.port && url.href.startsWith(allowed.href);
    } catch { return false; }
  });
}

export async function downloadTrustedSource(sourceUrl: string, allowedPrefixes: readonly string[], allowLoopback = false): Promise<DownloadedSource> {
  const url = new URL(sourceUrl);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Migration source must use HTTP(S)');
  const loopback = allowLoopback && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
  if (!loopback && !trustedPrefix(url, allowedPrefixes)) throw new Error('Migration source is outside the configured legacy allowlist');
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(10_000) });
  if (response.status >= 300 && response.status < 400) throw new Error('Migration source redirects are not allowed');
  if (!response.ok) throw new Error(`Migration source returned HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = (response.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase();
  if (!contentType || !/^image\/(jpeg|png|webp|gif)$/.test(contentType)) throw new Error('Migration source content type is not an allowed image');
  if (bytes.length < 1 || bytes.length > 5 * 1024 * 1024) throw new Error('Migration source exceeds the 5 MB image policy');
  return { bytes, contentType, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export async function copyAndVerifyObject(client: S3Client, bucket: string, entry: MigrationManifestEntry, source: DownloadedSource): Promise<void> {
  if (!entry.targetObjectKey) throw new Error('Migration entry has no target object key');
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: entry.targetObjectKey, Body: source.bytes, ContentType: source.contentType }));
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: entry.targetObjectKey }));
  if (head.ContentLength !== source.bytes.length || head.ContentType !== source.contentType) throw new Error('Target object metadata verification failed');
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: entry.targetObjectKey }));
  if (!result.Body) throw new Error('Target object readback was empty');
  const readback = Buffer.from(await result.Body.transformToByteArray());
  if (createHash('sha256').update(readback).digest('hex') !== source.sha256) throw new Error('Target object content verification failed');
}

export function rewriteFixture(records: Array<{ recordId: string; imageUrls: string[] }>, manifest: MigrationManifestEntry[]): Array<{ recordId: string; imageUrls: string[] }> {
  const bySource = new Map(manifest.filter((entry) => ['planned', 'copied', 'verified', 'rewrite-simulated'].includes(entry.migrationState) && entry.targetPublicUrl).map((entry) => [`${entry.recordId}\n${entry.originalUrl}`, entry.targetPublicUrl!]));
  return records.map((record) => ({ ...record, imageUrls: record.imageUrls.map((url) => bySource.get(`${record.recordId}\n${url}`) || url) }));
}

export function rollbackFixture(records: Array<{ recordId: string; imageUrls: string[] }>, original: Array<{ recordId: string; imageUrls: string[] }>): Array<{ recordId: string; imageUrls: string[] }> {
  return original.map((record) => ({ recordId: record.recordId, imageUrls: [...record.imageUrls] }));
}
