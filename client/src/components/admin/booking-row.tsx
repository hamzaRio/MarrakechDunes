import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBookingDateOnly, getBookingPaymentSummary, normalizeBookingStatus } from "@/lib/booking-utils";
import { CalendarDays, Eye, MessageCircle, MoreHorizontal, Phone, Trash2, Users } from "lucide-react";
import type { ActivityType, BookingType } from "marrakechdunes-shared/schema";

export type BookingLifecycleStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface AdminBooking extends BookingType {
  activity?: ActivityType;
}

interface BookingRowProps {
  booking: AdminBooking;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onViewDetails: () => void;
  onStatusChange: (status: BookingLifecycleStatus) => void;
  onManagePayment: () => void;
  isBusy: boolean;
  onContact: () => void;
  onWhatsApp: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

const BOOKING_STATUSES: BookingLifecycleStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

function bookingStatusClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "border-yellow-200 bg-yellow-100 text-yellow-800";
    case "CONFIRMED":
      return "border-blue-200 bg-blue-100 text-blue-800";
    case "COMPLETED":
      return "border-green-200 bg-green-100 text-green-800";
    case "CANCELLED":
      return "border-red-200 bg-red-100 text-red-800";
    default:
      return "border-gray-200 bg-gray-100 text-gray-800";
  }
}

function paymentStatusClass(status: string): string {
  switch (status) {
    case "fully_paid":
      return "border-green-200 bg-green-100 text-green-800";
    case "deposit_paid":
      return "border-orange-200 bg-orange-100 text-orange-800";
    case "unpaid":
      return "border-red-200 bg-red-100 text-red-800";
    default:
      return "border-gray-200 bg-gray-100 text-gray-800";
  }
}

function paymentStatusLabel(status: string): string {
  return String(status || "unpaid").replace(/_/g, " ").toUpperCase();
}

export default function BookingRow({
  booking,
  isSelected,
  onSelect,
  onViewDetails,
  onStatusChange,
  onManagePayment,
  isBusy,
  onContact,
  onWhatsApp,
  onDelete,
  canDelete,
}: BookingRowProps) {
  const normalizedStatus = normalizeBookingStatus(booking.status);
  const { paymentStatus: normalizedPaymentStatus, totalAmount, paidAmount, remainingAmount } = getBookingPaymentSummary(booking);
  const bookingDate = getBookingDateOnly(booking.preferredDate);
  const statusSelectValue = BOOKING_STATUSES.includes(normalizedStatus as BookingLifecycleStatus)
    ? normalizedStatus
    : undefined;

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[auto_minmax(200px,1.4fr)_minmax(150px,0.8fr)_minmax(180px,1fr)_minmax(0,1.5fr)] xl:items-center">
        <Checkbox
          disabled={isBusy || !(booking._id || booking.id)}
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(checked === true)}
          aria-label={`Sélectionner la réservation de ${booking.customerName}`}
        />

        <div className="min-w-0 space-y-1">
          <div className="truncate font-semibold text-gray-900">{booking.customerName}</div>
          <div className="truncate text-sm text-gray-600">{booking.activity?.name || "Activity not found"}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {bookingDate?.toLocaleDateString("fr-FR") || "Flexible"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {booking.numberOfPeople} personne{booking.numberOfPeople !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:flex-col xl:items-start">
          <Badge className={bookingStatusClass(normalizedStatus)}>{normalizedStatus}</Badge>
          <Badge className={paymentStatusClass(normalizedPaymentStatus)}>
            {paymentStatusLabel(normalizedPaymentStatus)}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 break-words text-sm xl:grid-cols-1 xl:gap-1">
          <div className="flex flex-col xl:flex-row xl:justify-between xl:gap-3">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-moroccan-blue">{totalAmount.toLocaleString()} MAD</span>
          </div>
          <div className="flex flex-col xl:flex-row xl:justify-between xl:gap-3">
            <span className="text-gray-500">Payé</span>
            <span className="font-medium text-green-700">{paidAmount.toLocaleString()} MAD</span>
          </div>
          <div className="flex flex-col xl:flex-row xl:justify-between xl:gap-3">
            <span className="text-gray-500">Restant</span>
            <span className="font-medium text-orange-700">{remainingAmount.toLocaleString()} MAD</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <Button variant="outline" size="sm" onClick={onViewDetails} disabled={isBusy}>
            <Eye className="mr-1 h-4 w-4" />
            Détails
          </Button>

          {normalizedStatus === "PENDING" ? (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              disabled={isBusy}
              onClick={() => onStatusChange("CONFIRMED")}
            >
              Confirmer
            </Button>
          ) : null}

          <Select
            disabled={isBusy}
            value={statusSelectValue}
            onValueChange={(value) => onStatusChange(value as BookingLifecycleStatus)}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Changer statut" />
            </SelectTrigger>
            <SelectContent>
              {BOOKING_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={onManagePayment} disabled={isBusy}>
            Paiement
          </Button>

          <Button variant="outline" size="sm" onClick={onWhatsApp}>
            <MessageCircle className="mr-1 h-4 w-4" />
            WhatsApp
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={`Plus d'actions pour ${booking.customerName}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onContact}>
                <Phone className="h-4 w-4" />
                Contacter
              </DropdownMenuItem>
              {canDelete ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={isBusy} className="text-red-600 focus:text-red-700" onSelect={onDelete}>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
