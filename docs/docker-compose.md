# Portable Docker Compose environment

This reference environment runs the API, public web app, admin web app, and
MongoDB locally. It is a portable core/reference stack intended for development,
acceptance testing, and buyer handoff. Production remains `ROLE=all` with one
API replica until the multi-process scale gates are completed.

## Prerequisites and setup

Docker Desktop with Compose v2 is required. Copy the safe root
`.env.example` to an ignored environment file and set disposable values for
`SESSION_SECRET`, `JWT_SECRET`, and the bootstrap credentials. Do not use a
production `.env` or provider credentials. Compose reads the file explicitly:

```sh
docker compose --env-file .env.compose -f compose.yaml config
```

The compose file defaults to `mongo:7`, API port `10000`, public port `8080`,
and admin port `8081`. The browser-facing API URL is localhost; containers use
the service name `mongo` for MongoDB. Optional Viator, GetYourGuide, BAM, SMTP,
Sentry, WhatsApp, and object-storage settings are not required for core
startup. Their features remain unavailable until configured. The current
upload/object-storage implementation is deployment-specific and will be
addressed in the next portability phase.

The localhost reference stack intentionally runs the API with
`NODE_ENV=development` because it uses plain HTTP localhost and
`COOKIE_SECURE=false`. It does not exercise the complete production HTTPS
posture, including Secure-cookie and HSTS behavior, and is not the recommended
final production deployment.

The single unauthenticated Mongo container is suitable for local/reference
evaluation only. It is not high availability and is not the recommended
production database architecture; use managed MongoDB or a secured production
Mongo deployment for real workloads.

## Build, start, and bootstrap

```sh
docker compose --env-file .env.compose -f compose.yaml build
docker compose --env-file .env.compose -f compose.yaml up -d mongo api web-public web-admin
docker compose --env-file .env.compose -f compose.yaml --profile bootstrap run --rm bootstrap
```

Bootstrap creates the first generic Superadmin only when the database has no
staff owner; running it again is a no-op. No seller-specific account or
activity data is seeded. `LEGACY_STARTUP_SEEDING=false` keeps API startup
side-effect free.

Always pass an explicit env file (`--env-file .env.compose`) to every Compose
command. Do not use bare `docker compose` commands when another `.env` may be
present.

Open `http://localhost:8080` for the public app and
`http://localhost:8081/admin/login` for the admin app. The admin image has no
service worker or PWA manifest and sends `X-Robots-Tag: noindex`.

## Operations and persistence

```sh
docker compose --env-file .env.compose -f compose.yaml logs -f api
docker compose --env-file .env.compose -f compose.yaml down
docker compose --env-file .env.compose -f compose.yaml up -d
```

The named `mongo-data` volume survives `down` and restart. To intentionally
reset this isolated environment, use `down -v`; never run that against a
production project. A basic backup/restore uses MongoDB tools from a disposable
client container:

```sh
docker run --rm --network container:marrakechdunes-mongo-1 -v "$PWD/backups:/backup" mongo:7 mongodump --uri mongodb://127.0.0.1:27017/marrakechdunes --out /backup/dump
docker run --rm --network container:marrakechdunes-mongo-1 -v "$PWD/backups:/backup" mongo:7 mongorestore --uri mongodb://127.0.0.1:27017/marrakechdunes /backup/dump/marrakechdunes
```

The API image supports `ROLE=all`, `ROLE=api`, and `ROLE=worker`, but this
compose reference and approved production mode use `ROLE=all` with one replica.
No Redis, Kubernetes, Compose orchestration beyond this reference, or horizontal
scaling is enabled.

The smoke test is `node scripts/compose-smoke.mjs`. It generates disposable
credentials, runs Compose with an isolated project and explicit env file,
checks builds, health, public/admin routes, CORS, session initialization,
authenticated login/logout, bootstrap idempotency and password preservation,
and proves Mongo volume persistence across down/up. It never reads the owner
`.env` or contacts production services.
