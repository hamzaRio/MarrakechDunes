/**
 * Live GetYourGuide calls are an opt-in capability.  Stored/manual market
 * references remain available when it is disabled; only outbound refreshes
 * are blocked.  This prevents an unconfigured provider from becoming a noisy
 * operational dependency.
 */
export const isGYGLiveIntegrationEnabled = (): boolean =>
  String(process.env.GYG_LIVE_INTEGRATION_ENABLED ?? '').trim().toLowerCase() === 'true';

export const GYG_LIVE_INTEGRATION_DISABLED_MESSAGE =
  'GetYourGuide live integration is disabled. Stored market references remain available.';
