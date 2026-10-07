import { AlertCircle, ArrowRight, CalendarClock, CheckCircle2, CreditCard, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import type { BookingType, BookingWithActivity } from "marrakechdunes-shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCasablancaDateOnly, formatLocalDateOnly, getBookingDateOnly, getBookingPaymentSummary, normalizeBookingStatus } from "@/lib/booking-utils";

interface ActionRequiredInboxProps {
  bookings: BookingWithActivity[];
  counts: { pending: number; paymentAttention: number; upcoming: number };
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onViewBooking: (booking: BookingType) => void;
}

const MAX_ITEMS = 5;

function dateKey(value: BookingType["preferredDate"]): string | null {
  const date = getBookingDateOnly(value);
  return date ? formatLocalDateOnly(date) : null;
}

function formatBookingDate(value: BookingType["preferredDate"]): string {
  const date = getBookingDateOnly(value);
  return date ? date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "Date flexible";
}

function BookingItem({ booking, onViewBooking }: { booking: BookingWithActivity; onViewBooking: (booking: BookingType) => void }) {
  const payment = getBookingPaymentSummary(booking);
  const status = normalizeBookingStatus(booking.status);
  return (
    <li className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium text-gray-900">{booking.customerName}</p>
        <p className="truncate text-sm text-gray-600">{booking.activity?.name || "Activité non trouvée"}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
          <span>{formatBookingDate(booking.preferredDate)}</span>
          <span>{booking.numberOfPeople} participant{booking.numberOfPeople === 1 ? "" : "s"}</span>
          <Badge variant="outline" className="h-5 px-1.5 text-[11px]">{status}</Badge>
          {payment.paymentStatus !== "fully_paid" ? (
            <Badge variant="outline" className="h-5 border-orange-200 px-1.5 text-[11px] text-orange-700">{payment.paymentStatus.replace("_", " ")}</Badge>
          ) : null}
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0 self-start sm:self-auto" onClick={() => onViewBooking(booking)}>
        Voir le détail
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </li>
  );
}

export default function ActionRequiredInbox({ bookings, counts, isLoading, isError, onRetry, onViewBooking }: ActionRequiredInboxProps) {
  const today = formatCasablancaDateOnly();
  const tomorrowDate = new Date(`${today}T00:00:00`);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = formatLocalDateOnly(tomorrowDate);
  const activeBookings = bookings.filter((booking) => normalizeBookingStatus(booking.status) !== "CANCELLED");
  const pending = activeBookings.filter((booking) => normalizeBookingStatus(booking.status) === "PENDING");
  const paymentAttention = activeBookings.filter((booking) => {
    const paymentStatus = getBookingPaymentSummary(booking).paymentStatus;
    return paymentStatus === "unpaid" || paymentStatus === "deposit_paid";
  });
  const upcoming = activeBookings.filter((booking) => {
    const key = dateKey(booking.preferredDate);
    return key === today || key === tomorrow;
  });
  const totalActions = counts.pending + counts.paymentAttention + counts.upcoming;

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Action Required
          </CardTitle>
          <p className="mt-1 text-sm text-gray-600">Les éléments opérationnels qui méritent votre attention.</p>
        </div>
        {totalActions > 0 ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{totalActions} élément{totalActions === 1 ? "" : "s"}</span> : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2" role="status" aria-label="Chargement des actions" aria-live="polite">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-16 w-full" />)}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <span>Impossible de charger les actions opérationnelles.</span>
            <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw className="mr-1 h-4 w-4" />Réessayer</Button>
          </div>
        ) : totalActions === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" /> Aucune action urgente pour le moment.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <InboxCategory title="Réservations en attente" icon={<AlertCircle className="h-4 w-4 text-orange-600" />} count={counts.pending} items={pending} onViewBooking={onViewBooking} />
            <InboxCategory title="Paiement à suivre" icon={<CreditCard className="h-4 w-4 text-red-600" />} count={counts.paymentAttention} items={paymentAttention} onViewBooking={onViewBooking} />
            <InboxCategory title="Aujourd'hui / demain" icon={<CalendarClock className="h-4 w-4 text-blue-600" />} count={counts.upcoming} items={upcoming} onViewBooking={onViewBooking} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InboxCategory({ title, icon, count, items, onViewBooking }: { title: string; icon: ReactNode; count: number; items: BookingType[]; onViewBooking: (booking: BookingType) => void }) {
  return (
    <section aria-label={title}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">{icon}{title}<span className="text-gray-500">({count})</span></h3>
      {items.length === 0 ? <p className="rounded-md border border-dashed border-gray-300 bg-white/70 p-3 text-sm text-gray-500">Rien à traiter.</p> : (
        <ul className="space-y-2">{items.slice(0, MAX_ITEMS).map((booking) => <BookingItem key={String(booking._id || booking.id || `${booking.customerName}-${booking.preferredDate}`)} booking={booking} onViewBooking={onViewBooking} />)}</ul>
      )}
    </section>
  );
}
