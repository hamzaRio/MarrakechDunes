import { randomUUID } from 'node:crypto';
import type { ObjectStorageProvider, ObjectUploadGrant, ObjectUploadRequest } from './types.js';

const DEFAULT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';

function privateObjectDir(): string {
  const configured = process.env.PRIVATE_OBJECT_DIR?.trim();
  if (!configured) throw new Error('PRIVATE_OBJECT_DIR is required for object uploads');
  return configured.replace(/\/+$/, '');
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const parts = normalized.split('/');
  if (parts.length < 3 || !parts[1] || !parts.slice(2).join('/')) {
    throw new Error('PRIVATE_OBJECT_DIR must contain a bucket and object prefix');
  }
  return { bucketName: parts[1], objectName: parts.slice(2).join('/') };
}

export class ReplitSidecarObjectStorageProvider implements ObjectStorageProvider {
  constructor(private readonly endpoint = process.env.OBJECT_STORAGE_SIDECAR_ENDPOINT?.trim() || DEFAULT_SIDECAR_ENDPOINT) {}

  async createUploadGrant(_request?: ObjectUploadRequest): Promise<ObjectUploadGrant> {
    const objectPath = `${privateObjectDir()}/uploads/${randomUUID()}`;
    const { bucketName, objectName } = parseObjectPath(objectPath);
    const response = await fetch(`${this.endpoint}/object-storage/signed-object-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket_name: bucketName, object_name: objectName, method: 'PUT', expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Object upload URL signing failed with HTTP ${response.status}`);
    const result = await response.json() as { signed_url?: unknown };
    if (typeof result.signed_url !== 'string' || !result.signed_url) throw new Error('Object upload URL signer returned an invalid response');
    return { uploadUrl: result.signed_url, objectPath: `/objects/uploads/${objectPath.split('/uploads/')[1]}` };
  }
}
