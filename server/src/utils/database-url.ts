const CREDENTIALS_SEPARATOR = '@';

function ensureDecoded(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function resolveDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl || !rawUrl.trim()) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const trimmed = rawUrl.trim();
  const protocolSeparatorIndex = trimmed.indexOf('://');

  if (protocolSeparatorIndex === -1) {
    return trimmed;
  }

  const protocol = trimmed.slice(0, protocolSeparatorIndex);
  const remainder = trimmed.slice(protocolSeparatorIndex + 3);
  const atIndex = remainder.indexOf(CREDENTIALS_SEPARATOR);

  if (atIndex === -1) {
    return trimmed;
  }

  const credentials = remainder.slice(0, atIndex);
  const hostPart = remainder.slice(atIndex + 1);
  const colonIndex = credentials.indexOf(':');

  if (colonIndex === -1) {
    return trimmed;
  }

  const usernamePart = credentials.slice(0, colonIndex);
  const passwordPart = credentials.slice(colonIndex + 1);

  try {
    const decodedUsername = ensureDecoded(usernamePart);
    const decodedPassword = ensureDecoded(passwordPart);
    const encodedUsername = encodeURIComponent(decodedUsername);
    const encodedPassword = encodeURIComponent(decodedPassword);
    const hasChanged = encodedUsername !== usernamePart || encodedPassword !== passwordPart;

    if (!hasChanged) {
      return trimmed;
    }

    return `${protocol}://${encodedUsername}:${encodedPassword}@${hostPart}`;
  } catch (error) {
    console.warn('[database-url] Failed to normalize credentials. Using raw DATABASE_URL.', error);
    return trimmed;
  }
}

export function getRedactedDatabaseUrl(url: string): string {
  const protocolSeparatorIndex = url.indexOf('://');
  if (protocolSeparatorIndex === -1) {
    return url;
  }

  const protocol = url.slice(0, protocolSeparatorIndex + 3);
  const remainder = url.slice(protocolSeparatorIndex + 3);
  const atIndex = remainder.indexOf(CREDENTIALS_SEPARATOR);
  if (atIndex === -1) {
    return protocol + remainder;
  }

  const hostPart = remainder.slice(atIndex + 1);
  return `${protocol}***:***@${hostPart}`;
}
