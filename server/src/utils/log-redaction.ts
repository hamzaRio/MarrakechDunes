// M11: structured logs (LoggingService) and morgan access logs previously
// had no redaction at all - request IDs, customer phone numbers, emails,
// and anything accidentally passed through `metadata` (auth headers,
// cookies, tokens, passwords) were written to logs/stdout verbatim.
// redactLogValue() is applied to every log entry's context/metadata before
// it is formatted or written.

const SENSITIVE_KEY_PATTERN = /password|secret|token|authorization|auth[-_]?header|cookie|session[-_]?id|api[-_]?key|x-csrf|credit[-_]?card|card[-_]?number/i;
const PHONE_KEY_PATTERN = /phone/i;
const EMAIL_KEY_PATTERN = /email/i;

export function redactUrl(value: string): string {
  try {
    const parsed = new URL(value, 'http://local.invalid');
    return `${parsed.origin === 'http://local.invalid' ? '' : `${parsed.origin}`}${parsed.pathname}`;
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '[redacted]';
  return `***${digits.slice(-4)}`;
}

export function maskEmail(value: string): string {
  const at = value.indexOf('@');
  if (at <= 0) return '[redacted]';
  return `${value[0]}***${value.slice(at)}`;
}

/**
 * Recursively redacts sensitive fields from a log context/metadata object.
 * - Keys matching password/secret/token/authorization/cookie/apiKey/etc are
 *   fully replaced with "[redacted]".
 * - Keys containing "phone" or "email" are masked (last 4 digits / first
 *   char + domain) rather than dropped, so logs stay useful for support
 *   without exposing the full value.
 */
export function redactLogValue(value: unknown, keyHint?: string): unknown {
  if (value == null) return value;

  if (typeof value === 'string') {
    if (keyHint && SENSITIVE_KEY_PATTERN.test(keyHint)) return '[redacted]';
    if (keyHint && PHONE_KEY_PATTERN.test(keyHint)) return maskPhone(value);
    if (keyHint && EMAIL_KEY_PATTERN.test(keyHint)) return maskEmail(value);
    if (keyHint && /url|endpoint/i.test(keyHint)) return redactUrl(value);
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactLogValue(item, keyHint));
  }

  if (typeof value === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        redacted[key] = '[redacted]';
        continue;
      }
      redacted[key] = redactLogValue(val, key);
    }
    return redacted;
  }

  return value;
}
