# Configuration portability and provider ownership

Frozen rule: All third-party integration accounts are supplied by the deployment owner. The MarrakechDunes application must not require an account belonging to the original developer or seller. Replacing an integration credential must require configuration only, not a source-code modification.

Phase 2 does not transfer or revoke current accounts. Current production deployments can continue using their existing values. Phase 9 handles seller de-identification and ownership transfer.

The root `.env.example` is the canonical template. Frontend `VITE_API_URL` is build-time configuration for both public and admin builds. The server loads deployment environment variables or a local server-root environment file through `server/src/config/env.ts`; `runtime-config.ts` validates core values. A frontend build without an API URL reports a configuration error. Deployment tooling must set `VITE_API_URL` explicitly before rollout.

| Integration | Variables | Classification / secrecy | Missing behavior; current status | Buyer ownership / coupling / migration |
|---|---|---|---|---|
| MongoDB | DATABASE_URL | required, secret | startup fails; active | Buyer-owned; URL already replaceable. Keep current Mongo session store and indexes. |
| Security/bootstrap | SESSION_SECRET, JWT_SECRET, ADMIN_PASSWORD, SUPERADMIN_PASSWORD | required, secret | startup fails; active validation/bootstrap | Buyer-supplied eventually. Current staff identities/passwords and seed behavior remain unchanged until Phase 3. |
| Browser/CORS | VITE_API_URL, CORS_ALLOWED_ORIGINS, CORS_ALLOWED_ORIGIN_PATTERNS; development-only CLIENT_URL | required frontend URL + exact origin config, public | missing production browser URL errors; active | Buyer-owned domains; production fails closed without exact deployment-owned origins. No generic wildcard credentialed CORS. |
| Cookie/proxy | COOKIE_SECURE, COOKIE_SAMESITE, COOKIE_DOMAIN, TRUST_PROXY | optional, public | production defaults secure/none/no domain/one proxy hop; active | Buyer-configurable for later domain topology; cookie name, lifetime, CSRF and session store unchanged. |
| SMTP/Gmail | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM; legacy EMAIL_USER, EMAIL_PASS, EMAIL_FROM, EMAIL_PORT | optional; user/pass secret | no delivery without credentials; active | Buyer-owned account; Gmail host and sender fallback remain temporary compatibility. SMTP_* preferred. Do not disable current credentials. |
| Viator | VIATOR_API_KEY, VIATOR_API_BASE, VIATOR_API_LANGUAGE, VIATOR_API_CURRENCY, VIATOR_MARKET_INTELLIGENCE_ENABLED | optional; key secret | no official search without key; active | Buyer-owned key, configurable base. Market intelligence remains default-off. |
| GetYourGuide | GYG_PARTNER_API_TOKEN, GYG_PARTNER_API_BASE, GYG_PARTNER_API_LANGUAGE, GYG_PARTNER_API_CURRENCY; legacy GYG_SUPPLIER_* and GYG_ENABLE_LIVE_SEARCH | optional; token/user/pass secret | official search unavailable without token; supplier path legacy | Buyer-owned account. Existing credential names and optional legacy supplier path retained. |
| Bank Al-Maghrib | BAM_API_KEY, BAM_API_BASE | optional; key secret | approximate MAD display unavailable without rate; active | Buyer-supplied key; EUR original price retained. |
| WhatsApp | WHATSAPP_RECEIVERS, WHATSAPP_RECEIVER_NAMES and manual queue | optional; recipient values private | manual queue remains; contacts are omitted until configured | Buyer-owned number(s); no seller-specific fallback. |
| Sentry | SENTRY_DSN, VITE_SENTRY_DSN | optional; server DSN private configuration, browser DSN public | monitoring disabled when absent; active optional | Buyer-owned project, configurable. |
| Rezdy | none confirmed in active runtime | unused/uncertain | no active integration identified | No account migration until implementation is confirmed. |
| Object storage | OBJECT_STORAGE_PROVIDER plus provider-specific example variables | optional Replit sidecar or S3-compatible presigned uploads | upload operations fail clearly if selected-provider configuration is absent or unavailable | Buyer-owned target. Production provider migration remains a separate operation. |
| Vercel/public and admin deployment | VITE_API_URL, VITE_ASSETS_BASE, VITE_SENTRY_DSN; client/vercel.json | optional asset URL, required production API URL | builds can deploy; browser API needs URL | Buyer-owned hosting. Current URLs remain representable through environment values; deploy configuration stays unchanged. |
| Render/API deployment | render.yaml, CLIENT_URL, server security/provider variables | mixed | existing manifest remains; server requires core variables | Buyer-owned hosting. Current manifest and scoped CORS compatibility preserved. |
| Resend/Twilio/AWS/Redis | names in older templates only | unused or uncertain | no active provider path confirmed | Do not promise functionality or provision them in Phase 2. |

## Personal and vendor defaults audit

- Safe now: vendor-specific frontend API inference removed. Examples use placeholders and generic domains.
- Deployment-owned values: public/admin URLs, support contacts, SEO site URL, CORS origins and notification recipients are configuration only. Production fails closed when required origins are absent.
- Phase 3: hardcoded staff seed identities and bootstrap passwords/roles in storage remain untouched.
- Phase 9: owner personal contacts, account ownership, historical attribution and credentials must be de-identified/transferred with an explicit cutover plan.
- Object storage: Replit sidecar at loopback is currently source-coupled; this is a portability gap for a later phase. It is not disabled here.

## Stale variable audit

- JWT_SECRET: startup-required legacy value; no runtime JWT consumer found in the active application. Retained for compatibility.
- REDIS_URL: Render/template value, no active Redis client or cache consumer found. Candidate for later removal; in-memory cache remains.
- CSRF_TOKEN_SECRET: older example value, no active CSRF consumer; current CSRF uses the existing cookie/header token flow. Candidate for later removal.
- GYG_API_KEY and GYG_API_SECRET: older comprehensive-template names; official Partner API uses GYG_PARTNER_API_TOKEN. Legacy/unused candidate, not removed from production.
- WHATSAPP_API_URL and TWILIO_*: older template values; active messaging is the manual queue. No new sending integration is implied.

## Phase 3 staff bootstrap and demo data

- **Existing deployments:** `LEGACY_STARTUP_SEEDING` is an explicit compatibility switch and defaults to `false`. Set it only for a deliberate, reviewed migration window.
- **New installation:** set `LEGACY_STARTUP_SEEDING=false`, set `BOOTSTRAP_ADMIN_USERNAME` and `BOOTSTRAP_ADMIN_PASSWORD`, build the server, and run `npm run bootstrap` once against the new installation's MongoDB. The command creates one initial Superadmin only when no staff users exist. It never replaces a populated installation's passwords or roles. If staff users exist without a Superadmin, it stops for manual recovery.
- **Normal start in new mode:** with `LEGACY_STARTUP_SEEDING=false`, API startup does not create, delete, or reset staff users. `ADMIN_PASSWORD` and `SUPERADMIN_PASSWORD` are only required by the legacy startup mode and remain supported during migration. `SESSION_SECRET`, `JWT_SECRET`, and `DATABASE_URL` remain required by the current server configuration.
- **Demo data:** `SEED_DEMO_DATA=true` opts the new mode into the existing MarrakechDunes sample activities. Its default is `false`; once seeded, subsequent starts do not duplicate them. Legacy mode retains its original sample-activity behavior for compatibility. The flag is not a production-data migration or deletion tool.
- **Password ownership:** the one-shot bootstrap password is passed to the existing storage `createUser` path and hashed there once. The bootstrap variables are initialization inputs; a later API restart in new mode does not read them or overwrite a password changed through the staff UI.
