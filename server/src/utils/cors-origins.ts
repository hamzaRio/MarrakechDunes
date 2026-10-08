function splitList(value: string | undefined): string[] {
  return (value || '').split(',').map((entry) => entry.trim()).filter(Boolean);
}

function isExactOrigin(origin: string, isProduction: boolean): boolean {
  try {
    const url = new URL(origin);
    if (url.origin !== origin || url.username || url.password || origin.includes('*')) return false;
    if (url.protocol === 'https:') return true;
    return !isProduction && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function compileNarrowPattern(pattern: string): RegExp | null {
  // A wildcard is permitted only inside one DNS label with fixed text on
  // both sides. This cannot express a generic *.vercel.app trust rule.
  const match = /^https:\/\/([a-z0-9-]{2,})\*([a-z0-9-]{2,})\.([a-z0-9-]+(?:\.[a-z0-9-]+)+)$/i.exec(pattern);
  if (!match || match[1].endsWith('--') || match[2].startsWith('--')) return null;
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https:\\/\\/${escape(match[1])}[a-z0-9]+(?:-[a-z0-9]+)*${escape(match[2])}\\.${escape(match[3])}$`, 'i');
}

export interface CorsPolicy {
  allowedOrigins: string[];
  patterns: RegExp[];
  source: 'configured';
}

export function resolveCorsPolicy(env: NodeJS.ProcessEnv, isProduction: boolean): CorsPolicy {
  const hasNewConfig = env.CORS_ALLOWED_ORIGINS !== undefined || env.CORS_ALLOWED_ORIGIN_PATTERNS !== undefined;
  if (hasNewConfig) {
    const origins = splitList(env.CORS_ALLOWED_ORIGINS);
    const patternNames = splitList(env.CORS_ALLOWED_ORIGIN_PATTERNS);
    if (origins.length === 0) throw new Error('CORS_ALLOWED_ORIGINS must contain an exact origin');
    if (origins.some((origin) => !isExactOrigin(origin, isProduction))) {
      throw new Error('CORS_ALLOWED_ORIGINS contains an invalid or wildcard origin');
    }
    const patterns = patternNames.map((pattern) => compileNarrowPattern(pattern));
    if (patterns.some((pattern) => !pattern)) {
      throw new Error('CORS_ALLOWED_ORIGIN_PATTERNS contains an invalid or broad pattern');
    }
    return { allowedOrigins: [...new Set(origins)], patterns: patterns as RegExp[], source: 'configured' };
  }

  if (isProduction) {
    throw new Error('CORS_ALLOWED_ORIGINS is required in production');
  }
  const development = ['http://localhost:5173', 'http://localhost:5174'];
  const devExact = splitList(env.CLIENT_URL).filter((origin) => isExactOrigin(origin, isProduction));
  return { allowedOrigins: [...new Set([...devExact, ...development])], patterns: [], source: 'configured' };
}

export function isAllowedCorsOrigin(
  origin: string | undefined,
  allowedOrigins: readonly string[],
  isProduction: boolean,
  patterns: readonly RegExp[] = [],
): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) return true;
  return patterns.some((pattern) => pattern.test(origin));
}
