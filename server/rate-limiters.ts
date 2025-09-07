import rateLimit from "express-rate-limit";

// Global rate limiter (environment-aware)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 2000, // Much more relaxed limits
  message: {
    error: 'Too many requests, try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for auth and admin routes (environment-aware)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (changed to match global)
  max: process.env.NODE_ENV === 'production' ? 10 : 20, // Stricter for auth routes
  message: {
    error: 'Too many requests, try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
