# Portable Docker images

Phase 5 provides three provider-neutral images without changing the existing Render adapter.

```sh
docker build -f Dockerfile.api -t marrakechdunes-api:local .
docker build --build-arg APP=public -f Dockerfile.web -t marrakechdunes-public:local .
docker build --build-arg APP=admin -f Dockerfile.web -t marrakechdunes-admin:local .
```

The API listens on `PORT` (default `10000`) and supports `ROLE=all`, `ROLE=api`, or
`ROLE=worker`; the approved production mode remains `ROLE=all` with one replica.
It requires the normal server configuration at runtime and contains no credentials.
Its healthcheck uses `/api/health/ready`.

Web containers listen on port `8080` and require the public `API_URL` environment
variable at startup. The entrypoint writes `/config.js`; it contains only the API
base URL. Vercel builds continue to use `VITE_API_URL`, and local development keeps
its existing behavior. No API keys, database URLs, SMTP credentials, or session
secrets belong in web runtime configuration.

The public image includes the PWA and safe service worker. The admin image is a
separate SPA artifact with no service worker or manifest and sends `X-Robots-Tag:
noindex`. Compose and orchestration manifests are intentionally deferred.
