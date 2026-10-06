import { createHash } from 'node:crypto';

export type ImageSourceClassification = 'replit-object' | 'external' | 'unknown';

export interface MigrationManifestEntry {
  recordId: string;
  sourceUrl: string;
  sourceClassification: ImageSourceClassification;
  targetObjectKey?: string;
  targetPublicUrl?: string;
  migrationState: 'planned' | 'skipped';
  verificationState: 'pending';
  originalUrl: string;
}

export function classifyImageUrl(value: string, knownOrigins: readonly string[] = []): ImageSourceClassification {
  if (value.startsWith('/objects/')) return 'replit-object';
  try {
    const url = new URL(value);
    if (url.pathname.startsWith('/objects/') && knownOrigins.some((origin) => {
      try { return new URL(origin).origin === url.origin; } catch { return false; }
    })) return 'replit-object';
    if (url.protocol === 'http:' || url.protocol === 'https:') return 'external';
  } catch {
    return 'unknown';
  }
  return 'unknown';
}

export function deterministicTargetKey(recordId: string, sourceUrl: string): string {
  const digest = createHash('sha256').update(`${recordId}\n${sourceUrl}`).digest('hex').slice(0, 32);
  return `migrated/${recordId.replace(/[^A-Za-z0-9_-]/g, '_')}/${digest}`;
}

export function planMigration(records: Array<{ recordId: string; imageUrls: string[] }>, publicBaseUrl: string, knownOrigins: readonly string[] = []): MigrationManifestEntry[] {
  const base = publicBaseUrl.replace(/\/+$/, '');
  return records.flatMap((record) => record.imageUrls.map((sourceUrl) => {
    const sourceClassification = classifyImageUrl(sourceUrl, knownOrigins);
    if (sourceClassification !== 'replit-object') {
      return { recordId: record.recordId, sourceUrl, sourceClassification, migrationState: 'skipped', verificationState: 'pending', originalUrl: sourceUrl };
    }
    const targetObjectKey = deterministicTargetKey(record.recordId, sourceUrl);
    return { recordId: record.recordId, sourceUrl, sourceClassification, targetObjectKey, targetPublicUrl: `${base}/${targetObjectKey}`, migrationState: 'planned', verificationState: 'pending', originalUrl: sourceUrl };
  }));
}
