# MarrakechDunes - operations & handoff runbook (H4)

This is the practical "how do I run/operate/hand off this project" doc the
rest of the codebase's security docs assume exists (referenced from
`client/index.html`). It complements, not replaces, `README.md`.

## 1. Architecture at a glance

- `client/` - React + Vite SPA, built twice: `build:public` (customer-facing,
  entry `index.html`) and `build:admin` (staff-facing, entry `admin.html`).
  Deployed separately (two Vercel projects, or two static hosts).
- `server/` - Express + TypeScript + MongoDB (Mongoose). One deployment
  (e.g. Render), serves both frontends' API calls over CORS.
- `shared/` - TypeScript types shared by client and server; build it first
  (`npm run build:shared`).

## 2. Running locally

```
npm install
npm run build:shared
cp server/.env.example server/.env   # fill in DATABASE_URL at minimum
npm run dev   # or: npm --prefix server run dev (API) + npm --prefix client run dev (SPA)
```

A local MongoDB is required (`docker run -p 27017:27017 mongo:7` works, or
use a free MongoDB Atlas cluster). There is no seeded data by default as
of this hardening pass (see §4) - create a superadmin with the bootstrap
flow below.

## 3. Required environment variables (production)

These are new or changed by this hardening pass; see `server/.env.example`
and `render.yaml` for the full list.

| Variable | Why it matters now |
|---|---|
| `CORS_ALLOWED_ORIGINS` | **Required in production.** The server refuses to start without this (or the explicit `LEGACY_OWNER_CORS_COMPAT=true` opt-in) - see §5. |
| `VITE_API_URL` (client build-time) | Required for both `build:public` and `build:admin` - baked into the CSP and the runtime API base URL. |
| `VITE_SITE_URL` (client build-time, public build only) | Used for the public build's OG tags, `sitemap.xml`, `robots.txt`. Optional but recommended. |
| `LEGACY_STARTUP_SEEDING` | Now defaults to `false`. Leave it unset/false; see §4. |
| `PUBLIC_SITE_URL`, `ADMIN_SITE_URL`, `SUPPORT_PHONE` | Optional. Shown to customers/admins in WhatsApp/email notifications when set; omitted entirely when unset (never falls back to the original developer's own values). |
| `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_PASSWORD` | Used once, by `npm run bootstrap` (§4). |
| `MONGO_AUTO_INDEX` | Leave unset in production (defaults to off). Set `true` only for a disposable staging database. |

## 4. First-time setup: creating the first superadmin (H2)

Startup no longer force-resets hardcoded accounts (`LEGACY_STARTUP_SEEDING`
now defaults to `false` - the old default destructively reset the
passwords/roles of hardcoded `ahmed`/`yahia`/`nadia` accounts on every
boot, and deleted any `admin`/`superadmin`-named user). On a fresh
deployment with no admin accounts yet, run:

```
BOOTSTRAP_ADMIN_USERNAME=yourname BOOTSTRAP_ADMIN_PASSWORD='a-strong-password-12-chars-plus' \
  npm run bootstrap
```

This is non-destructive: it only creates the account if none exists yet
(`storage.getStaffBootstrapState()` returns `empty`/`owned`/`missing-owner`
- it refuses to silently overwrite an existing owner). Username must match
`/^[a-z0-9._-]{3,64}$/i`; password must be at least 12 characters.

After that, log into the Admin app and create any further admin accounts
through `POST /api/superadmin/admins` (superadmin only) - there is no need
to touch environment variables again for routine account management.

## 5. CORS / cookie topology (M1, H1)

Public and Admin are two different origins calling one API origin, so this
is cross-site from the cookie's perspective:

- `CORS_ALLOWED_ORIGINS` (comma-separated, exact origins, e.g.
  `https://app.example.com,https://admin.example.com`) is **required** in
  production. `server/src/utils/cors-origins.ts` fails closed: no
  `CORS_ALLOWED_ORIGINS` and no `LEGACY_OWNER_CORS_COMPAT=true` means the
  server refuses requests from everywhere in production rather than
  silently falling back to the original developer's own domains.
- The session cookie (`server/src/security-middleware.ts`,
  `sessionSecurity`) is `httpOnly`, 7-day rolling, and its `secure`/
  `sameSite` are derived from `COOKIE_SECURE`/`COOKIE_SAMESITE`
  (`server/src/config/runtime-config.ts`), which already enforce the two
  invariants that matter for a cross-site deployment:
  - production must have `COOKIE_SECURE=true` (or leave it unset - it
    defaults to `true` in production).
  - `COOKIE_SAMESITE=none` requires `COOKIE_SECURE=true` (the server
    throws at startup otherwise) - `SameSite=None` is what a cross-origin
    Admin SPA needs for its session cookie to be sent at all.
- `COOKIE_DOMAIN` should normally be **left unset**. Only set it if Public
  and Admin are both subdomains of one parent domain and you deliberately
  want one cookie shared across them (e.g. `.example.com`) - it is
  validated to look like a DNS domain, but that doesn't make a wrong value
  (sharing cookies with a domain you don't intend to) safe.
- `TRUST_PROXY` controls whether Express trusts `X-Forwarded-*` headers
  (needed behind Render's/Vercel's own proxy for `secure` cookies and the
  real client IP to work) - leave it at its default (`1`) unless you know
  you need otherwise.

## 6. CSP / build-time portability (H1)

Both `client/index.html` and `client/admin.html` now get their CSP
`connect-src` and the public build's OG/sitemap/robots URLs filled in at
**build time** from `VITE_API_URL`/`VITE_SITE_URL`
(`client/vite.config.ts`'s `htmlPortabilityPlugin`). This means:

- You must set `VITE_API_URL` (and ideally `VITE_SITE_URL` for the public
  build) in whatever CI/build environment runs `npm run build:public` /
  `npm run build:admin` - not just on the server.
- If you change the API's domain, you must rebuild and redeploy the
  frontends - the CSP is static per build, not read at runtime.
- Manual verification done in this session: ran both builds with
  `VITE_API_URL=https://api.example.com`, inspected the built
  `dist/index.html`/`dist-admin/admin.html`, and confirmed `connect-src`
  resolves to that origin with no leftover `__CSP_CONNECT_SRC__`
  placeholder, and `dist/sitemap.xml`/`robots.txt` resolve to
  `VITE_SITE_URL`.
- **Not done in this session (needs a real browser):** loading the built
  Public/Admin apps in an actual browser (e.g. via Playwright/Chromium)
  pointed at a *different* API origin than the one the original developer
  used, and confirming the browser's own CSP enforcement does not block
  the API calls. The static placeholder-substitution check above gives
  strong evidence this works, but it is not the same as a live
  browser-enforced CSP check. If you add `@playwright/test` as a dev
  dependency (owner-authorized for this), a reasonable test is: serve
  `dist/` and `dist-admin/` locally, launch Chromium, intercept
  `console` CSP-violation events, hit a page that calls the API, and
  assert zero violations and a successful network response.

## 7. Database indexes (M10)

Production no longer builds indexes implicitly on every connect
(`autoIndex` defaults to `false` in production - see `server/src/db.ts`).
Run `npm run db:ensure-indexes` as a deploy step (or manually after a
schema change that added/changed an index declaration in `storage.ts`).

## 8. Backup & restore

**Not executed in this session.** This container has no `mongodump`/
`mongorestore`/`mongod` binaries installed and no network access to the
MongoDB download host used by `mongodb-memory-server` either (see the M4
concurrency-harness commit for the same blocker), so the owner-specified
backup-then-restore rehearsal (representative superadmin/admin/
activities/bookings/audit-log data; verify user count/roles/password
hashes/activities/bookings/references/payments/audit logs survive;
determine whether session records are included) could not be physically
run here. Procedure, for whoever runs it against a real or staging
deployment with the MongoDB Database Tools installed:

```
# Backup (from a machine with network access to the database)
mongodump --uri="$DATABASE_URL" --out=./backup-$(date +%Y%m%d)

# Restore rehearsal - into a DIFFERENT, disposable database, never over
# the source
mongorestore --uri="$DISPOSABLE_TEST_DATABASE_URL" --drop ./backup-YYYYMMDD

# Then verify, against the disposable database:
# - db.users.countDocuments() matches the source, and a sample user's
#   role + password hash (bcrypt, starts with $2) are unchanged
# - db.activities.countDocuments() matches the source
# - db.bookings.countDocuments() matches the source, and a sample
#   booking's activityId reference still resolves
# - db.auditlogs.countDocuments() matches the source
# - decide whether `sessions` (connect-mongo's collection) should be
#   included in the real backup - session records are ephemeral
#   (7-day TTL) and restoring stale ones re-animates old logins;
#   excluding the sessions collection from the mongodump
#   (`--excludeCollection=sessions`) is the safer default.
```

## 9. Deploying

1. Set the environment variables in §3 for the server (Render dashboard,
   or wherever it's hosted) and for the client build (Vercel project
   settings, or CI).
2. `npm run build:shared && npm run build:server && npm run build:public
   && npm run build:admin`.
3. Deploy the server, then run `npm run db:ensure-indexes` against it once
   it's up (§7), then `npm run bootstrap` if this is a fresh database with
   no admin accounts yet (§4).
4. Deploy the two frontend builds.

## 10. What this hardening pass changed vs. what's still open

See the git log on this branch for the detailed per-area commits (H1/H2/
M2/M3/M4/M5/M6/M8/M9/M10/M11/M12). Known still-open items at the time of
writing, in order of what to pick up next:

- **M8** (dependency audit): 0 critical, but still non-zero high/moderate
  findings concentrated in the client build toolchain (vite's remaining
  root-hoisted peer copy, postcss, rollup, workbox-build, preact via
  `@uppy`'s UI widget, `@grpc/grpc-js` via an AWS SDK chain). Needs a
  deliberate look per package, not a blanket `npm audit fix --force`.
- **M7** (live Chromium CSP verification) - see §6.
- **Backup/restore rehearsal** - see §8 (needs an environment with the
  MongoDB Database Tools and network access).
- **M4 concurrency test** - the harness exists
  (`server/src/scripts/capacity-concurrency-harness.ts`) but has not been
  run to completion in any environment yet (needs network access to fetch
  a mongod binary, or a pre-cached one via `MONGOMS_DOWNLOAD_DIR`).
- `server/src/routes/auto-response.ts`'s `POST /incoming` has no
  authentication at all (see `docs/write-endpoint-audit.md`) - needs an
  owner decision on how to verify its real caller.
- `cancellation.ts`, `rescheduling.ts`, `group-bookings.ts`,
  `gyg-supplier.ts` are currently dead/unmounted code - re-run the M5
  classification exercise on whichever of them gets mounted in the future.

H3 (Replit storage sidecar / S3-compatible migration, everything under
`server/src/objectStorage.ts`, `server/src/object-storage/`, and the
`scripts/object-storage-*` migration tooling) is explicitly out of scope
for this runbook and was not touched in this hardening pass, per owner
instruction.
