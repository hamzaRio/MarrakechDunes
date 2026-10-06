import { createHash } from 'node:crypto';

export type ImageSourceClassification = 'replit-object' | 'legacy-gcs' | 'external' | 'unknown';
export type MigrationSkipReason = 'external-url' | 'unknown-url' | 'malformed-url' | 'unconfigured-legacy-prefix' | 'invalid-record-id' | 'signed-url';

export interface MigrationManifestEntry {
  recordId: string;
  sourceUrl: string;
  sourceClassification: ImageSourceClassification;
  skipReason?: MigrationSkipReason;
  targetObjectKey?: string;
  targetPublicUrl?: string;
  migrationState: 'planned' | 'skipped' | 'copied' | 'verified' | 'rewrite-simulated' | 'rollback-simulated' | 'failed';
  verificationState: 'pending';
  originalUrl: string;
}

function isSignedQuery(url: URL): boolean {
  return [...url.searchParams.keys()].some((key) => /^(x-amz-|signature$|googleaccessid$|expires$|token$)/i.test(key));
}

function exactOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return undefined;
    return url.origin;
  } catch { return undefined; }
}

export function classifyImageUrl(value: string, knownOrigins: readonly string[] = [], legacyPrefixes: readonly string[] = []): ImageSourceClassification {
  if (value.startsWith('/objects/')) return 'replit-object';
  try {
    const url = new URL(value);
    if (isSignedQuery(url)) return 'unknown';
    if (url.pathname.startsWith('/objects/') && knownOrigins.some((origin) => {
      return exactOrigin(origin) === url.origin && !url.username && !url.password;
    })) return 'replit-object';
    if (legacyPrefixes.some((prefix) => {
      try {
        const allowed = new URL(prefix);
        return !allowed.username && !allowed.password && allowed.protocol === url.protocol && allowed.hostname === url.hostname && allowed.port === url.port && url.href.startsWith(allowed.href);
      } catch { return false; }
    })) return 'legacy-gcs';
    if (url.protocol === 'http:' || url.protocol === 'https:') return 'external';
  } catch {
    return 'unknown';
  }
  return 'unknown';
}

export function deterministicTargetKey(recordId: string, sourceUrl: string): string {
  const digest = createHash('sha256').update(`${recordId}\n${sourceUrl}`).digest('hex').slice(0, 32);
  return `uploads/migrated/${recordId.replace(/[^A-Za-z0-9_-]/g, '_')}/${digest}`;
}

export function planMigration(records: Array<{ recordId: string; imageUrls: string[] }>, publicBaseUrl: string, knownOrigins: readonly string[] = [], legacyPrefixes: readonly string[] = []): MigrationManifestEntry[] {
  const base = publicBaseUrl.replace(/\/+$/, '');
  return records.flatMap((record) => record.imageUrls.map((rawSourceUrl) => {
    const sourceUrl = (() => { try { const url = new URL(rawSourceUrl); url.search = ''; url.hash = ''; return url.toString(); } catch { return rawSourceUrl; } })();
    const sourceClassification = classifyImageUrl(rawSourceUrl, knownOrigins, legacyPrefixes);
    if (!record.recordId?.trim()) return { recordId: '', sourceUrl, sourceClassification: 'unknown', skipReason: 'invalid-record-id', migrationState: 'skipped', verificationState: 'pending', originalUrl: sourceUrl };
    const signed = (() => { try { return isSignedQuery(new URL(rawSourceUrl)); } catch { return false; } })();
    if (sourceClassification !== 'replit-object' && sourceClassification !== 'legacy-gcs') {
      const skipReason = signed ? 'signed-url' : sourceClassification === 'external' ? 'external-url' : 'unknown-url';
      return { recordId: record.recordId.trim(), sourceUrl, sourceClassification, skipReason, migrationState: 'skipped', verificationState: 'pending', originalUrl: sourceUrl };
    }
    const targetObjectKey = deterministicTargetKey(record.recordId, sourceUrl);
    return { recordId: record.recordId.trim(), sourceUrl, sourceClassification, targetObjectKey, targetPublicUrl: `${base}/${targetObjectKey}`, migrationState: 'planned', verificationState: 'pending', originalUrl: sourceUrl };
  }));
}
