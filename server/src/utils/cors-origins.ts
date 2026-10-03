/**
 * Matches only preview deployments belonging to the MarrakechDunes Vercel
 * project under the hamzarios-projects account.
 */
export function isMarrakechDunesPreviewOrigin(origin: string): boolean {
  return /^https:\/\/marrakech-dunes-[a-z0-9]+(?:-[a-z0-9]+)*-hamzarios-projects\.vercel\.app$/i.test(origin);
}

export function isAllowedCorsOrigin(
  origin: string | undefined,
  allowedOrigins: readonly string[],
  isProduction: boolean,
): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) return true;
  return isMarrakechDunesPreviewOrigin(origin);
}
