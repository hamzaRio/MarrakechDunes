import { ReplitSidecarObjectStorageProvider } from './object-storage/replit-sidecar.js';
import { S3CompatibleObjectStorageProvider } from './object-storage/s3-compatible.js';
import type { ObjectStat, ObjectStorageProvider, ObjectUploadGrant, ObjectUploadRequest } from './object-storage/types.js';

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

  async statObject(objectKey: string): Promise<ObjectStat> {
    if (!this.provider.statObject) throw new Error('Object stat is not supported by the configured provider');
    return this.provider.statObject(objectKey);
  }

  async deleteObject(objectKey: string): Promise<void> {
    if (!this.provider.deleteObject) throw new Error('Object deletion is not supported by the configured provider');
    return this.provider.deleteObject(objectKey);
  }
}

export type { ObjectStat, ObjectStorageProvider, ObjectUploadGrant, ObjectUploadRequest } from './object-storage/types.js';
