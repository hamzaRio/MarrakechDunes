export interface ApiUrlInputs {
  configured?: string;
  injected?: string;
  origin?: string;
  hostname?: string;
  production: boolean;
}

export function resolveApiBaseUrl(inputs: ApiUrlInputs): string {
  const configured = inputs.configured?.trim() || inputs.injected?.trim();
  let base = configured?.replace(/\/+$/, '');
  if (!base) {
    if (inputs.production) throw new Error('VITE_API_URL is required for production API access');
    base = inputs.hostname === 'localhost' || inputs.hostname === '127.0.0.1'
      ? inputs.origin
      : 'http://localhost:10000';
  }
  return base!.endsWith('/api') ? base! : `${base}/api`;
}

export function browserApiBaseUrl(): string {
  const browser = typeof window === 'undefined' ? undefined : window;
  const injected = browser && (browser as Window & { __API_URL__?: unknown }).__API_URL__;
  return resolveApiBaseUrl({
    configured: import.meta.env.VITE_API_URL,
    injected: typeof injected === 'string' ? injected : undefined,
    origin: browser?.location.origin,
    hostname: browser?.location.hostname,
    production: import.meta.env.PROD,
  });
}
