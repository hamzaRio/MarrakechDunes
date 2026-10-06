export interface ObjectUploadRequest {
  contentType?: string;
  size?: number;
}

export interface ObjectUploadGrant {
  uploadUrl: string;
  objectPath: string;
  /** Provider-neutral durable key when the selected provider exposes one. */
  objectKey?: string;
  method?: 'PUT';
  headers?: Record<string, string>;
  expiresAt?: string;
  publicUrl?: string;
}

export interface ObjectStat {
  size?: number;
  contentType?: string;
  etag?: string;
}

export interface ObjectStorageProvider {
  createUploadGrant(request?: ObjectUploadRequest): Promise<ObjectUploadGrant>;
  statObject?(objectKey: string): Promise<ObjectStat>;
  deleteObject?(objectKey: string): Promise<void>;
}
