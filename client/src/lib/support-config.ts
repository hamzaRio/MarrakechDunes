export interface PublicSupportContact {
  name: string;
  role: string;
  phone: string;
}

function readContacts(): PublicSupportContact[] {
  const raw = import.meta.env.VITE_WHATSAPP_CONTACTS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is PublicSupportContact => {
      if (!entry || typeof entry !== 'object') return false;
      const value = entry as Record<string, unknown>;
      return typeof value.name === 'string' && typeof value.role === 'string' && typeof value.phone === 'string' && value.phone.trim().length > 0;
    });
  } catch {
    return [];
  }
}

export const supportContacts = readContacts();
export const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL || '').trim();
export const supportPhone = (import.meta.env.VITE_SUPPORT_PHONE || '').trim();
export const supportAddress = (import.meta.env.VITE_SUPPORT_ADDRESS || '').trim();
export const supportInstagramUrl = (import.meta.env.VITE_SUPPORT_INSTAGRAM_URL || '').trim();
export const supportInstagramHandle = (import.meta.env.VITE_SUPPORT_INSTAGRAM_HANDLE || '').trim();
