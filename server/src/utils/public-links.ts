// M12: owner-identifying links and contact numbers (the original developer's
// own Vercel URLs and personal WhatsApp number) used to be hardcoded into
// customer- and admin-facing notification text. They are now deployment
// configuration. A new owner sets these in the environment; if unset, the
// message omits the link/number rather than showing someone else's.
export function getPublicSiteUrl(): string {
  return (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
}

export function getAdminSiteUrl(): string {
  return (process.env.ADMIN_SITE_URL || '').trim().replace(/\/+$/, '');
}

export function getSupportPhoneDisplay(): string {
  return (process.env.SUPPORT_PHONE || '').trim();
}
