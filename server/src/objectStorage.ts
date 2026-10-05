import { ReplitSidecarObjectStorageProvider } from './object-storage/replit-sidecar.js';
import type { ObjectStorageProvider, ObjectUploadGrant } from './object-storage/types.js';

function createProvider(): ObjectStorageProvider {
  const provider = (process.env.OBJECT_STORAGE_PROVIDER || 'replit-sidecar').trim().toLowerCase();
  if (provider === 'replit-sidecar') return new ReplitSidecarObjectStorageProvider();
  throw new Error(`Unsupported OBJECT_STORAGE_PROVIDER: ${provider}`);
}

export class ObjectStorageService {
  constructor(private readonly provider: ObjectStorageProvider = createProvider()) {}

  getObjectEntityUploadGrant(): Promise<ObjectUploadGrant> {
    return this.provider.createUploadGrant();
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const grant = await this.getObjectEntityUploadGrant();
    return grant.uploadUrl;
  }
}

export type { ObjectStorageProvider, ObjectUploadGrant } from './object-storage/types.js';
