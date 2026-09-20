import type { Request, Response } from 'express';

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, { count: number; resetAt: number }>();

  constructor(
    readonly limit: number,
    readonly windowMs: number,
  ) {}

  consume(key: string, now = Date.now()): RateLimitDecision {
    const current = this.entries.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + this.windowMs }
      : current;

    entry.count += 1;
    this.entries.set(key, entry);
    this.prune(now);

    const allowed = entry.count <= this.limit;
    return {
      allowed,
      limit: this.limit,
      remaining: Math.max(0, this.limit - entry.count),
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  reset(): void {
    this.entries.clear();
  }

  private prune(now: number): void {
    if (this.entries.size < 1_000) return;
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}

export const GYG_RATE_LIMIT_CONFIG = {
  cachedRead: { limit: 60, windowMs: 60_000 },
  normalSearch: { limit: 10, windowMs: 5 * 60_000 },
  forceRefresh: { limit: 2, windowMs: 5 * 60_000 },
  adminAction: { limit: 5, windowMs: 5 * 60_000 },
} as const;

export type GYGRateLimitKind = keyof typeof GYG_RATE_LIMIT_CONFIG;

const limiters: Record<GYGRateLimitKind, FixedWindowRateLimiter> = {
  cachedRead: new FixedWindowRateLimiter(GYG_RATE_LIMIT_CONFIG.cachedRead.limit, GYG_RATE_LIMIT_CONFIG.cachedRead.windowMs),
  normalSearch: new FixedWindowRateLimiter(GYG_RATE_LIMIT_CONFIG.normalSearch.limit, GYG_RATE_LIMIT_CONFIG.normalSearch.windowMs),
  forceRefresh: new FixedWindowRateLimiter(GYG_RATE_LIMIT_CONFIG.forceRefresh.limit, GYG_RATE_LIMIT_CONFIG.forceRefresh.windowMs),
  adminAction: new FixedWindowRateLimiter(GYG_RATE_LIMIT_CONFIG.adminAction.limit, GYG_RATE_LIMIT_CONFIG.adminAction.windowMs),
};

const requestIdentity = (req: Request): string => {
  const session = req.session as any;
  const userId = session?.userId ?? session?.user?.id ?? session?.user?._id;
  return userId ? `user:${String(userId)}` : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
};

export function consumeGYGRateLimit(req: Request, res: Response, kind: GYGRateLimitKind): boolean {
  const decision = limiters[kind].consume(`${kind}:${requestIdentity(req)}`);
  res.setHeader('RateLimit-Limit', String(decision.limit));
  res.setHeader('RateLimit-Remaining', String(decision.remaining));
  res.setHeader('RateLimit-Reset', String(Math.ceil(decision.resetAt / 1000)));

  if (decision.allowed) return true;

  res.setHeader('Retry-After', String(decision.retryAfterSeconds));
  res.status(429).json({
    status: 'error',
    code: 'GYG_RATE_LIMITED',
    message: kind === 'forceRefresh'
      ? 'Too many GetYourGuide live refresh requests. Please wait before trying again.'
      : 'Too many GetYourGuide requests. Please wait before trying again.',
    retryAfter: decision.retryAfterSeconds,
  });
  return false;
}

