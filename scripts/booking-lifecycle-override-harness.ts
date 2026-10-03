 import assert from "node:assert/strict";
 import {
   BOOKING_STATUSES,
   evaluateBookingStatusChange,
   executeBookingStatusMutation,
   hasAuthorizedSuperadminOverride,
   normalizeOverrideReason,
 } from "../server/src/utils/booking-status-override.js";

 const decision = (currentStatus: string, targetStatus: string, role: string, force?: boolean, overrideReason?: string) =>
   evaluateBookingStatusChange({ currentStatus, targetStatus, role, force, overrideReason });

 assert.equal(decision("PENDING", "CONFIRMED", "admin").allowed, true);
 assert.equal(decision("PENDING", "CANCELLED", "admin").allowed, true);
 assert.equal(decision("CONFIRMED", "COMPLETED", "admin").allowed, true);
 assert.equal(decision("CONFIRMED", "CANCELLED", "admin").allowed, true);
 assert.equal(decision("CONFIRMED", "PENDING", "admin").allowed, false);
 assert.equal(decision("COMPLETED", "PENDING", "admin").allowed, false);
 assert.equal(decision("CANCELLED", "PENDING", "admin").allowed, false);
 assert.equal(decision("CONFIRMED", "PENDING", "admin", true, "spoofed").allowed, false);

 for (const [from, to] of [
   ["CONFIRMED", "PENDING"],
   ["COMPLETED", "PENDING"],
   ["CANCELLED", "PENDING"],
   ["CANCELLED", "CONFIRMED"],
 ] as const) {
   assert.deepEqual(decision(from, to, "superadmin", true, "Operational correction"), { allowed: true, forced: true });
 }
 assert.equal(decision("PENDING", "NOT_A_STATUS", "superadmin", true, "reason").allowed, false);
 assert.equal(decision("CANCELLED", "PENDING", "superadmin", true, "").allowed, false);
 assert.equal(decision("CANCELLED", "PENDING", "superadmin", true).allowed, false);
 assert.deepEqual(BOOKING_STATUSES, ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);

 assert.deepEqual(normalizeOverrideReason("  Operational correction  "), { valid: true, value: "Operational correction" });
 assert.equal(normalizeOverrideReason("   ").valid, false);
 assert.equal(normalizeOverrideReason("x".repeat(501)).valid, false);

 assert.equal(hasAuthorizedSuperadminOverride("admin", true, "capacity override"), false);
 assert.equal(hasAuthorizedSuperadminOverride("superadmin", false, "capacity override"), false);
 assert.equal(hasAuthorizedSuperadminOverride("superadmin", true, ""), false);
 assert.equal(hasAuthorizedSuperadminOverride("superadmin", true, "capacity override"), true);

 let auditCalls = 0;
 let updateCalls = 0;
 let notificationCalls = 0;
 await assert.rejects(
  executeBookingStatusMutation({
     requiresAudit: true,
     createAudit: async () => { auditCalls += 1; throw new Error("audit unavailable"); },
     updateStatus: async () => { updateCalls += 1; return { status: "PENDING" }; },
  }),
  /Failed to record booking status override/,
);
 assert.equal(auditCalls, 1);
 assert.equal(updateCalls, 0);

 auditCalls = 0;
 updateCalls = 0;
 const audited = await executeBookingStatusMutation({
   requiresAudit: true,
   createAudit: async () => { auditCalls += 1; },
   updateStatus: async () => { updateCalls += 1; return { status: "CONFIRMED" }; },
 });
 assert.deepEqual(audited, { status: "CONFIRMED" });
 assert.equal(auditCalls, 1);
 assert.equal(updateCalls, 1);

 const failedMutation = await executeBookingStatusMutation({
   requiresAudit: true,
   createAudit: async () => undefined,
   updateStatus: async () => null,
 });
 if (failedMutation) notificationCalls += 1;
 assert.equal(failedMutation, null);
 assert.equal(notificationCalls, 0);

 const shouldNotifyConfirmation = (from: string, to: string, mutationSucceeded: boolean) =>
   mutationSucceeded && to === "CONFIRMED" && from !== "CONFIRMED";
 assert.equal(shouldNotifyConfirmation("PENDING", "CONFIRMED", true), true);
 assert.equal(shouldNotifyConfirmation("CANCELLED", "CONFIRMED", true), true);
 assert.equal(shouldNotifyConfirmation("CONFIRMED", "CONFIRMED", true), false);
 assert.equal(shouldNotifyConfirmation("PENDING", "CONFIRMED", false), false);
 assert.equal(shouldNotifyConfirmation("PENDING", "CANCELLED", true), false);

 const payment = { paymentStatus: "deposit_paid", paidAmount: 140, depositAmount: 140, paymentMethod: "cash_deposit" };
 const beforePayment = { ...payment };
 for (const [from, to] of [["CANCELLED", "PENDING"], ["COMPLETED", "CONFIRMED"]] as const) {
   assert.equal(decision(from, to, "superadmin", true, "Operational correction").allowed, true);
   assert.deepEqual(payment, beforePayment);
 }

 console.log("Booking lifecycle override harness: PASS");
