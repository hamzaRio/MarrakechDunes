# Configuration portability and provider ownership

Frozen rule: All third-party integration accounts are supplied by the deployment owner. The MarrakechDunes application must not require an account belonging to the original developer or seller. Replacing an integration credential must require configuration only, not a source-code modification.

Phase 2 does not transfer or revoke current accounts. Current production deployments can continue using their existing values. Phase 9 handles seller de-identification and ownership transfer.

The root `.env.example` is the canonical template. Frontend `VITE_API_URL` is build-time configuration for both public and admin builds. The server loads deployment environment variables or a local server-root environment file through `server/src/config/env.ts`; `runtime-config.ts` validates core values. A frontend build without an API URL reports a configuration error. Deployment tooling must set `VITE_API_URL` explicitly before rollout.

| Integration | Variables | Classification / secrecy | Missing behavior; current status | Buyer ownership / coupling / migration |
|---|---|---|---|---|
| MongoDB | DATABASE_URL | required, secret | startup fails; active | Buyer-owned; URL already replaceable. Keep current Mongo session store and indexes. |
| Security/bootstrap | SESSION_SECRET, JWT_SECRET, ADMIN_PASSWORD, SUPERADMIN_PASSWORD | required, secret | startup fails; active validation/bootstrap | Buyer-supplied eventually. Current staff identities/passwords and seed behavior remain unchanged until Phase 3. |
| Browser/CORS | VITE_API_URL, CORS_ALLOWED_ORIGINS, CORS_ALLOWED_ORIGIN_PATTERNS; legacy CLIENT_URL, VERCEL_PREVIEW_ORIGINS | required frontend URL + exact origin config, public | missing production browser URL errors; active | Buyer-owned domains; legacy scoped owner origins remain as a compatibility path when new CORS config is absent. No generic wildcard credentialed CORS. |
| Cookie/proxy | COOKIE_SECURE, COOKIE_SAMESITE, COOKIE_DOMAIN, TRUST_PROXY | optional, public | production defaults secure/none/no domain/one proxy hop; active | Buyer-configurable for later domain topology; cookie name, lifetime, CSRF and session store unchanged. |
| SMTP/Gmail | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM; legacy EMAIL_USER, EMAIL_PASS, EMAIL_FROM, EMAIL_PORT | optional; user/pass secret | no delivery without credentials; active | Buyer-owned account; Gmail host and sender fallback remain temporary compatibility. SMTP_* preferred. Do not disable current credentials. |
| Viator | VIATOR_API_KEY, VIATOR_API_BASE, VIATOR_API_LANGUAGE, VIATOR_API_CURRENCY, VIATOR_MARKET_INTELLIGENCE_ENABLED | optional; key secret | no official search without key; active | Buyer-owned key, configurable base. Market intelligence remains default-off. |
| GetYourGuide | GYG_PARTNER_API_TOKEN, GYG_PARTNER_API_BASE, GYG_PARTNER_API_LANGUAGE, GYG_PARTNER_API_CURRENCY; legacy GYG_SUPPLIER_* and GYG_ENABLE_LIVE_SEARCH | optional; token/user/pass secret | official search unavailable without token; supplier path legacy | Buyer-owned account. Existing credential names and optional legacy supplier path retained. |
| Bank Al-Maghrib | BAM_API_KEY, BAM_API_BASE | optional; key secret | approximate MAD display unavailable without rate; active | Buyer-supplied key; EUR original price retained. |
| WhatsApp | WHATSAPP_RECEIVERS and manual queue; other legacy WHATSAPP_* examples | optional; recipient values private | manual queue remains; hardcoded receiver fallback may be used | Buyer-owned number(s). Existing hardcoded fallback must remain until current production configuration is verified; later externalization. |
| Sentry | SENTRY_DSN, VITE_SENTRY_DSN | optional; server DSN private configuration, browser DSN public | monitoring disabled when absent; active optional | Buyer-owned project, configurable. |
| Rezdy | none confirmed in active runtime | unused/uncertain | no active integration identified | No account migration until implementation is confirmed. |
| Object storage | PUBLIC_OBJECT_SEARCH_PATHS, PRIVATE_OBJECT_DIR; Replit sidecar hardcoded in objectStorage.ts | optional paths, private; active route implementation | object operations fail if paths absent or sidecar unavailable | Buyer-owned target. Sidecar authentication is source-coupled and needs a later provider-neutral adapter; no behavior change in Phase 2. |
| Vercel/public and admin deployment | VITE_API_URL, VITE_ASSETS_BASE, VITE_SENTRY_DSN; client/vercel.json | optional asset URL, required production API URL | builds can deploy; browser API needs URL | Buyer-owned hosting. Current URLs remain representable through environment values; deploy configuration stays unchanged. |
| Render/API deployment | render.yaml, CLIENT_URL, server security/provider variables | mixed | existing manifest remains; server requires core variables | Buyer-owned hosting. Current manifest and scoped CORS compatibility preserved. |
| Resend/Twilio/AWS/Redis | names in older templates only | unused or uncertain | no active provider path confirmed | Do not promise functionality or provision them in Phase 2. |

## Personal and vendor defaults audit

- Safe now: vendor-specific frontend API inference removed. Examples use placeholders and generic domains.
- Temporary compatibility: scoped owner Vercel origins/previews in CORS fallback; hardcoded public links in notification/SEO content; Gmail SMTP/sender fallback; WhatsApp receiver/contact defaults; Render hostname in CSP. Removing these could change live behavior. The new CORS settings replace the owner-specific fallback when configured.
- Phase 3: hardcoded staff seed identities and bootstrap passwords/roles in storage remain untouched.
- Phase 9: owner personal contacts, account ownership, historical attribution and credentials must be de-identified/transferred with an explicit cutover plan.
- Object storage: Replit sidecar at loopback is currently source-coupled; this is a portability gap for a later phase. It is not disabled here.

## Stale variable audit

- JWT_SECRET: startup-required legacy value; no runtime JWT consumer found in the active application. Retained for compatibility.
- REDIS_URL: Render/template value, no active Redis client or cache consumer found. Candidate for later removal; in-memory cache remains.
- CSRF_TOKEN_SECRET: older example value, no active CSRF consumer; current CSRF uses the existing cookie/header token flow. Candidate for later removal.
- GYG_API_KEY and GYG_API_SECRET: older comprehensive-template names; official Partner API uses GYG_PARTNER_API_TOKEN. Legacy/unused candidate, not removed from production.
- WHATSAPP_API_URL and TWILIO_*: older template values; active messaging is the manual queue. No new sending integration is implied.