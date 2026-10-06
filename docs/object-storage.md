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

## Lifecycle and migration readiness

Upload grants include an additive provider-neutral `objectKey` when available;
the existing `objectPath`, upload URL fields, and `imageUrls: string[]` remain
unchanged. S3-compatible storage supports `statObject` (HEAD) and
`deleteObject` for validated keys under `uploads/`. The Replit sidecar exposes no
supported read/delete endpoint, so those capabilities are reported as
unsupported rather than emulated.

The five-megabyte limit validates browser-declared metadata before a grant is
issued, but exact provider-side byte enforcement is not guaranteed. A future
finalize step may verify S3 size/type before changing a database reference; it
is deferred so existing Replit uploads remain unchanged.

`scripts/object-storage-migration-plan.ts` is a non-destructive planner. Given
fixture records and `OBJECT_STORAGE_S3_PUBLIC_BASE_URL`, it classifies URLs and
emits deterministic manifest entries without uploading, deleting, connecting to
MongoDB, or rewriting records. Only relative `/objects/` URLs or absolute URLs
whose origin is explicitly listed in `OBJECT_STORAGE_LEGACY_PUBLIC_ORIGINS` are
planned; external and unknown URLs are skipped. Future migration must copy and verify targets before
updating references and must retain original URLs for rollback.

Direct browser PUTs require bucket CORS for the deployed origins, `PUT`, and the
signed `Content-Type` header. Do not use wildcard origins for credentialed
production storage. AWS S3 and Cloudflare R2 remain implementation-compatible
but externally untested; MinIO has a real integration harness.

There is currently no active API read or delete route for stored objects; the
application consumes the URLs returned by the upload flow. The lifecycle
methods are provider-service primitives for verification and future migration,
not automatic activity deletion behavior. Production storage migration is
deferred: no bucket is created, no existing objects are copied, and no
production provider setting is changed by this phase.
