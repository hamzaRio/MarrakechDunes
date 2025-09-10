import rateLimit from "express-rate-limit";
import { RateLimitError } from "./error-handler.js";
// Global rate limiter (environment-aware)
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000 : 2000, // Much more relaxed limits
    message: 'Too many requests, try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        const error = new RateLimitError('Too many requests, please try again later');
        res.status(429).json({
            status: 'error',
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        });
    }
});
// Stricter rate limiter for auth and admin routes (environment-aware)
export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes (changed to match global)
    max: process.env.NODE_ENV === 'production' ? 10 : 20, // Stricter for auth routes
    message: 'Too many requests, try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const error = new RateLimitError('Too many authentication attempts, please try again later');
        res.status(429).json({
            status: 'error',
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        });
    }
});
