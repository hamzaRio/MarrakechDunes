import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { ObjectStat, ObjectStorageProvider, ObjectUploadGrant, ObjectUploadRequest } from './types.js';
import { requireAllowedImageContentType } from './upload-policy.js';

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

function publicUrl(base: string, key: string): string {
  return `${base.replace(/\/+$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function requireObjectKey(objectKey: string): string {
  const value = objectKey.trim();
  if (!/^uploads\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) || value.includes('..') || value.endsWith('/')) {
    throw new Error('Invalid object key');
  }
  return value;
}

export class S3CompatibleObjectStorageProvider implements ObjectStorageProvider {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly expiresIn: number;
  private readonly publicBaseUrl: string;

  constructor() {
    this.bucket = required('OBJECT_STORAGE_S3_BUCKET');
    this.publicBaseUrl = required('OBJECT_STORAGE_S3_PUBLIC_BASE_URL');
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
      requestChecksumCalculation: 'WHEN_REQUIRED',
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
    this.expiresIn = expiresSeconds();
  }

  async createUploadGrant(request: ObjectUploadRequest = {}): Promise<ObjectUploadGrant> {
    const contentType = requireAllowedImageContentType(request.contentType);
    const key = `uploads/${randomUUID()}`;
    const expiresAt = new Date(Date.now() + this.expiresIn * 1000).toISOString();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.expiresIn,
      signableHeaders: new Set(['content-type']),
    });
    return {
      uploadUrl,
      objectPath: `/objects/${key}`,
      objectKey: key,
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      expiresAt,
      publicUrl: publicUrl(this.publicBaseUrl, key),
    };
  }

  async statObject(objectKey: string): Promise<ObjectStat> {
    const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: requireObjectKey(objectKey) }));
    return {
      ...(typeof result.ContentLength === 'number' ? { size: result.ContentLength } : {}),
      ...(result.ContentType ? { contentType: result.ContentType } : {}),
      ...(result.ETag ? { etag: result.ETag } : {}),
    };
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: requireObjectKey(objectKey) }));
  }
}
