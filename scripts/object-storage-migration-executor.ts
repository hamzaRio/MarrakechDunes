import { createHash } from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { MigrationManifestEntry } from './object-storage-migration.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export interface DownloadedSource { bytes: Buffer; contentType: string; sha256: string; }
export interface SourceDownloadOptions { allowedPrefixes: readonly string[]; fetcher?: (url: URL, init: RequestInit) => Promise<Response>; }

function privateAddress(address: string): boolean {
  if (net.isIPv4(address)) { const p = address.split('.').map(Number); return p[0] === 0 || p[0] === 10 || p[0] === 127 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168); }
  if (net.isIPv6(address)) { const value = address.toLowerCase(); return value === '::1' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb') || value.startsWith('::ffff:10.') || value.startsWith('::ffff:192.168.'); }
  return true;
}
async function assertPublicHost(hostname: string): Promise<void> {
  if (net.isIP(hostname) && privateAddress(hostname)) throw new Error('Migration source resolves to a private or reserved address');
  const answers = await dns.lookup(hostname, { all: true });
  if (!answers.length || answers.some(({ address }) => privateAddress(address))) throw new Error('Migration source resolves to a private or reserved address');
}
function trustedPrefix(url: URL, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => { try { const allowed = new URL(prefix); return !allowed.username && !allowed.password && !allowed.search && !allowed.hash && allowed.pathname.endsWith('/') && allowed.protocol === url.protocol && allowed.hostname.toLowerCase() === url.hostname.toLowerCase() && allowed.port === url.port && url.pathname.startsWith(allowed.pathname); } catch { return false; } });
}
function signatureMatches(type: string, bytes: Buffer): boolean { if (type === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])); if (type === 'image/jpeg') return bytes.subarray(0, 3).equals(Buffer.from([255,216,255])); if (type === 'image/gif') return bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a'; if (type === 'image/webp') return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'; return false; }
async function readBounded(response: Response): Promise<Buffer> {
  const declared = Number(response.headers.get('content-length') || 0); if (declared > MAX_BYTES) throw new Error('Migration source exceeds the 5 MB image policy');
  if (!response.body) throw new Error('Migration source body was empty');
  const reader = response.body.getReader(); const chunks: Buffer[] = []; let total = 0;
  while (true) { const next = await reader.read(); if (next.done) break; total += next.value.byteLength; if (total > MAX_BYTES) { await reader.cancel(); throw new Error('Migration source exceeds the 5 MB image policy'); } chunks.push(Buffer.from(next.value)); }
  return Buffer.concat(chunks, total);
}
export async function downloadTrustedSource(sourceUrl: string, options: SourceDownloadOptions): Promise<DownloadedSource> {
  const url = new URL(sourceUrl); if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Migration source must use HTTP(S)');
  if (!trustedPrefix(url, options.allowedPrefixes) && !options.fetcher) throw new Error('Migration source is outside the configured legacy allowlist');
  if (!options.fetcher) await assertPublicHost(url.hostname);
  const response = await (options.fetcher || fetch)(url, { redirect: 'manual', signal: AbortSignal.timeout(10_000) });
  if (response.status >= 300 && response.status < 400) throw new Error('Migration source redirects are not allowed');
  if (!response.ok) throw new Error(`Migration source returned HTTP ${response.status}`);
  const contentType = (response.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase(); if (!ALLOWED_TYPES.has(contentType)) throw new Error('Migration source content type is not an allowed image');
  const bytes = await readBounded(response); if (!signatureMatches(contentType, bytes)) throw new Error('Migration source bytes do not match the declared image type');
  return { bytes, contentType, sha256: createHash('sha256').update(bytes).digest('hex') };
}
export async function copyAndVerifyObject(client: S3Client, bucket: string, entry: MigrationManifestEntry, source: DownloadedSource): Promise<MigrationManifestEntry> {
  if (!entry.targetObjectKey) throw new Error('Migration entry has no target object key');
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: entry.targetObjectKey, Body: source.bytes, ContentType: source.contentType }));
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: entry.targetObjectKey })); if (head.ContentLength !== source.bytes.length || head.ContentType !== source.contentType) throw new Error('Target object metadata verification failed');
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: entry.targetObjectKey })); if (!result.Body) throw new Error('Target object readback was empty');
  const readback = Buffer.from(await result.Body.transformToByteArray()); if (createHash('sha256').update(readback).digest('hex') !== source.sha256) throw new Error('Target object content verification failed');
  return { ...entry, migrationState: 'verified' };
}
export function rewriteFixture(records: Array<{ recordId: string; imageUrls: string[] }>, manifest: MigrationManifestEntry[]): Array<{ recordId: string; imageUrls: string[] }> {
  const bySource = new Map(manifest.filter((entry) => entry.migrationState === 'verified' && entry.targetPublicUrl).map((entry) => [`${entry.recordId}\n${entry.originalUrl}`, entry.targetPublicUrl!]));
  return records.map((record) => ({ ...record, imageUrls: record.imageUrls.map((url) => bySource.get(`${record.recordId.trim()}\n${url}`) || url) }));
}
export function rollbackFixture(records: Array<{ recordId: string; imageUrls: string[] }>, manifest: MigrationManifestEntry[]): Array<{ recordId: string; imageUrls: string[] }> {
  const byTarget = new Map(manifest.filter((entry) => entry.migrationState === 'verified' && entry.targetPublicUrl).map((entry) => [`${entry.recordId}\n${entry.targetPublicUrl}`, entry.originalUrl]));
  return records.map((record) => ({ ...record, imageUrls: record.imageUrls.map((url) => byTarget.get(`${record.recordId.trim()}\n${url}`) || url) }));
}
