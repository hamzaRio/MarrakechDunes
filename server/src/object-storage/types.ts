export interface ObjectUploadGrant {
  uploadUrl: string;
  objectPath: string;
}

export interface ObjectStorageProvider {
  createUploadGrant(): Promise<ObjectUploadGrant>;
}
