export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface GYGResilienceOptions {
  failureThreshold?: number;
  cooldownMs?: number;
  maxConcurrent?: number;
  maxQueueSize?: number;
  now?: () => number;
}

export const GYG_RESILIENCE_CONFIG = {
  failureThreshold: 5,
  cooldownMs: 45_000,
  maxConcurrent: 2,
  maxQueueSize: 20,
} as const;

export class GYGCircuitOpenError extends Error {
  readonly code = 'GYG_CIRCUIT_OPEN';
  readonly statusCode = 503;

  constructor(readonly retryAfterMs: number) {
    super('GetYourGuide live service is temporarily unavailable.');
    this.name = 'GYGCircuitOpenError';
  }
}

export class GYGQueueSaturatedError extends Error {
  readonly code = 'GYG_QUEUE_SATURATED';
  readonly statusCode = 503;

  constructor() {
    super('GetYourGuide request capacity is temporarily full.');
    this.name = 'GYGQueueSaturatedError';
  }
}

const upstreamStatus = (error: any): number | undefined =>
  error?.response?.status ?? error?.statusCode ?? error?.status;

export function isQualifyingGYGFailure(error: unknown): boolean {
  if (error instanceof GYGCircuitOpenError || error instanceof GYGQueueSaturatedError) return false;

  const status = upstreamStatus(error);
  if (status === 401 || status === 403 || status === 429 || (status != null && status >= 500)) return true;
  if (status != null && status >= 400 && status < 500) return false;

  const code = String((error as any)?.code ?? '').toUpperCase();
  if (['ECONNABORTED', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'GYG_CONFIGURATION'].includes(code)) {
    return true;
  }

  // Operations passed to this controller are outbound GYG operations only;
  // an unclassified thrown error therefore represents an upstream failure.
  return error instanceof Error;
}

const isCredentialFailure = (error: unknown): boolean => {
  const status = upstreamStatus(error);
  return status === 401 || status === 403 || (error as any)?.code === 'GYG_CONFIGURATION';
};

export class GYGResilienceController {
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly maxConcurrent: number;
  private readonly maxQueueSize: number;
  private readonly now: () => number;
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly queue: Array<(release: () => void) => void> = [];
  private activeOutbound = 0;
  private circuitState: CircuitState = 'CLOSED';
  private failureCount = 0;
  private openedAt: number | null = null;
  private halfOpenProbeInFlight = false;

  constructor(options: GYGResilienceOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? GYG_RESILIENCE_CONFIG.failureThreshold;
    this.cooldownMs = options.cooldownMs ?? GYG_RESILIENCE_CONFIG.cooldownMs;
    this.maxConcurrent = options.maxConcurrent ?? GYG_RESILIENCE_CONFIG.maxConcurrent;
    this.maxQueueSize = options.maxQueueSize ?? GYG_RESILIENCE_CONFIG.maxQueueSize;
    this.now = options.now ?? Date.now;
  }

  run<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const normalizedKey = key.trim().toLowerCase();
    const existing = this.inFlight.get(normalizedKey) as Promise<T> | undefined;
    if (existing) return existing;

    let request!: Promise<T>;
    request = this.execute(operation).finally(() => {
      if (this.inFlight.get(normalizedKey) === request) this.inFlight.delete(normalizedKey);
    });
    this.inFlight.set(normalizedKey, request);
    return request;
  }

  getDiagnostics() {
    this.transitionAfterCooldown();
    return {
      circuitState: this.circuitState,
      failureCount: this.failureCount,
      openedAt: this.openedAt == null ? null : new Date(this.openedAt).toISOString(),
      nextProbeAt: this.openedAt == null ? null : new Date(this.openedAt + this.cooldownMs).toISOString(),
      inFlightCount: this.inFlight.size,
      activeOutboundCount: this.activeOutbound,
      queuedOutboundCount: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize,
    };
  }

  reset(): void {
    this.circuitState = 'CLOSED';
    this.failureCount = 0;
    this.openedAt = null;
    this.halfOpenProbeInFlight = false;
    this.inFlight.clear();
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.ensureCanQueue();
    let probe = false;
    try {
      const release = await this.acquire();
      try {
        probe = this.beforeRequest();
        const result = await operation();
        this.onSuccess(probe);
        return result;
      } finally {
        release();
      }
    } catch (error) {
      this.onFailure(error, probe);
      throw error;
    }
  }

  private ensureCanQueue(): void {
    this.transitionAfterCooldown();
    if (this.circuitState === 'OPEN') {
      const remaining = Math.max(1, (this.openedAt ?? this.now()) + this.cooldownMs - this.now());
      throw new GYGCircuitOpenError(remaining);
    }
    if (this.circuitState === 'HALF_OPEN' && this.halfOpenProbeInFlight) {
      throw new GYGCircuitOpenError(this.cooldownMs);
    }
  }

  private beforeRequest(): boolean {
    this.transitionAfterCooldown();

    if (this.circuitState === 'OPEN') {
      const remaining = Math.max(1, (this.openedAt ?? this.now()) + this.cooldownMs - this.now());
      throw new GYGCircuitOpenError(remaining);
    }

    if (this.circuitState === 'HALF_OPEN') {
      if (this.halfOpenProbeInFlight) throw new GYGCircuitOpenError(this.cooldownMs);
      this.halfOpenProbeInFlight = true;
      return true;
    }

    return false;
  }

  private transitionAfterCooldown(): void {
    if (this.circuitState === 'OPEN' && this.openedAt != null && this.now() - this.openedAt >= this.cooldownMs) {
      this.circuitState = 'HALF_OPEN';
      this.halfOpenProbeInFlight = false;
    }
  }

  private onSuccess(probe: boolean): void {
    if (probe) {
      this.circuitState = 'CLOSED';
      this.failureCount = 0;
      this.openedAt = null;
      this.halfOpenProbeInFlight = false;
      return;
    }

    if (this.circuitState === 'CLOSED') this.failureCount = 0;
  }

  private onFailure(error: unknown, probe: boolean): void {
    if (error instanceof GYGCircuitOpenError) return;

    if (!isQualifyingGYGFailure(error)) {
      if (probe) this.openCircuit();
      return;
    }

    this.failureCount += 1;
    if (probe || isCredentialFailure(error) || this.failureCount >= this.failureThreshold) {
      this.openCircuit();
    }
  }

  private openCircuit(): void {
    this.circuitState = 'OPEN';
    this.openedAt = this.now();
    this.halfOpenProbeInFlight = false;
  }

  private acquire(): Promise<() => void> {
    if (this.activeOutbound < this.maxConcurrent) {
      this.activeOutbound += 1;
      return Promise.resolve(this.releaseFactory());
    }

    if (this.queue.length >= this.maxQueueSize) {
      return Promise.reject(new GYGQueueSaturatedError());
    }

    return new Promise((resolve) => this.queue.push(resolve));
  }

  private releaseFactory(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.activeOutbound -= 1;
      const next = this.queue.shift();
      if (next) {
        this.activeOutbound += 1;
        next(this.releaseFactory());
      }
    };
  }
}

export const gygResilience = new GYGResilienceController();

export const gygRequestKey = (kind: string, query: unknown, currency = 'MAD', locale = 'en') =>
  `${kind}:${String(query ?? '').trim().toLowerCase()}:${currency.toUpperCase()}:${locale.toLowerCase()}`;

export const isGYGServiceUnavailable = (error: unknown) =>
  error instanceof GYGCircuitOpenError || error instanceof GYGQueueSaturatedError;
