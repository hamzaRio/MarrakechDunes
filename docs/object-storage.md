# Object storage boundary

Activity uploads are issued by the API after `requireSuperAdmin` succeeds. The
API returns a short-lived upload URL and an internal object path; the browser
never receives storage credentials. Activity records continue to store their
existing `imageUrls` strings, so existing MongoDB records remain compatible.

The route depends on `ObjectStorageService`, which selects a provider through
`OBJECT_STORAGE_PROVIDER`. The current `replit-sidecar` adapter is retained for
existing installations and uses `PRIVATE_OBJECT_DIR` plus an optional
`OBJECT_STORAGE_SIDECAR_ENDPOINT`. Provider-specific signing code is isolated
under `server/src/object-storage/`.

There is currently no active API read or delete route for stored objects; the
application consumes the URLs returned by the upload flow. A future S3/R2/MinIO
adapter can implement the same `ObjectStorageProvider` interface without
changing routes or business models. Production storage migration is therefore
deferred until a provider and public-read/delete contract are selected.
