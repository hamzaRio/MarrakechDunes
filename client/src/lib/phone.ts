/** Normalize the digit-only value emitted by react-phone-input-2 to E.164. */
export function normalizePhoneE164(value: string): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

export function isValidPhoneE164(value: string): boolean {
  return /^\+\d{8,15}$/.test(value);
}
