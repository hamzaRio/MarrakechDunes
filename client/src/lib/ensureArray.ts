export function ensureArray<T>(v: T[] | T | null | undefined): T[] {
  return Array.isArray(v) ? v : (v == null ? [] : [v as T]);
}
