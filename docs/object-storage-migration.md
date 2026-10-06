# Object storage migration runbook

Phase 10 provides planning and disposable rehearsal only. It has no production
apply command and does not connect to MongoDB or copy real objects.

## Preparation for a future migration

Before any production execution is separately authorized:

- take a MongoDB backup/export;
- preserve the migration manifest and original `imageUrls` values;
- provision and test the buyer-owned target bucket;
- choose `OBJECT_STORAGE_S3_PUBLIC_BASE_URL` (bucket URL, CDN, R2 domain, or
  another controlled read gateway);
- configure credentials outside source control;
- configure exact bucket CORS for the deployed Public/Admin origins, `PUT`, and
  `Content-Type`; never default credentialed production CORS to `*`;
- export and inspect a sanitized image URL dataset; and
- agree on a maintenance window and source-retention period.

The planner accepts exact `OBJECT_STORAGE_LEGACY_URL_PREFIXES` for known
bucket/path prefixes and `OBJECT_STORAGE_LEGACY_PUBLIC_ORIGINS` for known
Replit object origins. It does not discover production records.

Configured legacy prefixes must use the exact path-boundary form and end with
`/`; sibling buckets or paths are rejected. Signed AWS and Google V4 URLs are
skipped rather than stripped and downloaded. Generated manifests belong under
the ignored `.migration/` directory. They may contain record identifiers and
byte-exact original URLs, so treat them as sensitive operator artifacts and
never store credentials in them.

## Rehearsal

Use the disposable command:

```text
npm run test:object-storage:migration:rehearsal
```

The rehearsal starts a local fixture source and disposable MinIO, downloads
only the explicitly allowed fixture URL, enforces the actual 5 MB byte limit,
copies to `uploads/migrated/...`, verifies size, content type, and SHA-256
readback, simulates the `imageUrls` rewrite, and restores the original fixture.
It deletes only its disposable test object and bucket during cleanup.

## Future production sequence (not implemented)

1. Back up MongoDB and snapshot non-secret provider configuration.
2. Generate and review the offline manifest.
3. Copy each source object to its deterministic target key.
4. Verify target existence, size, type, and content before changing a record.
5. Update only verified `imageUrls` references.
6. Retain source objects through an operator-selected rollback window; do not
   delete legacy sources during migration.
7. Observe reads and errors; restore original URLs if rollback is required.
8. Delete old objects only in a separately authorized operation after the window.

The manifest states and original URL values provide audit and rollback data. No
credentials, signed query strings, or provider secrets belong in it.
The normal executor rejects private, loopback, link-local, and reserved source
network targets, validates every resolved address, and pins the HTTP/TLS
connection to the validated address. Rewrite is permitted only after a verified
target copy.

## Current blockers before production execution

No sanitized production export has been reviewed, AWS S3/R2 have not been
externally tested, the target public-read strategy is undecided, and Replit
does not expose a verified generic delete endpoint. These are operator decisions
for a later migration phase.
