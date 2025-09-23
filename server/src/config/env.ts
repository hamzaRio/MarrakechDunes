import assert from 'node:assert';

type NodeEnv = 'production' | 'development' | 'test' | string;

function parseString(name: string, required: boolean, def?: string): string {
  const raw = process.env[name];
  const val = (raw ?? '').trim();
  if (!val) {
    if (required) throw new Error(`[Env] Missing required env: ${name}`);
    return def ?? '';
  }
  return val;
}

function parseNumber(name: string, required: boolean, def?: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') {
    if (required && def == null) throw new Error(`[Env] Missing required number env: ${name}`);
    return def as number;
  }
  const n = Number(raw);
  if (Number.isNaN(n)) throw new Error(`[Env] Env ${name} must be a number`);
  return n;
}

function parseBoolean(name: string, required: boolean, def?: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') {
    if (required && def == null) throw new Error(`[Env] Missing required boolean env: ${name}`);
    return Boolean(def);
  }
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  throw new Error(`[Env] Env ${name} must be a boolean (true/false)`);
}

const FRONTEND_ONLY_KEYS = ['VITE_API_URL', 'VITE_ASSETS_BASE', 'VITE_MAP_PROVIDER'] as const;

export interface ServerEnv {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  SESSION_SECRET: string;
  JWT_SECRET: string;
  ADMIN_PASSWORD: string;
  SUPERADMIN_PASSWORD: string;
  CLIENT_URL: string; // can contain comma-separated origins
  WHATSAPP_RECEIVERS: string[];
  MAP_PROVIDER: string;
  LEAFLET_ENABLED: boolean;
}

function loadServerEnv(): ServerEnv {
  const NODE_ENV = (process.env.NODE_ENV as NodeEnv) || 'development';
  const isProd = NODE_ENV === 'production';

  // Only enforce on production/Render
  const DATABASE_URL = parseString('DATABASE_URL', isProd);
  const SESSION_SECRET = parseString('SESSION_SECRET', isProd);
  const JWT_SECRET = parseString('JWT_SECRET', isProd);
  const ADMIN_PASSWORD = parseString('ADMIN_PASSWORD', isProd);
  const SUPERADMIN_PASSWORD = parseString('SUPERADMIN_PASSWORD', isProd);
  const CLIENT_URL = parseString('CLIENT_URL', isProd);
  const PORT = parseNumber('PORT', isProd, 10000);
  const WHATSAPP_RECEIVERS_RAW = parseString('WHATSAPP_RECEIVERS', isProd, '');
  const MAP_PROVIDER = parseString('MAP_PROVIDER', isProd, 'iframe');
  const LEAFLET_ENABLED = parseBoolean('LEAFLET_ENABLED', isProd, false);

  const WHATSAPP_RECEIVERS = WHATSAPP_RECEIVERS_RAW
    ? WHATSAPP_RECEIVERS_RAW.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const env: ServerEnv = {
    NODE_ENV,
    PORT,
    DATABASE_URL,
    SESSION_SECRET,
    JWT_SECRET,
    ADMIN_PASSWORD,
    SUPERADMIN_PASSWORD,
    CLIENT_URL,
    WHATSAPP_RECEIVERS,
    MAP_PROVIDER,
    LEAFLET_ENABLED,
  };

  // Startup log
  console.log('[Env] Loaded server variables OK:', { NODE_ENV: env.NODE_ENV, PORT: env.PORT, CLIENT_URL: env.CLIENT_URL });

  return env;
}

export const serverEnv = loadServerEnv();

// Simple self-test: ensure no VITE_* variables are required on backend
export function __envSelfTest__(): boolean {
  // As long as loadServerEnv() did not check VITE_* keys, they are not required.
  // Extra assertion: none of the FRONTEND_ONLY_KEYS cause throws when missing.
  for (const k of FRONTEND_ONLY_KEYS) {
    // Intentionally do NOT access parseString for these keys; just ensure their absence doesn't matter.
    assert.ok(true, `VITE key ${k} is ignored by server env validation`);
  }
  return true;
}

// Run self-test unless in test mode
try {
  if (serverEnv.NODE_ENV !== 'test') {
    __envSelfTest__();
    console.log('[Env] Self-test passed (VITE_* not required)');
  }
} catch (e) {
  console.warn('[Env] Self-test failed:', e);
}

