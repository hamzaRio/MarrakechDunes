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
  return [...url.searchParams.keys()].some((key) => /^(x-amz-|x-goog-|signature$|googleaccessid$|expires$|token$)/i.test(key));
}

export function canonicalRecordId(value: string): string {
  const id = value.trim();
  if (!id) throw new Error('Migration record id must not be empty');
  return id;
}

function matchesLegacyPrefix(value: URL, prefix: string): boolean {
  try {
    const allowed = new URL(prefix);
    if (allowed.username || allowed.password || allowed.search || allowed.hash || !allowed.pathname.endsWith('/')) return false;
    return allowed.protocol === value.protocol && allowed.hostname.toLowerCase() === value.hostname.toLowerCase() && allowed.port === value.port && value.pathname.startsWith(allowed.pathname);
  } catch { return false; }
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
    if (!url.username && !url.password && legacyPrefixes.some((prefix) => matchesLegacyPrefix(url, prefix))) return 'legacy-gcs';
    if (url.protocol === 'http:' || url.protocol === 'https:') return 'external';
  } catch {
    return 'unknown';
  }
  return 'unknown';
}

export function deterministicTargetKey(recordId: string, sourceUrl: string): string {
  const canonicalId = canonicalRecordId(recordId);
  const digest = createHash('sha256').update(`${canonicalId}\n${sourceUrl}`).digest('hex').slice(0, 32);
  return `uploads/migrated/${canonicalId.replace(/[^A-Za-z0-9_-]/g, '_')}/${digest}`;
}

export function planMigration(records: Array<{ recordId: string; imageUrls: string[] }>, publicBaseUrl: string, knownOrigins: readonly string[] = [], legacyPrefixes: readonly string[] = []): MigrationManifestEntry[] {
  const base = publicBaseUrl.replace(/\/+$/, '');
  return records.flatMap((record) => record.imageUrls.map((rawSourceUrl) => {
    const sourceUrl = (() => { try { const url = new URL(rawSourceUrl); url.hash = ''; return url.toString(); } catch { return rawSourceUrl; } })();
    const sourceClassification = classifyImageUrl(rawSourceUrl, knownOrigins, legacyPrefixes);
    const canonicalId = record.recordId?.trim() || '';
    if (!canonicalId) return { recordId: '', sourceUrl, sourceClassification: 'unknown', skipReason: 'invalid-record-id', migrationState: 'skipped', verificationState: 'pending', originalUrl: rawSourceUrl };
    const signed = (() => { try { return isSignedQuery(new URL(rawSourceUrl)); } catch { return false; } })();
    if (sourceClassification !== 'replit-object' && sourceClassification !== 'legacy-gcs') {
      const skipReason = signed ? 'signed-url' : sourceClassification === 'external' ? 'external-url' : 'unknown-url';
      const safeSourceUrl = signed ? (() => { try { const url = new URL(rawSourceUrl); url.search = ''; url.hash = ''; return url.toString(); } catch { return sourceUrl; } })() : sourceUrl;
      return { recordId: canonicalId, sourceUrl: safeSourceUrl, sourceClassification, skipReason, migrationState: 'skipped', verificationState: 'pending', originalUrl: safeSourceUrl };
    }
    const targetObjectKey = deterministicTargetKey(canonicalId, rawSourceUrl);
    return { recordId: canonicalId, sourceUrl, sourceClassification, targetObjectKey, targetPublicUrl: `${base}/${targetObjectKey}`, migrationState: 'planned', verificationState: 'pending', originalUrl: rawSourceUrl };
  }));
}
