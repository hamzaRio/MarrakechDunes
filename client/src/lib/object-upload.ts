export interface CompletedObjectUpload {
  uploadURL?: string;
  meta?: Record<string, unknown>;
}

export function getDurableObjectUrl(file: CompletedObjectUpload): string | undefined {
  const publicUrl = file.meta?.publicUrl;
  if (typeof publicUrl === 'string' && publicUrl.trim()) return publicUrl;
  return typeof file.uploadURL === 'string' && file.uploadURL.trim() ? file.uploadURL : undefined;
}
