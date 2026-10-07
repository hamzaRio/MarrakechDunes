# MarrakechDunes — notes for Claude

Tourism booking app. React 18 + TS + Vite client, Node + Express + TS + Mongoose server,
shared Zod schemas, npm workspaces monorepo. Deployed: Vercel (frontend) + Render (backend)
+ MongoDB. Full architecture and role/permission model: see README.md, don't duplicate it here.

## Claude's role here: independent auditor + GitHub automation engineer

Codex is the primary implementation agent. Claude does not compete with it or edit its branches.

- **Never push to `main`.** Never modify `hardening/non-storage` or any other Codex working
  branch. Automation work goes on Claude's own branch, e.g. `automation/claude-ci`. Audit-only
  findings go in PR review comments/issues, not source edits.
- **Claude may write code only for:** GitHub Actions, reviewer/CI automation, repo workflow
  config, this file, and audit tooling that doesn't change application behavior.
- **Business-logic freeze — report, don't fix:** booking status rules, payment semantics, auth
  behavior/roles, capacity logic, DB schema, customer flows, storage provider logic. If Claude
  finds a problem in these areas, it goes in a report (severity/file/line/why/expected/repro/fix
  direction), not a patch. Codex implements the correction.
- **Storage migration / H3 is deferred by the owner** (handled separately) — don't touch it.
- **On every Codex PR/push:** review the diff, check affected architecture and tests, check CI,
  report remaining High/Medium findings with the structure above. If nothing's wrong, say
  `CLAUDE AUDIT: PASS` — don't invent findings to look thorough.
- **For automated checks:** discover and call the repo's own existing scripts/harnesses rather
  than writing duplicate test logic.

## Before claiming something works

- `npx tsc -p server/tsconfig.json --noEmit` — server typecheck (clean as of 2026-10-07)
- `npx tsc -p client/tsconfig.json --noEmit --noUnusedLocals false --noUnusedParameters false`
  — client typecheck, real errors only. The tsconfig has `noUnusedLocals`/`noUnusedParameters`
  on for editor feedback; CI silences them because they're not bugs. Don't silence them when
  checking by hand if you're about to touch imports — editor settings still apply to your edits.
- `npm run build` — full build. Passing does NOT mean typecheck is clean: Vite/esbuild
  transpile without full type checking, so build-passes + typecheck-fails can both be true.
- There is no test suite. `vitest` is referenced in `client/package.json`'s `test:run` script
  but isn't installed, and there are zero test files. Don't report "tests pass" — there are none
  to run. Don't add `npm run test:run -w client` to CI until this is actually fixed.

## Known real bugs (as of 2026-10-07, not fixed — ask before touching)

These are type errors that point at actual data-model mismatches, not typos. Fixing them means
understanding what the correct behavior should be, not just making tsc happy:

- `client/src/pages/admin/dashboard.tsx:738`, `client/src/pages/customer-portal.tsx:332`,
  `client/src/components/admin/action-required-inbox.tsx:38` — all read
  `booking.activity` / `booking.preferredTime`, but `BookingType` (shared schema) only has
  `activityId` / `preferredDate`. Either the type is stale or these reads are wrong — check
  which before changing either side.
- `client/src/components/free-notification-panel.tsx` — compares a value against
  `"auto_response"`, which isn't in the notification-type union, and reads
  `originalMessage`/`confidence`/`needsReview` off a type that doesn't declare them. Looks like
  the notification payload shape changed upstream and this component wasn't updated to match.
- `client/src/components/viator-activity-search.tsx:92` — `eurMadRate.data` used without a
  null check.
- `client/src/pages/booking-fixed.tsx:148` — assigning a `string` where the inferred type is
  `never` (likely a narrowed union somewhere above that's gone stale).

## Things that look like bugs but aren't (checked, false alarms)

- Nothing yet — update this section as you rule things out, so the next session doesn't
  re-investigate them.

## Don't trust `PROJECT_REVIEW.md`

It's a prior AI-written status doc in the repo root claiming "✅ Everything is Ready!" and
"Code compiles without errors." Neither was true when checked on 2026-10-07 (17 real type
errors existed at the time). Treat it as stale notes, not a current source of truth.

## Git / environment

- Node 24 (see Dockerfile). `npm ci` at the repo root installs all three workspaces.
- `npm run build:shared` must run before typechecking server or client standalone — they import
  compiled output from `shared/dist`, not the TS source.
- CI lives in `.github/workflows/ci.yml` (typecheck + build). Claude Pro reviews are performed manually outside GitHub Actions.
