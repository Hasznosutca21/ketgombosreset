import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Package,
  Phone,
  Clock,
  User,
  Car,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import {
  getAdminReservations,
  adminUpdateReservation,
  Reservation,
  getStoredUser,
} from "@/lib/api";
import WaitingForPartsDialog from "./WaitingForPartsDialog";
import AdminRescheduleDialog from "./AdminRescheduleDialog";
import WorkflowProgress from "./WorkflowProgress";
import { format } from "date-fns";
import { hu as huLocale, enUS } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminReservations = () => {
  const { t, language } = useLanguage();
  const dateLocale = language === "hu" ? huLocale : enUS;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [waitingDialogOpen, setWaitingDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const apiUser = getStoredUser();

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminReservations({ per_page: 50, with_details: 1 });
      if (res.success && res.data) {
        setReservations(res.data.reservations || []);
      } else {
        toast.error(t.failedToLoad);
      }
    } catch {
      toast.error(t.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (apiUser) {
      fetchReservations();
    }
  }, []);

  const isWaitingForParts = (r: Reservation) => {
    return r.notes?.includes("[ALKATRESZ_VAR]") ?? false;
  };

  const extractMissingPart = (notes: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/\[ALKATRESZ_VAR\]\s*(.+?)(?:\n|$)/);
    return match ? match[1].trim() : null;
  };

  const handleMarkWaitingForParts = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setWaitingDialogOpen(true);
  };

  const handleWaitingConfirm = async (missingPart: string, notes: string, reschedule: boolean) => {
    if (!selectedReservation) return;

    const waitingNote = `[ALKATRESZ_VAR] ${missingPart}${notes ? `\n${notes}` : ""}`;
    const existingNotes = selectedReservation.notes || "";
    const updatedNotes = existingNotes
      ? `${existingNotes}\n${waitingNote}`
      : waitingNote;

    const res = await adminUpdateReservation(selectedReservation.id, {
      notes: updatedNotes,
    });

    if (res.success) {
      toast.success(t.markedAsWaiting);

      // Send email notification
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        await fetch(`${supabaseUrl}/functions/v1/send-waiting-for-parts-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            reservation_id: selectedReservation.id,
            missing_part: missingPart,
            additional_notes: notes,
            customer_name: selectedReservation.vehicle?.name || "",
            customer_email: "", // Will be looked up by the edge function
            language,
          }),
        });
        toast.success(t.notificationSent);
      } catch {
        // Email is best-effort
      }

      setWaitingDialogOpen(false);
      await fetchReservations();

      if (reschedule) {
        setRescheduleDialogOpen(true);
      }
    } else {
      toast.error(t.failedToMarkWaiting);
    }
  };

  const handleRescheduleConfirm = async (newDate: Date, newTime: string) => {
    if (!selectedReservation) return;

    // Build ISO datetime from date + time
    const [hours, minutes] = newTime.includes("AM") || newTime.includes("PM")
      ? convertTo24h(newTime)
      : newTime.split(":").map(Number);
    const dt = new Date(newDate);
    dt.setHours(hours, minutes, 0, 0);

    const res = await adminUpdateReservation(selectedReservation.id, {
      reservation_from: dt.toISOString(),
    });

    if (res.success) {
      toast.success(t.appointmentRescheduled);
      setRescheduleDialogOpen(false);
      setSelectedReservation(null);
      await fetchReservations();
    } else {
      toast.error(t.failedToReschedule);
    }
  };

  const convertTo24h = (timeStr: string): [number, number] => {
    const [time, period] = timeStr.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return [h, m];
  };

  const formatReservationDate = (isoDate: string) => {
    try {
      return format(new Date(isoDate), "yyyy. MM. dd. HH:mm", { locale: dateLocale });
    } catch {
      return isoDate;
    }
  };

  const getStatusBadge = (r: Reservation) => {
    if (isWaitingForParts(r)) {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300">
          <Package className="h-3 w-3 mr-1" />
          {t.waitingForParts}
        </Badge>
      );
    }
    if (r.workflow?.is_end_state) {
      return <Badge variant="secondary">{r.workflow.name}</Badge>;
    }
    if (r.workflow) {
      return <Badge variant="outline">{r.workflow.name}</Badge>;
    }
    return <Badge variant="outline">{t.pending}</Badge>;
  };

  if (!apiUser) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {language === "hu"
          ? "Jelentkezzen be a REST API-ba a foglalások kezeléséhez."
          : "Log in to the REST API to manage reservations."}
      </div>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              {t.appointmentsDashboard}
            </CardTitle>
            <CardDescription>{t.viewManageAppointments}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchReservations} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            {t.refresh}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Incomplete work alerts */}
        {reservations.filter(isWaitingForParts).length > 0 && (
          <Alert className="mb-4 border-orange-300 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-300">
              <strong>
                {reservations.filter(isWaitingForParts).length}{" "}
                {language === "hu" ? "befejezetlen munka – alkatrészre vár" : "incomplete job(s) waiting for parts"}
              </strong>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reservations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t.noAppointments}</p>
        ) : (
          <div className="space-y-3">
            {/* Show waiting-for-parts first */}
            {[...reservations]
              .sort((a, b) => {
                const aWaiting = isWaitingForParts(a) ? 0 : 1;
                const bWaiting = isWaitingForParts(b) ? 0 : 1;
                if (aWaiting !== bWaiting) return aWaiting - bWaiting;
                return new Date(b.reservation_from).getTime() - new Date(a.reservation_from).getTime();
              })
              .map((r) => {
                const waiting = isWaitingForParts(r);
                const missingPart = extractMissingPart(r.notes);

                return (
                  <div
                    key={r.id}
                    className={`border rounded-lg p-4 space-y-2 transition-colors ${
                      waiting
                        ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/10"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(r)}
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatReservationDate(r.reservation_from)}
                          </span>
                        </div>

                        {r.service && (
                          <p className="font-medium flex items-center gap-1.5">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                            {r.service.name}
                          </p>
                        )}

                        {r.vehicle && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Car className="h-3.5 w-3.5" />
                            {r.vehicle.vehicle_type?.name}
                            {r.vehicle.license_plate && ` • ${r.vehicle.license_plate}`}
                            {r.vehicle.name && ` (${r.vehicle.name})`}
                          </p>
                        )}

                        {r.location && (
                          <p className="text-xs text-muted-foreground">
                            📍 {r.location.name} – {r.location.city}
                          </p>
                        )}

                        {waiting && missingPart && (
                          <div className="mt-2 flex items-center gap-1.5 text-sm text-orange-700 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-900/20 rounded px-2 py-1">
                            <Package className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>
                              <strong>{t.partNeeded}:</strong> {missingPart}
                            </span>
                          </div>
                        )}

                        {/* Workflow progress bar */}
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <WorkflowProgress
                            currentWorkflowId={r.workflow?.id}
                            isWaitingForParts={waiting}
                            missingPart={missingPart}
                            compact
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        {!waiting && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkWaitingForParts(r)}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            {t.waitingForParts}
                          </Button>
                        )}
                        {waiting && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReservation(r);
                              setRescheduleDialogOpen(true);
                            }}
                          >
                            <Phone className="h-3.5 w-3.5 mr-1" />
                            {t.reschedule}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>

      <WaitingForPartsDialog
        open={waitingDialogOpen}
        onOpenChange={setWaitingDialogOpen}
        onConfirm={handleWaitingConfirm}
        customerName={selectedReservation?.vehicle?.name || undefined}
      />

      {selectedReservation && (
        <AdminRescheduleDialog
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          currentDate={new Date(selectedReservation.reservation_from)}
          currentTime={format(new Date(selectedReservation.reservation_from), "h:mm a")}
          onConfirm={handleRescheduleConfirm}
        />
      )}
    </Card>
  );
};

export default AdminReservations;
