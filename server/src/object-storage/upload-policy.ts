export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export interface UploadRequestMetadata {
  contentType?: string;
  size?: number;
}

export function parseUploadRequest(body: unknown): UploadRequestMetadata {
  if (!body || typeof body !== 'object') return {};
  const value = body as { contentType?: unknown; size?: unknown };
  const contentType = typeof value.contentType === 'string' ? value.contentType.trim().toLowerCase() : undefined;
  if (contentType && !ALLOWED_IMAGE_TYPES.has(contentType)) throw new Error('Unsupported image content type');
  const size = value.size === undefined ? undefined : Number(value.size);
  if (size !== undefined && (!Number.isInteger(size) || size < 1 || size > MAX_UPLOAD_SIZE)) {
    throw new Error('Image size must be between 1 byte and 5 MB');
  }
  return { ...(contentType ? { contentType } : {}), ...(size !== undefined ? { size } : {}) };
}
