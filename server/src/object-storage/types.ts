export interface ObjectUploadRequest {
  contentType?: string;
  size?: number;
}

export interface ObjectUploadGrant {
  uploadUrl: string;
  objectPath: string;
  method?: 'PUT';
  headers?: Record<string, string>;
  expiresAt?: string;
  publicUrl?: string;
}

export interface ObjectStorageProvider {
  createUploadGrant(request?: ObjectUploadRequest): Promise<ObjectUploadGrant>;
}
