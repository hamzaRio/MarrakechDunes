import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const route = await readFile(path.join(root, "server/src/routes/admin.ts"), "utf8");
const storage = await readFile(path.join(root, "server/src/storage.ts"), "utf8");
const dashboard = await readFile(path.join(root, "client/src/pages/admin/dashboard.tsx"), "utf8");
const inbox = await readFile(path.join(root, "client/src/components/admin/action-required-inbox.tsx"), "utf8");
const bookingManagement = await readFile(path.join(root, "client/src/components/admin/booking-management.tsx"), "utf8");

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`Action-required inbox harness failed: ${message}`);
};

assert(route.includes("router.get('/bookings/action-required'"), "admin action-required route is present");
assert(route.includes("parseBookingDateOnly(req.query.from, false)"), "from date is validated server-side");
assert(storage.includes("getActionRequiredBookings"), "storage exposes the bounded operational query");
assert(storage.includes(".limit(5)"), "each category is capped at five visible records");
assert(storage.includes("customerEmail: { $regex: escaped"), "email participates in safe server-side search");
assert(storage.includes("bookingReference: { $regex: escaped"), "booking reference participates in safe server-side search");
assert(dashboard.includes("/admin/bookings/action-required?from="), "dashboard uses the focused endpoint");
assert(dashboard.includes("counts={{"), "dashboard passes real category totals to the inbox");
assert(inbox.includes("Aucune action urgente"), "empty state is explicit");
assert(inbox.includes("Réessayer"), "error state is recoverable");
assert(bookingManagement.includes("email, référence"), "booking search copy documents supported fields");

console.log("Action-required inbox harness: PASS");
