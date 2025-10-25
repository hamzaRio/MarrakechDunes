import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function gygDebug(req: Request, res: Response, next: NextFunction) {
  if (process.env.GYG_DEBUG !== 'true') return next();

  const id = randomUUID();
  (res as any).locals = { ...(res as any).locals, gygDebugId: id };
  res.setHeader('X-Debug-Id', id);

  const authHeader = req.headers['authorization'];
  const hasBasicAuth = !!authHeader && authHeader.startsWith('Basic ');

  const start = Date.now();
  const finish = () => {
    const durationMs = Date.now() - start;
    // Single JSON line per request for easy log parsing
    console.log('[GYG-REQ]', JSON.stringify({
      id,
      time: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      hasBasicAuth,
      contentType: req.headers['content-type'] || null,
      contentLength: req.headers['content-length'] || null,
      durationMs
    }));
  };

  res.on('finish', finish);
  res.on('close', finish);
  next();
}
