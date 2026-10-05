import { randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { ObjectStorageProvider, ObjectUploadGrant, ObjectUploadRequest } from './types.js';

const DEFAULT_EXPIRES_SECONDS = 900;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for S3 object uploads`);
  return value;
}

function booleanEnv(name: string): boolean {
  return ['1', 'true', 'yes', 'on'].includes((process.env[name] || '').trim().toLowerCase());
}

function expiresSeconds(): number {
  const raw = Number(process.env.OBJECT_STORAGE_S3_UPLOAD_EXPIRES_SECONDS || DEFAULT_EXPIRES_SECONDS);
  if (!Number.isInteger(raw) || raw < 60 || raw > 3600) {
    throw new Error('OBJECT_STORAGE_S3_UPLOAD_EXPIRES_SECONDS must be an integer between 60 and 3600');
  }
  return raw;
}

function publicUrl(base: string | undefined, key: string): string | undefined {
  if (!base?.trim()) return undefined;
  return `${base.trim().replace(/\/+$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export class S3CompatibleObjectStorageProvider implements ObjectStorageProvider {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly expiresIn: number;

  constructor() {
    this.bucket = required('OBJECT_STORAGE_S3_BUCKET');
    const region = required('OBJECT_STORAGE_S3_REGION');
    const endpoint = process.env.OBJECT_STORAGE_S3_ENDPOINT?.trim() || undefined;
    const accessKeyId = process.env.OBJECT_STORAGE_S3_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.OBJECT_STORAGE_S3_SECRET_ACCESS_KEY?.trim();
    if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
      throw new Error('OBJECT_STORAGE_S3_ACCESS_KEY_ID and OBJECT_STORAGE_S3_SECRET_ACCESS_KEY must be provided together');
    }
    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: booleanEnv('OBJECT_STORAGE_S3_FORCE_PATH_STYLE'),
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
    this.expiresIn = expiresSeconds();
  }

  async createUploadGrant(request: ObjectUploadRequest = {}): Promise<ObjectUploadGrant> {
    const key = `uploads/${randomUUID()}`;
    const expiresAt = new Date(Date.now() + this.expiresIn * 1000).toISOString();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(request.contentType ? { ContentType: request.contentType } : {}),
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: this.expiresIn });
    return {
      uploadUrl,
      objectPath: `/objects/${key}`,
      method: 'PUT',
      ...(request.contentType ? { headers: { 'Content-Type': request.contentType } } : {}),
      expiresAt,
      publicUrl: publicUrl(process.env.OBJECT_STORAGE_S3_PUBLIC_BASE_URL, key),
    };
  }
}
