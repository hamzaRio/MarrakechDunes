# Booking history and database recovery

New bookings store an immutable activity snapshot from the server-side activity record. Older bookings without a snapshot retain their original `activityId`; when that activity is missing, the UI states `Activité supprimée ou indisponible` and never invents a replacement.

## Capacity review

The canonical occupied set is `CONFIRMED` and `COMPLETED` bookings, grouped by `activityId` and UTC `YYYY-MM-DD` of `preferredDate`, summing `numberOfPeople`. `PENDING` and `CANCELLED` do not occupy seats. A missing legacy `capacityReserved` does not erase a completed booking's occupancy. A missing activity record does not change the booked activity ID or the canonical count.

The isolated 15 October 2026 archive contained one completed booking consuming one seat without a matching counter and one cancelled booking with a zero counter. This is a read-only finding from the old archive. Before any reconciliation, compare a fresh read-only production snapshot against canonical groups and record each discrepancy by `{ activityId, dateKey }`, expected sum, existing counter value, and contributing booking IDs in an access-controlled operator artifact. Recheck the unique counter index immediately before an explicitly approved transaction. This document does not authorize changing a counter, booking, or activity.

## Backup and restore

The owner-supplied archive was restored successfully into a disposable MongoDB 8.0.34 container with networking disabled and no published port. `mongorestore` remapped `marrakech-tours.*` to `marrakech_restore_20261015.*`. Restored counts were 2 bookings, 5 activities, 3 users, 51 audit entries, and 1 capacity counter. Booking-reference and idempotency-key unique indexes restored. The temporary container and restored data were destroyed after verification. A new backup after the capacity-counter unique index was added is still needed to prove that index is recoverable.

For future rehearsals, use a MongoDB version matching the dump source, mount the archive read-only, remap every namespace to a disposable database, verify counts and indexes without printing records, and remove the container afterward. Never restore into production or expose the restored service.

## Exposed MongoDB credential rotation — owner action required

Treat the database password shown in the earlier screenshot as exposed. The owner should create a replacement Atlas user with only `readWrite` on `marrakech-tours`, store the new connection string only in Render's secret `DATABASE_URL`, verify readiness, authorized Admin login, and non-destructive reads, then revoke the old Atlas user. Keep `LEGACY_STARTUP_SEEDING=false` and `SEED_DEMO_DATA=false`. Do not reset staff passwords or change booking data as part of this rotation. This correction does not change production credentials or deployment settings.

## Payment summary meaning

`collectedPayments` sums recorded `paidAmount`, including a paid cancelled booking; it is not net revenue and does not subtract refunds. `grossBookingValue` and `outstandingAmount` exclude cancelled bookings. A completed booking with `deposit_paid` can still have an outstanding balance and remains payment attention. Refund settlement must come from a separately verified accounting source.
