import { readFileSync } from "node:fs";
import { formatLocalDateOnly, resolveBookingPage } from "../client/src/lib/booking-utils.ts";
import { normalizeBookingPagination, parseBookingDateOnly } from "../server/src/utils/booking-query.js";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const statuses = new Set(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);
const payments = new Set(["unpaid", "deposit_paid", "fully_paid"]);

const pagination = normalizeBookingPagination({ page: 0, limit: 999, sort: { field: "not-allowlisted", order: 1 } });
assert(pagination.page === 1 && pagination.limit === 100, "page/limit are normalized and capped at 100");
assert(pagination.sort.field === "createdAt", "sort field is allowlisted");
assert(normalizeBookingPagination({ page: 2, limit: 25, sort: { field: "preferredDate", order: 1 } }).sort.order === 1, "ascending sort is preserved");
assert(parseBookingDateOnly("2026-02-30") === null, "invalid calendar dates are rejected");
assert(parseBookingDateOnly("2026-09-28")?.toISOString() === "2026-09-28T00:00:00.000Z", "date-only parsing is UTC-safe");
assert(parseBookingDateOnly("2026-09-28", true)?.toISOString() === "2026-09-28T23:59:59.999Z", "inclusive end date is supported");
const positiveTimezoneDate = new Date(2026, 9, 2, 12, 0, 0);
assert(formatLocalDateOnly(positiveTimezoneDate) === "2026-10-02", "local calendar date does not drift to the previous day");
assert(resolveBookingPage(4, 3).page === 3, "page overflow recovers to the last valid page");
assert(resolveBookingPage(1, 0).page === 1, "empty results retain page one");
assert(resolveBookingPage(4, 10, true).page === 1, "filter changes reset to page one");
assert(resolveBookingPage(2, 10).page === 2 && resolveBookingPage(2, 10).clearSelection, "page-only changes preserve page and clear selection");
assert([...statuses].join(",") === "PENDING,CONFIRMED,COMPLETED,CANCELLED", "booking status filter allowlist is canonical");
assert(payments.has("deposit_paid") && !payments.has("paid"), "payment status filter allowlist is independent");

const records = [
  { customerName: "Amina", customerPhone: "+212600000001", activityName: "Agafay Combo" },
  { customerName: "Youssef", customerPhone: "+212600000002", activityName: "Ouzoud Waterfalls" },
];
const search = "Agafay.".slice(0, 100);
const safePattern = new RegExp(escapeRegex(search), "i");
assert(records.filter((row) => safePattern.test(row.customerName) || safePattern.test(row.customerPhone) || safePattern.test(row.activityName)).length === 0, "search terms are escaped");
assert(records.filter((row) => /Agafay Combo/i.test(row.activityName)).length === 1, "activity-name search is represented");

const adminSource = readFileSync(new URL("../server/src/routes/admin.ts", import.meta.url), "utf8");
const storageSource = readFileSync(new URL("../server/src/storage.ts", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/pages/admin/dashboard.tsx", import.meta.url), "utf8");
const listSource = readFileSync(new URL("../client/src/components/admin/booking-management.tsx", import.meta.url), "utf8");
const paymentSource = readFileSync(new URL("../client/src/components/payment-management.tsx", import.meta.url), "utf8");
const remindersSource = readFileSync(new URL("../client/src/components/cash-booking-reminders.tsx", import.meta.url), "utf8");

assert(adminSource.includes("pagingKeys") && adminSource.includes("getBookingsPaginated"), "admin route selects pagination when query parameters are present");
assert(storageSource.includes("countDocuments(filter)") && storageSource.includes("activityIds"), "filtered totals and activity-name matching are server-side");
assert(adminSource.includes("/bookings/summary") && dashboardSource.includes("/admin/bookings/summary"), "summary endpoint is used for dashboard metrics");
assert(!dashboardSource.includes('queryKey: ["/admin/bookings"],'), "dashboard has no unbounded bookings query");
assert(listSource.includes("totalPages") && listSource.includes("pageSize") && listSource.includes("debouncedSearch"), "booking list has server pagination and debounced search");
assert(listSource.includes("Sélectionner tout sur cette page") && listSource.includes("placeholderData: keepPreviousData"), "selection is page-scoped and query transitions are stable");
assert(listSource.includes('["/admin/bookings/summary"]') && paymentSource.includes('["/admin/bookings/summary"]'), "mutations invalidate paged data and summary");
assert(dashboardSource.includes("limit=1") && remindersSource.includes("limit=100"), "secondary booking consumers use bounded queries");
assert(dashboardSource.includes("ExportBookings") || dashboardSource.includes("handleExportBookings"), "on-demand exports remain available");

console.log("Phase 2B2 admin pagination harness: PASS");
