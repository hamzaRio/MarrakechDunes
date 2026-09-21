import EmailModal from "@/components/EmailModal";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { getBookingDate, getBookingDateOnly, getBookingPaymentSummary, normalizeBookingStatus } from "@/lib/booking-utils";
import {
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  History,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  User,
  Users,
  Copy,
} from "lucide-react";
import type { BookingWithActivity } from "marrakechdunes-shared/schema";

interface BookingDetailsModalProps {
  booking: BookingWithActivity;
  isOpen: boolean;
  onClose: () => void;
  onContactCustomer?: () => void;
  onSendWhatsApp?: () => void;
  onManagePayment: () => void;
}

function bookingStatusClass(status: string): string {
  switch (String(status || "").toUpperCase()) {
    case "CONFIRMED":
      return "border-blue-200 bg-blue-100 text-blue-800";
    case "COMPLETED":
      return "border-green-200 bg-green-100 text-green-800";
    case "PENDING":
      return "border-yellow-200 bg-yellow-100 text-yellow-800";
    case "CANCELLED":
      return "border-red-200 bg-red-100 text-red-800";
    default:
      return "border-gray-200 bg-gray-100 text-gray-800";
  }
}

function paymentStatusClass(status: string): string {
  switch (String(status || "").toLowerCase()) {
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

export default function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onContactCustomer,
  onSendWhatsApp,
  onManagePayment,
}: BookingDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const bookingStatus = normalizeBookingStatus(booking.status);
  const { paymentStatus, totalAmount, paidAmount, remainingAmount, depositAmount, paymentMethod, progress } = getBookingPaymentSummary(booking);
  const bookingDate = getBookingDateOnly(booking.preferredDate);
  const activityPrice = Number(booking.activity?.price) || 0;
  const marketReferencePrice = Number(booking.activity?.getyourguidePrice) || 0;
  const internalBookingId = String(booking._id || booking.id || '');
  const bookingReference = internalBookingId ? internalBookingId.slice(-8).toUpperCase() : 'Unavailable';
  const copyInternalId = async () => {
    if (!internalBookingId) return;
    await navigator.clipboard.writeText(internalBookingId);
    setCopied(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-y-auto bg-white text-gray-900"
        aria-describedby="booking-details-description"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">Détails de la Réservation</DialogTitle>
          <DialogDescription id="booking-details-description">
            Vue opérationnelle complète de la réservation, du client et du paiement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-moroccan-blue">
                <Receipt className="h-5 w-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={bookingStatusClass(bookingStatus)}>{bookingStatus}</Badge>
                <Badge className={paymentStatusClass(paymentStatus)}>
                  {paymentStatus.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="font-medium text-slate-700">Booking Reference: <span className="font-mono">{bookingReference}</span></div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <span className="break-all">Internal Booking ID: <span className="font-mono">{internalBookingId}</span></span>
                  <Button type="button" size="sm" variant="outline" className="h-7 shrink-0" onClick={copyInternalId}><Copy className="mr-1 h-3 w-3" />{copied ? 'Copied' : 'Copy'}</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-lg font-bold text-moroccan-blue">{totalAmount.toLocaleString()} MAD</div>
                </div>
                <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                  <div className="text-xs text-gray-500">Payé</div>
                  <div className="text-lg font-bold text-green-700">{paidAmount.toLocaleString()} MAD</div>
                </div>
                <div className="rounded-lg border border-orange-100 bg-orange-50 p-3">
                  <div className="text-xs text-gray-500">Restant</div>
                  <div className="text-lg font-bold text-orange-700">{remainingAmount.toLocaleString()} MAD</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <User className="h-5 w-5 text-blue-600" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{booking.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{booking.customerPhone}</span>
                </div>
                {booking.customerEmail ? (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="break-all">{booking.customerEmail}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Booking details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="font-medium">{booking.activity?.name || "Activity not found"}</div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{booking.numberOfPeople} personne{booking.numberOfPeople !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{bookingDate?.toLocaleDateString("fr-FR") || "Flexible"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{bookingDate?.toLocaleTimeString("fr-FR") || "Toute heure"}</span>
                </div>
                {booking.notes ? (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-1 font-medium">Notes</div>
                      <p className="whitespace-pre-wrap text-gray-600">{booking.notes}</p>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div><div className="text-gray-500">Total</div><div className="font-semibold">{totalAmount.toLocaleString()} MAD</div></div>
                <div><div className="text-gray-500">Paid</div><div className="font-semibold text-green-700">{paidAmount.toLocaleString()} MAD</div></div>
                <div><div className="text-gray-500">Remaining</div><div className="font-semibold text-orange-700">{remainingAmount.toLocaleString()} MAD</div></div>
                <div><div className="text-gray-500">Method</div><div className="font-semibold capitalize">{paymentMethod.replace(/_/g, " ")}</div></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progression du Paiement</span><span>{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200" role="progressbar" aria-label="Progression du paiement" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-2 rounded-full bg-gradient-to-r from-moroccan-blue to-moroccan-red transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
              {depositAmount > 0 ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  Acompte enregistré: <strong>{depositAmount.toLocaleString()} MAD</strong>
                </div>
              ) : null}
              <Button variant="outline" size="sm" onClick={onManagePayment}>Gérer le paiement</Button>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <DollarSign className="h-5 w-5 text-moroccan-blue" />
                Référence de marché interne
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg border-2 border-green-200 bg-white p-3">
                <div className="font-medium text-green-700">Notre Prix</div>
                <div className="text-lg font-bold text-green-600">{activityPrice ? activityPrice.toLocaleString() : "N/A"} MAD</div>
                <div className="text-xs text-gray-500">Par personne</div>
              </div>
              <div className="rounded-lg border-2 border-orange-200 bg-white p-3">
                <div className="font-medium text-orange-700">Référence enregistrée</div>
                <div className="text-lg font-bold text-orange-600">{marketReferencePrice ? marketReferencePrice.toLocaleString() : "N/A"} MAD</div>
                <div className="text-xs text-gray-500">Provenance à confirmer</div>
              </div>
              <div className="rounded-lg border-2 border-blue-200 bg-white p-3">
                <div className="font-medium text-blue-700">Comparaison</div>
                <div className="text-lg font-bold text-blue-600">À vérifier</div>
                <div className="text-xs text-gray-500">Aucune décision tarifaire automatique</div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={onContactCustomer} disabled={!onContactCustomer}><Phone className="mr-1 h-4 w-4" />Contacter</Button>
                <Button variant="outline" size="sm" onClick={onSendWhatsApp} disabled={!onSendWhatsApp}><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</Button>
                {booking.customerEmail ? (
                  <EmailModal
                    customerEmail={booking.customerEmail}
                    customerName={booking.customerName}
                    bookingId={booking._id || booking.id || ""}
                    trigger={<Button variant="outline" size="sm"><Mail className="mr-1 h-4 w-4" />Email</Button>}
                  />
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900"><History className="h-5 w-5 text-gray-600" />History / Audit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {booking.statusHistory?.length ? (
                  booking.statusHistory.map((entry, index) => (
                    <div key={`${entry.changedAt}-${index}`} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
                      <div><div className="font-medium">{normalizeBookingStatus(entry.status)}</div><div className="text-xs text-gray-500">{entry.changedBy}</div>{entry.reason ? <p className="text-xs text-gray-500">{entry.reason}</p> : null}</div>
                      <div className="text-right text-xs text-gray-500">{getBookingDate(entry.changedAt)?.toLocaleString("fr-FR") || "Date indisponible"}</div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2 text-gray-600">
                    <div>Créée: {getBookingDate(booking.createdAt)?.toLocaleString("fr-FR") || "Date indisponible"}</div>
                    <div>Mise à jour: {getBookingDate(booking.updatedAt)?.toLocaleString("fr-FR") || "Date indisponible"}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-2"><Button variant="outline" onClick={onClose}>Fermer</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
