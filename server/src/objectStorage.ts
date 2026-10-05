import { ReplitSidecarObjectStorageProvider } from './object-storage/replit-sidecar.js';
import { S3CompatibleObjectStorageProvider } from './object-storage/s3-compatible.js';
import type { ObjectStorageProvider, ObjectUploadGrant, ObjectUploadRequest } from './object-storage/types.js';

export function createObjectStorageProvider(): ObjectStorageProvider {
  const provider = (process.env.OBJECT_STORAGE_PROVIDER || 'replit-sidecar').trim().toLowerCase();
  if (provider === 'replit-sidecar') return new ReplitSidecarObjectStorageProvider();
  if (provider === 's3') return new S3CompatibleObjectStorageProvider();
  throw new Error(`Unsupported OBJECT_STORAGE_PROVIDER: ${provider}`);
}

export class ObjectStorageService {
  constructor(private readonly provider: ObjectStorageProvider = createObjectStorageProvider()) {}

  getObjectEntityUploadGrant(request?: ObjectUploadRequest): Promise<ObjectUploadGrant> {
    return this.provider.createUploadGrant(request);
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const grant = await this.getObjectEntityUploadGrant();
    return grant.uploadUrl;
  }
}

export type { ObjectStorageProvider, ObjectUploadGrant, ObjectUploadRequest } from './object-storage/types.js';
