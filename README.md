# MarrakechDunes

MarrakechDunes is a React and Express application for publishing tourism activities, accepting public booking requests, and managing daily booking operations.

## Architecture

- `client`: React 18, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, and Radix UI
- `server`: Node.js, Express, TypeScript, Mongoose, session authentication, email notifications, and PDF exports
- `shared`: shared TypeScript schemas and types
- Production frontend: Vercel
- Production backend: Render
- Production container runtime: Node.js 24 Alpine
- Primary database: MongoDB
- Optional cache: Redis, with application fallback when it is unavailable

The frontend and backend are deployed on different origins. API requests use credentials so the browser can send the Render session cookie from the Vercel frontend.

## Public experience

Public navigation contains:

- Home
- Activities
- Booking
- Reviews

Staff access is provided separately through **Staff area / Espace équipe** at `/admin/login`.

The public `POST /api/bookings` route remains unauthenticated and creates every new booking with status `PENDING`. Public booking creation is the exact booking route exempt from CSRF verification.

## Booking and payment states

Booking lifecycle and payment state are independent.

Booking statuses:

- `PENDING`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`

Payment statuses:

- `unpaid`
- `deposit_paid`
- `fully_paid`

Confirming or completing a booking does not mark it as paid. Recording a deposit or full payment does not change the booking lifecycle status.

## Staff roles and permissions

The application has two staff roles: `admin` and `superadmin`. There is no CEO role.

### Admin

Admins handle daily operations. They can:

- view bookings and booking details
- change booking status to `PENDING`, `CONFIRMED`, `COMPLETED`, or `CANCELLED`
- record deposits and full payments
- contact customers through the available phone, WhatsApp, and email actions
- review and process queued operational notifications; automated booking reminders are not implemented
- export booking data
- view activities and operational GetYourGuide references

Admins cannot:

- delete bookings or activities
- create or modify activities, activity images, or strategic pricing
- manage administrator accounts
- view audit logs
- access executive reports or dashboards
- clear GetYourGuide caches or use diagnostic and strategic market endpoints

### Superadmin

Superadmins have all admin permissions plus ownership-level control. They can:

- delete bookings
- create, edit, price, upload images for, and delete activities
- manage admin and superadmin accounts
- view audit logs
- access revenue summaries, executive operations reports, and their PDF export
- access `/admin/ceo`, retained as the superadmin-only Executive Dashboard
- open the legacy Business Intelligence screen (its `/api/bi/*` data endpoints are not mounted by the current server)
- use protected diagnostic, cache-management, and strategic market tools

The server enforces these permissions with `requireAdmin` and `requireSuperAdmin`. Frontend visibility is supplementary and is not the authorization boundary.

## Admin booking workflow

The operations dashboard uses a compact booking-management interface. Each booking row shows:

- customer and activity
- booking date and party size
- booking status and payment status as separate badges
- total, paid, and remaining amounts

Admins can view details, confirm or update lifecycle status, manage payment, contact the customer, filter and select visible bookings, perform bulk status changes, and export selected bookings. Destructive booking controls are displayed only to superadmins and are enforced server-side.

Secondary information remains in the booking details view, including customer details, payment progress, pricing/GetYourGuide comparison, communication actions, notes, and available audit history.

## Executive analytics

`/admin/ceo` is retained for URL compatibility and is presented as the **Executive Dashboard / Tableau de Bord Direction**. It is restricted to superadmins in the client and at its data endpoints.

The dashboard displays operational metrics returned by the server. Its general suggestions are explicitly labeled as non-calculated guidance. A separate legacy Business Intelligence screen still overlaps with the executive dashboard and is also superadmin-only, but its `/api/bi/*` data endpoints are not mounted by the current server. These surfaces can be consolidated in a later product change.

## Security architecture

- Staff authentication uses an `express-session` cookie named `marrakech.session`.
- `SESSION_SECRET` is required; the server has no production fallback secret.
- Production session cookies are `HttpOnly`, `Secure`, and `SameSite=None` for the Vercel-to-Render deployment.
- Session cookie lifetime, Mongo session-store TTL, and memory-store TTL are seven days.
- Rolling sessions refresh their expiry during authenticated activity.
- MongoDB stores production sessions when `DATABASE_URL` is configured; the local fallback is an in-memory store.
- Unsafe requests use double-submit CSRF protection with the `marrakech.csrf` cookie and `X-CSRF-Token` header.
- The frontend obtains the CSRF token from `GET /api/session/init` and keeps it in memory.
- Existing valid CSRF tokens are reused; missing or invalid tokens are replaced with a cryptographically random 64-character hexadecimal token.
- Only the exact public `POST /api/bookings` request bypasses CSRF verification. Admin routes are not exempt.
- CORS allows configured frontend origins and credentials.
- Helmet headers, request-size controls, input sanitization, and rate limiting are applied by the server middleware stack.
- Passwords are hashed with bcrypt. Real credentials belong in ignored environment files or the deployment platform, never in source control.

The customer portal OTP integration is not production-ready in the current code: OTP delivery is unavailable and verification is disabled. It should not be described or relied on as active authentication.

## Local development

### Prerequisites

- Node.js 24
- npm
- MongoDB connection for database-backed operation

Install workspace dependencies:

```bash
npm ci
```

Run the frontend and backend development servers:

```bash
npm run dev
```

Useful checks:

```bash
npm run check
npm run build
npm test
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:10000`
- Health check: `http://localhost:10000/api/health`
- Staff login: `http://localhost:5173/admin/login`

## Environment configuration

Use the tracked example files as templates. Do not create credentials from values in documentation.

Common server variables include:

```env
DATABASE_URL=<your-mongodb-connection-string>
SESSION_SECRET=<your-session-secret>
ADMIN_PASSWORD=<your-admin-password>
SUPERADMIN_PASSWORD=<your-superadmin-password>
CLIENT_URL=http://localhost:5173
PORT=10000

SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-password>
SMTP_FROM=<your-from-address>

REDIS_URL=<your-redis-connection-string>
```

Common client variables include:

```env
VITE_API_URL=http://localhost:10000/api
VITE_ASSETS_BASE=/images
```

Real `.env`, `.env.production`, `.env.local`, `.env.development`, `.env.staging`, and `.env.test` files are ignored. Safe `.example` files may be committed.

## Production deployment

- Vercel serves the frontend.
- Render runs the Express backend.
- The Docker build and runtime stages use `node:24-alpine`.
- Production secrets are configured in the deployment environments.
- The frontend API URL must point to the Render backend `/api` base.
- The backend CORS configuration must include the Vercel origin.

Build the complete workspace with:

```bash
npm run build
```

The build compiles `shared`, then the Vite client, then the Express server.
