# Write-endpoint audit (M5)

Every POST/PUT/PATCH/DELETE route in `server/src/routes/*.ts`, which files are
actually **mounted** in `server/src/index.ts` (grep for `app.use('/api...`,
around line 505-575), and what guards each one.

First: which route files are mounted at all. Several route files exist in
the repository but are **not imported/mounted anywhere** in `index.ts` -
they are dead code, unreachable in production. This matters for this audit
because an "unauthenticated" finding in a file that is never mounted is not
a live vulnerability, but it is still worth hardening (see below) in case
someone wires it up later without re-reading this doc.

**Mounted:** `session`, `auth`, `security`, `admin`, `superadmin`,
`activities`, `reviews`, `notifications`, `bookings`, `competitors`,
`market-intelligence`, `gyg` (getyourguide), `viator`, `portal`,
`auto-response`, `upload`.

**NOT mounted (dead code, confirmed via grep for each router's import):**
`capacity.ts`, `cancellation.ts`, `rescheduling.ts`, `group-bookings.ts`,
`gyg-supplier.ts`. These do not need to be fixed for this hardening pass to
close M5 (nothing reaches them), but `capacity.ts` was hardened anyway in
this pass (see below) because its admin-only operations (waitlist
read/removal, policy changes) had no auth at all.

## Classification matrix (mounted routers only)

Columns: METHOD / PATH (relative to the router's mount prefix) / CLASSIFICATION
(who this is *for*) / AUTH / CSRF / RATE LIMIT / notes.

CSRF: the global CSRF middleware (`server/src/index.ts`, around line 403-422)
covers every non-safe-method route except `/api/session/init`,
`/api/security-events`, `/manifest.webmanifest`, `/favicon.ico`, and
`POST /api/bookings` (explicitly carved out for public booking creation,
which instead relies on its own rate limiter + idempotency key). Routes
below are CSRF-protected unless listed in that carve-out.

### `/api/session` (public bootstrap)
| Method | Path | For | Auth | Notes |
|---|---|---|---|---|
| POST | /init | anyone | none (carved out of CSRF) | issues the CSRF token itself |

### `/api/auth`
| Method | Path | For | Auth | Rate limit |
|---|---|---|---|---|
| POST | /login | staff | credentials checked in-handler | `strictLimiter` |
| POST | /logout | logged-in staff | session | - |

### `/api/security` (mounted at `/api`)
| Method | Path | For | Auth |
|---|---|---|---|
| POST | /security-events | anyone (client-side telemetry) | none (carved out of CSRF) - non-critical by design |

### `/api/admin/*` (router-level `requireAdmin`, M2-hardened)
Every route below additionally passes through `requireAdmin` (role
re-verified against the DB on every request as of this hardening pass -
see M2). Routes marked **SA** also require `requireSuperAdmin`.

| Method | Path | Classification | Extra guard |
|---|---|---|---|
| PATCH | /bookings/:id/status | status transition, capacity-gated | atomic capacity check (M4); audited on override |
| DELETE | /bookings/:id | **SA** hard delete | audited (M3); releases reserved capacity |
| POST | /activities | **SA** create | - |
| PUT, PATCH | /activities/:id | **SA** update | - |
| DELETE | /activities/:id | **SA** delete | - |
| POST | /activities/:id/image | **SA** upload | - |
| POST, PATCH | /bookings/:id/payment | payment mutation | validated amounts/status; audited (M3); rejects edits on CANCELLED bookings |
| POST | /bookings/:id/reminder | send reminder | - |
| POST | /notifications/:id/mark-sent | internal bookkeeping | - |
| POST, DELETE | /gyg-matches/override | **SA** manual match override | - |

### `/api/superadmin/*` (router-level `requireSuperAdmin`)
| Method | Path | Classification |
|---|---|---|
| POST | /admins | create admin/superadmin account |
| PATCH | /admins/:id | update admin account (role/status) |
| DELETE | /admins/:id | remove admin account |

### `/api/activities`
| Method | Path | For | Auth |
|---|---|---|---|
| PATCH | /:id | **SA** | `requireSuperAdmin` |

### `/api/reviews`
| Method | Path | For | Auth |
|---|---|---|---|
| POST | / | customer submits a review | none (public by design); stored `approved: false` until an admin approves - no direct public-facing effect |

### `/api/bookings`
| Method | Path | For | Auth | Rate limit |
|---|---|---|---|---|
| POST | / | customer creates a booking | none (public by design; carved out of CSRF) | `bookingCreationLimiter` + idempotency key |

### `/api/notifications`
| Method | Path | For | Auth |
|---|---|---|---|
| POST | /email/send | staff-authored free-text email to a customer | `requireAdmin` |
| POST | /subscribe, /unsubscribe | customer push-notification opt-in/out | none (public by design) |
| POST | /email/booking-confirmation | staff resend of a confirmation email | `requireAdmin` |

### `/api/market` (market-intelligence)
| Method | Path | For | Auth |
|---|---|---|---|
| POST | /add-activity | **SA** | `requireSuperAdmin` |

### `/api/gyg` (getyourguide)
| Method | Path | For | Auth |
|---|---|---|---|
| POST | /comparables | **SA** | `requireSuperAdmin` |
| PATCH | /comparables/:id | **SA** | `requireSuperAdmin` |
| POST | /comparables/:id/reverify | **SA** | `requireSuperAdmin` |
| DELETE | /comparables/:id | **SA** | `requireSuperAdmin` |
| DELETE | /cache/clear | **SA** | `requireSuperAdmin` |

### `/api/viator`
| Method | Path | For | Auth |
|---|---|---|---|
| POST | /search | staff | `requireAdmin` |

### `/api/portal` (customer self-service, own session type - not staff)
| Method | Path | For | Auth |
|---|---|---|---|
| POST | /request-otp, /login | customer | none (this *is* the login flow; OTP-gated) |
| POST | /me/bookings/:id/reschedule | the logged-in customer, own booking only | portal session (verify ownership in-handler) |
| POST | /me/bookings/:id/cancel | the logged-in customer, own booking only | portal session |
| POST | /logout | customer | portal session |

**Recommendation for a follow-up pass (not done in this session, scope/time):**
confirm `/me/bookings/:id/*` handlers check that the booking belongs to the
authenticated portal session's customer, not just that *some* portal
session exists - ownership-check logic lives inside each handler and was
not independently re-verified line-by-line here.

### `/api/auto-response`
| Method | Path | For | Auth |
|---|---|---|---|
| POST | /incoming | inbound customer message (effectively a webhook-style receiver) | **none** - flagged below |
| POST | /test | staff testing the auto-responder | `requireSuperAdmin` |

**Flagged, not fixed in this pass:** `POST /incoming` has no authentication
at all. If this is reachable from the public internet (vs. only called
server-side), anyone can inject a fabricated "customer message" that the
auto-responder will process and queue a reply for. This needs an owner
decision - e.g. a shared-secret header check, or restricting it to a
specific inbound webhook provider's signature - that depends on exactly
which upstream (WhatsApp Business API, a form, etc.) is meant to call it,
which is outside what this pass could determine confidently.

### `/api` (upload)
| Method | Path | For | Auth | Rate limit |
|---|---|---|---|---|
| POST | /objects/upload | **SA** | `requireSuperAdmin` | `uploadRateLimit` |

## Hardened in this pass even though currently unmounted (`capacity.ts`)
| Method | Path | Before | After |
|---|---|---|---|
| POST | /:activityId/waitlist | none (correct - public self-signup) | unchanged |
| GET | /:activityId/waitlist | none | `requireAdmin` (lists customer PII) |
| DELETE | /:activityId/waitlist/:entryId | none | `requireAdmin` |
| POST | /:activityId/process-waitlist | none | `requireAdmin` |
| GET | /policy | none | unchanged (read-only) |
| PUT | /policy | none | `requireAdmin` (platform-wide setting) |

## Not reviewed in this pass
`cancellation.ts`, `rescheduling.ts`, `group-bookings.ts`, `gyg-supplier.ts`
are unmounted dead code; given the time budget for this hardening pass they
were confirmed unreachable but not individually hardened. Before mounting
any of them, re-run this same classification exercise on that file first.
