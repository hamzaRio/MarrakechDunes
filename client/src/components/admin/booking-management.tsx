import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import BookingDetailsModal from "@/components/booking-details-modal";
import PaymentManagement from "@/components/payment-management";
import BookingRow, { type AdminBooking, type BookingLifecycleStatus } from "@/components/admin/booking-row";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { formatLocalDateOnly, getBookingDateOnly, getBookingPaymentSummary, normalizeBookingStatus, resolveBookingPage } from "@/lib/booking-utils";
import { Calendar as CalendarIcon, Download, FileText, Filter, Search, Trash2, X } from "lucide-react";

interface BookingManagementProps {
  onExportBookings: () => void;
  onExportBookingsPDF: () => void;
  canDeleteBookings: boolean;
}

const bookingIdOf = (booking: AdminBooking): string => booking._id || booking.id || "";

export default function BookingManagement({
  onExportBookings,
  onExportBookingsPDF,
  canDeleteBookings,
}: BookingManagementProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedBookingIds, setSelectedBookings] = useState<Set<string>>(() => new Set());
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<AdminBooking | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkStatusUpdateDialogOpen, setBulkStatusUpdateDialogOpen] = useState(false);
  const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState<BookingLifecycleStatus | "">("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const mutationInFlight = useRef(false);
  const isBusy = isDeleting || isBulkUpdating || updatingBookingId !== null;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim().slice(0, 100)), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const dateParams = useMemo(() => ({
    from: dateRange.from ? formatLocalDateOnly(dateRange.from) : undefined,
    to: dateRange.to ? formatLocalDateOnly(dateRange.to) : undefined,
  }), [dateRange.from, dateRange.to]);
  const listParams = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (paymentStatusFilter !== "all") params.set("paymentStatus", paymentStatusFilter);
    if (dateParams.from) params.set("from", dateParams.from);
    if (dateParams.to) params.set("to", dateParams.to);
    return params.toString();
  }, [dateParams.from, dateParams.to, debouncedSearch, page, pageSize, paymentStatusFilter, statusFilter]);
  const { data: bookingPage, isLoading, isFetching, isError } = useQuery<{
    bookings: AdminBooking[]; total: number; page: number; limit: number; totalPages: number;
  }>({
    queryKey: ["/admin/bookings", listParams],
    queryFn: async () => {
      const response = await apiFetch(`/admin/bookings?${listParams}`);
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
  const bookings = bookingPage?.bookings || [];
  const totalBookings = bookingPage?.total || 0;
  const totalPages = Math.max(1, bookingPage?.totalPages || 1);

  useEffect(() => {
    const resolved = resolveBookingPage(page, totalPages);
    if (resolved.page !== page) setPage(resolved.page);
  }, [page, totalPages]);

  const visibleBookingIds = useMemo(
    () => new Set(bookings.map(bookingIdOf).filter(Boolean)),
    [bookings],
  );
  const selectedBookings = useMemo(
    () => new Set([...selectedBookingIds].filter((id) => visibleBookingIds.has(id))),
    [selectedBookingIds, visibleBookingIds],
  );
  useEffect(() => {
    if (selectedBookings.size !== selectedBookingIds.size) setSelectedBookings(selectedBookings);
  }, [selectedBookings, selectedBookingIds]);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => bookingIdOf(booking) === selectedBookingId) || null,
    [bookings, selectedBookingId],
  );
  const paymentBooking = bookings.find((booking) => bookingIdOf(booking) === paymentBookingId);
  const refreshBookings = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] }),
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings/summary"] }),
    ]);
  };

  const filtersActive =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    Boolean(dateRange.from || dateRange.to);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setDateRange({});
    setPage(1);
    setSelectedBookings(new Set());
  };

  useEffect(() => {
    setPage(resolveBookingPage(page, totalPages, true).page);
    setSelectedBookings(new Set());
  }, [statusFilter, paymentStatusFilter, dateParams.from, dateParams.to, pageSize, debouncedSearch]);

  useEffect(() => {
    setSelectedBookings(new Set());
  }, [page]);

  const updateBookingStatus = async (bookingId: string, status: BookingLifecycleStatus) => {
    const response = await apiFetch(`/admin/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update booking status");
    }
  };

  const handleBookingStatusUpdate = async (booking: AdminBooking, status: BookingLifecycleStatus) => {
    if (mutationInFlight.current || normalizeBookingStatus(booking.status) === status) return;

    mutationInFlight.current = true;
    setUpdatingBookingId(bookingIdOf(booking));
    try {
      await updateBookingStatus(bookingIdOf(booking), status);
      await refreshBookings();
      toast({
        title: "Statut Mis à Jour",
        description: `La réservation est maintenant ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      mutationInFlight.current = false;
      setUpdatingBookingId(null);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    const response = await apiFetch(`/admin/bookings/${bookingId}`, { method: "DELETE" });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete booking");
    }
  };

  const confirmDeleteBooking = async () => {
    if (!canDeleteBookings || !bookingToDelete || mutationInFlight.current) return;

    mutationInFlight.current = true;
    setIsDeleting(true);
    try {
      await deleteBooking(bookingIdOf(bookingToDelete));
      await refreshBookings();
      setSelectedBookings((current) => {
        const next = new Set(current);
        next.delete(bookingIdOf(bookingToDelete));
        return next;
      });
      toast({
        title: "Réservation Supprimée",
        description: "La réservation a été supprimée avec succès.",
      });
      setBookingToDelete(null);
    } catch (error) {
      toast({
        title: "Erreur de Suppression",
        description: error instanceof Error ? error.message : "Impossible de supprimer la réservation",
        variant: "destructive",
      });
    } finally {
      mutationInFlight.current = false;
      setIsDeleting(false);
    }
  };

  const handleBookingSelect = (bookingId: string, checked: boolean) => {
    setSelectedBookings((current) => {
      const next = new Set(current);
      if (checked && visibleBookingIds.has(bookingId)) next.add(bookingId);
      else next.delete(bookingId);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedBookings(new Set());
      return;
    }

    setSelectedBookings(new Set(visibleBookingIds));
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatusToUpdate || selectedBookings.size === 0 || mutationInFlight.current) return;

    mutationInFlight.current = true;
    setIsBulkUpdating(true);
    let completedCount = 0;
    try {
      for (const bookingId of selectedBookings) {
        await updateBookingStatus(bookingId, bulkStatusToUpdate);
        completedCount++;
      }
      toast({
        title: "Statuts Mis à Jour",
        description: `${selectedBookings.size} réservation(s) mise(s) à jour avec succès.`,
      });
      setSelectedBookings(new Set());
      setBulkStatusToUpdate("");
      setBulkStatusUpdateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: `${completedCount} réservation(s) mise(s) à jour. ${error instanceof Error ? error.message : "Impossible de mettre à jour les réservations"}`,
        variant: "destructive",
      });
    } finally {
      try {
        await refreshBookings();
      } finally {
        mutationInFlight.current = false;
        setIsBulkUpdating(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!canDeleteBookings || selectedBookings.size === 0 || mutationInFlight.current) return;

    mutationInFlight.current = true;
    setIsDeleting(true);
    let completedCount = 0;
    try {
      for (const bookingId of selectedBookings) {
        await deleteBooking(bookingId);
        completedCount++;
        setSelectedBookings((current) => {
          const next = new Set(current);
          next.delete(bookingId);
          return next;
        });
      }
      toast({
        title: "Réservations Supprimées",
        description: `${selectedBookings.size} réservation(s) supprimée(s) avec succès.`,
      });
      setSelectedBookings(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: `${completedCount} réservation(s) supprimée(s). ${error instanceof Error ? error.message : "Impossible de supprimer les réservations"}`,
        variant: "destructive",
      });
    } finally {
      try {
        await refreshBookings();
      } finally {
        mutationInFlight.current = false;
        setIsDeleting(false);
      }
    }
  };

  const handleBulkExport = () => {
    const selectedData = bookings.filter((booking) => selectedBookings.has(bookingIdOf(booking)));
    if (selectedData.length === 0) return;

    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "Activity",
      "Date",
      "People",
      "Status",
      "Total Amount",
      "Payment Status",
    ];
    const rows = selectedData.map((booking) => [
      booking.customerName,
      booking.customerPhone,
      booking.customerEmail || "",
      booking.activity?.name || "",
      getBookingDateOnly(booking.preferredDate)?.toLocaleDateString() || "Flexible",
      booking.numberOfPeople,
      normalizeBookingStatus(booking.status),
      getBookingPaymentSummary(booking).totalAmount,
      getBookingPaymentSummary(booking).paymentStatus,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bookings-selected-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(anchor);

    toast({
      title: "Export Réussi",
      description: `${selectedData.length} réservation(s) exportée(s) avec succès.`,
    });
  };

  const handleContactCustomer = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  const handleSendWhatsApp = (booking: AdminBooking) => {
    if (!booking.activity) {
      toast({
        title: "Erreur",
        description: "Activity information not available for this booking",
        variant: "destructive",
      });
      return;
    }

    const message = `Hello ${booking.customerName}, regarding your booking for ${booking.activity.name} for ${booking.numberOfPeople} people. Status: ${booking.status}. Total: ${booking.totalAmount} MAD.`;
    const phone = booking.customerPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-moroccan-blue">
          📋 Gestion des Réservations
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onExportBookings}
            variant="outline"
            size="sm"
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <Download className="mr-2 h-4 w-4" />
            📊 Exporter CSV
          </Button>
          <Button
            onClick={onExportBookingsPDF}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <FileText className="mr-2 h-4 w-4" />
            📄 Exporter PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Recherche et Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                disabled={isBusy}
                placeholder="Rechercher (nom, téléphone, activité)..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isBusy}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter} disabled={isBusy}>
              <SelectTrigger>
                <SelectValue placeholder="Statut de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les paiements</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
                <SelectItem value="fully_paid">Fully Paid</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button disabled={isBusy} variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from
                    ? dateRange.to
                      ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                      : dateRange.from.toLocaleDateString()
                    : "Période"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  disabled={isBusy}
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
                {dateRange.from ? (
                  <div className="flex justify-end gap-2 border-t p-3">
                    <Button disabled={isBusy} variant="outline" size="sm" onClick={() => setDateRange({})}>
                      <X className="mr-1 h-4 w-4" />
                      Effacer
                    </Button>
                  </div>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>

          {selectedBookings.size > 0 ? (
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 lg:flex-row lg:items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedBookings.size} réservation(s) sélectionnée(s)
              </span>
              <div className="flex flex-wrap gap-2">
                <Select
                  disabled={isBusy}
                  value={bulkStatusToUpdate}
                  onValueChange={(value) => setBulkStatusToUpdate(value as BookingLifecycleStatus)}
                >
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="Changer statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={isBusy || !bulkStatusToUpdate}
                  onClick={() => setBulkStatusUpdateDialogOpen(true)}
                >
                  Mettre à jour
                </Button>
                <Button disabled={isBusy} size="sm" variant="outline" onClick={handleBulkExport}>
                  <Download className="mr-1 h-4 w-4" />
                  Exporter
                </Button>
                {canDeleteBookings ? (
                  <Button disabled={isBusy} size="sm" variant="destructive" onClick={() => setBulkDeleteDialogOpen(true)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Supprimer
                  </Button>
                ) : null}
                <Button disabled={isBusy} size="sm" variant="ghost" onClick={() => setSelectedBookings(new Set())}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Effacer la sélection</span>
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col justify-between gap-3 text-lg sm:flex-row sm:items-center">
            <span>📋 Toutes les Réservations</span>
            <div className="flex flex-wrap items-center gap-2 text-sm font-normal text-gray-600">
              <Checkbox
                id="select-visible-bookings"
                disabled={isBusy || visibleBookingIds.size === 0}
                checked={selectedBookings.size > 0 && selectedBookings.size === visibleBookingIds.size
                  ? true : selectedBookings.size > 0 ? "indeterminate" : false}
                onCheckedChange={(checked) => handleSelectAll(checked === true)}
              />
              <Label htmlFor="select-visible-bookings">Sélectionner tout sur cette page ({bookings.length})</Label>
              {filtersActive ? (
                <Button disabled={isBusy} variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Réinitialiser
                </Button>
              ) : null}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">Chargement des réservations…</div>
          ) : isError ? (
            <div className="py-12 text-center text-red-600">Impossible de charger les réservations.</div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">Aucune réservation trouvée avec les filtres sélectionnés.</p>
              {filtersActive ? (
                <Button disabled={isBusy} variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking, index) => {
                const bookingId = bookingIdOf(booking) || `booking-${index}`;
                return (
                  <BookingRow
                    key={bookingId}
                    booking={booking}
                    isBusy={isBusy || !bookingIdOf(booking)}
                    isSelected={selectedBookings.has(bookingId)}
                    onSelect={(checked) => handleBookingSelect(bookingId, checked)}
                    onViewDetails={() => setSelectedBookingId(bookingId)}
                    onStatusChange={(status) => handleBookingStatusUpdate(booking, status)}
                    onManagePayment={() => setPaymentBookingId(bookingIdOf(booking))}
                    onContact={() => handleContactCustomer(booking.customerPhone)}
                    onWhatsApp={() => handleSendWhatsApp(booking)}
                    onDelete={() => setBookingToDelete(booking)}
                    canDelete={canDeleteBookings}
                  />
                );
              })}
            </div>
          )}
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {isFetching ? "Mise à jour…" : `${totalBookings} réservation(s) · page ${page} sur ${totalPages}`}
            </span>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))} disabled={isBusy}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" disabled={isBusy || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={isBusy || page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Suivant</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedBooking ? (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={Boolean(selectedBookingId) && !paymentBooking}
          onClose={() => setSelectedBookingId(null)}
          onContactCustomer={() => handleContactCustomer(selectedBooking.customerPhone)}
          onSendWhatsApp={() => handleSendWhatsApp(selectedBooking)}
          onManagePayment={() => setPaymentBookingId(bookingIdOf(selectedBooking))}
        />
      ) : null}

      {paymentBooking ? (
        <PaymentManagement
          key={bookingIdOf(paymentBooking)}
          booking={paymentBooking}
          open
          dialogOnly
          onOpenChange={(open) => !open && setPaymentBookingId(null)}
        />
      ) : null}

      <AlertDialog open={canDeleteBookings && Boolean(bookingToDelete)} onOpenChange={(open) => !open && setBookingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la réservation de <strong>{bookingToDelete?.customerName}</strong> ?
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBooking}
              disabled={isBusy}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={canDeleteBookings && bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedBookings.size} réservation(s) ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBusy || selectedBookings.size === 0}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkStatusUpdateDialogOpen} onOpenChange={setBulkStatusUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la mise à jour</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir mettre à jour {selectedBookings.size} réservation(s) au statut
              {` "${bulkStatusToUpdate}"`} ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusUpdate}
              disabled={isBusy || selectedBookings.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
