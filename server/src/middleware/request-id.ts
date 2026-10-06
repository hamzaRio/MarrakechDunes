import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

// M11: nothing previously generated a request/correlation ID, even though
// error-monitoring.ts already reads `x-request-id` as if something set it.
// This middleware uses an incoming x-request-id if the caller supplied one
// (useful behind a load balancer/CDN that already stamps one), otherwise
// generates a UUID, attaches it to req.requestId, and echoes it back on the
// response so a client/support ticket can reference the exact request.
const REQUEST_ID_HEADER = 'x-request-id';
// A conservative shape for a caller-supplied id: letters, digits, dashes,
// underscores, bounded length - never trust an arbitrary header value
// into logs/headers unchecked.
const VALID_REQUEST_ID = /^[A-Za-z0-9_-]{1,100}$/;

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get(REQUEST_ID_HEADER);
  const requestId = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  (req as any).requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
