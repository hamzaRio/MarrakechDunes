# Object storage boundary

Activity uploads are issued by the API after `requireSuperAdmin` succeeds. The
API returns a short-lived upload URL and an internal object path; the browser
never receives storage credentials. Activity records continue to store their
existing `imageUrls` strings, so existing MongoDB records remain compatible.

The route depends on `ObjectStorageService`, which selects a provider through
`OBJECT_STORAGE_PROVIDER` (`replit-sidecar` or `s3`). The Replit sidecar adapter
is retained for existing installations and uses `PRIVATE_OBJECT_DIR` plus an
optional `OBJECT_STORAGE_SIDECAR_ENDPOINT`. The S3-compatible adapter uses
`OBJECT_STORAGE_S3_ENDPOINT`, `OBJECT_STORAGE_S3_REGION`,
`OBJECT_STORAGE_S3_BUCKET`, optional access-key credentials,
`OBJECT_STORAGE_S3_FORCE_PATH_STYLE`, `OBJECT_STORAGE_S3_UPLOAD_EXPIRES_SECONDS`,
and `OBJECT_STORAGE_S3_PUBLIC_BASE_URL`. The public base URL is required for the
S3 adapter because activity records need a stable URL; an expiring presigned PUT
URL is never treated as a permanent image URL. This same adapter is
configuration-compatible with AWS S3, Cloudflare R2, and MinIO; those providers
have not been production-tested here.

The API validates declared image MIME types (JPEG, PNG, WebP, or GIF) and a
declared size up to 5 MB before issuing a grant. S3 grants require Content-Type
and bind the declared value into the PUT signature. This validates the signed
declaration, not the uploaded bytes themselves. A declared size is not an exact cryptographic
provider limit for a browser-held PUT URL. The browser receives only the
short-lived presigned URL and provider-neutral metadata; credentials are never
returned. The configured public base URL produces the stable URL persisted by
the browser.

Provider-specific signing code is isolated under `server/src/object-storage/`.

There is currently no active API read or delete route for stored objects; the
application consumes the URLs returned by the upload flow. Production storage
migration is deferred: no bucket is created, no existing objects are copied,
and no production provider setting is changed by this phase.
