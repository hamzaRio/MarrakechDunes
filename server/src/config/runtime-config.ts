import { z } from 'zod';
import { resolveCorsPolicy } from '../utils/cors-origins.js';
import { resolveStartupSeedingPolicy } from '../bootstrap/bootstrap-policy.js';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(10000),
  DATABASE_URL: z.string().trim().min(1).optional(),
  JWT_SECRET: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  SUPERADMIN_PASSWORD: z.string().min(1).optional(),
  CLIENT_URL: z.string().trim().min(1).optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).optional(),
  COOKIE_DOMAIN: z.string().trim().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).optional(),
  LEGACY_STARTUP_SEEDING: z.enum(['true', 'false']).optional(),
  SEED_DEMO_DATA: z.enum(['true', 'false']).optional(),
  ROLE: z.enum(['all', 'api', 'worker']).default('all'),
}).superRefine((env, context) => {
  const required = env.LEGACY_STARTUP_SEEDING === 'false'
    ? ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET'] as const
    : ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET', 'ADMIN_PASSWORD', 'SUPERADMIN_PASSWORD'] as const;
  for (const key of required) {
    if (!env[key]) context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: 'is required' });
  }
  if (!env.CLIENT_URL && !env.CORS_ALLOWED_ORIGINS) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['CLIENT_URL'], message: 'is required unless CORS_ALLOWED_ORIGINS is set' });
  }
  if (env.NODE_ENV === 'production') {
    if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['SESSION_SECRET'], message: 'must be at least 32 characters' });
    }
    for (const key of ['ADMIN_PASSWORD', 'SUPERADMIN_PASSWORD'] as const) {
      if (env[key] && env[key].length < 12) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: 'must be at least 12 characters' });
      }
      if (env[key] && ['admin', 'password', '123456'].includes(env[key])) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: 'must not use a development password' });
      }
    }
  }
});

export function parseRuntimeConfig(env: NodeJS.ProcessEnv) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid server configuration: ${errors.join('; ')}`);
  }

  const values = parsed.data;
  const production = values.NODE_ENV === 'production';
  const cookieSecure = values.COOKIE_SECURE === undefined ? production : values.COOKIE_SECURE === 'true';
  const cookieSameSite = values.COOKIE_SAMESITE || (production ? 'none' : 'lax');
  if (production && !cookieSecure) throw new Error('Invalid server configuration: COOKIE_SECURE must be true in production');
  if (cookieSameSite === 'none' && !cookieSecure) throw new Error('Invalid server configuration: COOKIE_SAMESITE=none requires COOKIE_SECURE=true');
  const cookieDomain = values.COOKIE_DOMAIN || undefined;
  if (cookieDomain && !/^\.?[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(cookieDomain)) {
    throw new Error('Invalid server configuration: COOKIE_DOMAIN must be a DNS domain');
  }

  return {
    nodeEnv: values.NODE_ENV,
    port: values.PORT,
    cors: resolveCorsPolicy(env, production),
    cookie: { secure: cookieSecure, sameSite: cookieSameSite, domain: cookieDomain },
    trustProxy: values.TRUST_PROXY ?? 1,
    seeding: resolveStartupSeedingPolicy(env),
    role: values.ROLE,
  };
}
