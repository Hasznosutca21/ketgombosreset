import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { History, Loader2, Clock, Wrench, Car, Package, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyReservations, Reservation, getStoredUser } from "@/lib/api";
import WorkflowProgress from "./WorkflowProgress";
import { format } from "date-fns";
import { hu as huLocale, enUS } from "date-fns/locale";

interface AppointmentHistoryProps {
  userEmail: string | undefined;
}

const AppointmentHistory = ({ userEmail }: AppointmentHistoryProps) => {
  const { t, language } = useLanguage();
  const dateLocale = language === "hu" ? huLocale : enUS;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUser = getStoredUser();

  useEffect(() => {
    if (!apiUser) {
      setLoading(false);
      return;
    }
    getMyReservations()
      .then((data) => setReservations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isWaitingForParts = (r: Reservation) =>
    r.notes?.includes("[ALKATRESZ_VAR]") ?? false;

  const extractMissingPart = (notes: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/\[ALKATRESZ_VAR\]\s*(.+?)(?:\n|$)/);
    return match ? match[1].trim() : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!apiUser || reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {language === "hu" ? "Nincsenek foglalások" : "No reservations"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {language === "hu"
            ? "Az Ön foglalásai itt fognak megjelenni."
            : "Your reservations will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((r) => {
        const waiting = isWaitingForParts(r);
        const missingPart = extractMissingPart(r.notes);

        return (
          <Card
            key={r.id}
            className={`transition-colors ${
              waiting
                ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/10"
                : ""
            }`}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  {r.service && (
                    <p className="font-medium flex items-center gap-1.5">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      {r.service.name}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(r.reservation_from), "yyyy. MM. dd. HH:mm", {
                      locale: dateLocale,
                    })}
                  </p>
                  {r.vehicle && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5" />
                      {r.vehicle.vehicle_type?.name}
                      {r.vehicle.license_plate && ` • ${r.vehicle.license_plate}`}
                    </p>
                  )}
                  {r.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {r.location.name}
                    </p>
                  )}
                </div>
                <div>
                  {waiting ? (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300">
                      <Package className="h-3 w-3 mr-1" />
                      {t.waitingForParts}
                    </Badge>
                  ) : r.workflow ? (
                    <Badge variant="outline">{r.workflow.name}</Badge>
                  ) : (
                    <Badge variant="outline">{t.pending}</Badge>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="pt-2 border-t border-border/50">
                <WorkflowProgress
                  currentWorkflowId={r.workflow?.id}
                  isWaitingForParts={waiting}
                  missingPart={missingPart}
                />
              </div>

              {waiting && missingPart && (
                <div className="flex items-center gap-1.5 text-sm text-orange-700 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-900/20 rounded px-2 py-1.5">
                  <Package className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    <strong>{t.partNeeded}:</strong> {missingPart}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AppointmentHistory;
