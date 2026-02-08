import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ArrowLeft, Calendar, Car, MapPin, Clock, Trash2, Loader2, RefreshCw, LogOut, Shield, X, CalendarClock, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AdminRescheduleDialog from "@/components/AdminRescheduleDialog";
import { supabase } from "@/integrations/supabase/client";
import { cancelAppointment, rescheduleAppointment } from "@/lib/appointments";
import { toast } from "sonner";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { Capacitor } from "@capacitor/core";

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  vehicle: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
  status: string;
  created_at: string;
}

const vehicleLabels: Record<string, string> = {
  "model-s": "Model S",
  "model-3": "Model 3",
  "model-x": "Model X",
  "model-y": "Model Y",
  cybertruck: "Cybertruck",
  roadster: "Roadster",
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { t, language } = useLanguage();
  const pushNotifications = usePushNotifications();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isTogglingPush, setIsTogglingPush] = useState(false);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);

  const dateLocale = language === "hu" ? hu : enUS;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  // Check admin push registration status
  useEffect(() => {
    const checkPushStatus = async () => {
      if (user && isAdmin && pushNotifications.isSupported && pushNotifications.token) {
        const isRegistered = await pushNotifications.checkAdminPushRegistration(user.id);
        setIsPushEnabled(isRegistered);
      }
    };
    checkPushStatus();
  }, [user, isAdmin, pushNotifications.isSupported, pushNotifications.token]);

  const handleTogglePush = async () => {
    if (!user || !pushNotifications.token) return;
    
    setIsTogglingPush(true);
    const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
    
    try {
      if (isPushEnabled) {
        const success = await pushNotifications.unregisterAdminPushToken(user.id);
        if (success) {
          setIsPushEnabled(false);
          toast.success(language === "hu" ? "Push értesítések kikapcsolva" : "Push notifications disabled");
        }
      } else {
        const success = await pushNotifications.registerAdminPushToken(user.id, platform);
        if (success) {
          setIsPushEnabled(true);
          toast.success(language === "hu" ? "Push értesítések bekapcsolva" : "Push notifications enabled");
        }
      }
    } catch (error) {
      console.error("Error toggling push:", error);
      toast.error(language === "hu" ? "Hiba történt" : "An error occurred");
    } finally {
      setIsTogglingPush(false);
    }
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error(t.failedToLoad);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast.error(t.onlyAdminsCanDelete);
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.success(t.appointmentDeleted);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error(t.failedToDelete);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setIsCancelling(true);
    const success = await cancelAppointment(appointmentToCancel.id, true, language);
    if (success) {
      toast.success(t.appointmentCancelled);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentToCancel.id ? { ...a, status: "cancelled" } : a))
      );
    } else {
      toast.error(t.failedToCancel);
    }
    setIsCancelling(false);
    setCancelDialogOpen(false);
    setAppointmentToCancel(null);
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
    setRescheduleDialogOpen(true);
  };

  const handleConfirmReschedule = async (newDate: Date, newTime: string) => {
    if (!appointmentToReschedule) return;
    const updated = await rescheduleAppointment(appointmentToReschedule.id, newDate, newTime, true, language);
    if (updated) {
      toast.success(t.appointmentRescheduled);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === updated.id
            ? { ...a, appointment_date: newDate.toISOString().split("T")[0], appointment_time: newTime, status: "rescheduled" }
            : a
        )
      );
    } else {
      toast.error(t.failedToReschedule);
    }
    setRescheduleDialogOpen(false);
    setAppointmentToReschedule(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getServiceLabel = (serviceId: string) => {
    const serviceData = t.services[serviceId as keyof typeof t.services];
    return serviceData?.title || serviceId;
  };

  const getLocationLabel = (locationId: string) => {
    const locationData = t.locationsList[locationId as keyof typeof t.locationsList];
    return locationData?.name || locationId;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default">{t.confirmed}</Badge>;
      case "rescheduled":
        return <Badge variant="secondary">{t.rescheduled}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">{t.cancelled}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold tracking-tight">{t.teslaService}</span>
          <Badge variant="secondary" className="ml-2">
            <Shield className="h-3 w-3 mr-1" />
            {t.admin}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {pushNotifications.isSupported && isAdmin && (
            <Button
              variant={isPushEnabled ? "default" : "outline"}
              size="sm"
              onClick={handleTogglePush}
              disabled={isTogglingPush || !pushNotifications.token}
              title={language === "hu" 
                ? (isPushEnabled ? "Push értesítések kikapcsolása" : "Push értesítések bekapcsolása")
                : (isPushEnabled ? "Disable push notifications" : "Enable push notifications")
              }
            >
              {isTogglingPush ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPushEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
          )}
          <LanguageSwitcher />
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToHome}
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {t.signOut}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                {t.appointmentsDashboard}
              </CardTitle>
              <CardDescription>{t.viewManageAppointments}</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchAppointments} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              {t.refresh}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t.noAppointments}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.customer}</TableHead>
                      <TableHead>{t.serviceLabel}</TableHead>
                      <TableHead>{t.vehicleLabel}</TableHead>
                      <TableHead>
                        {t.dateLabel} & {t.timeLabel}
                      </TableHead>
                      <TableHead>{t.locationLabel}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      {isAdmin && <TableHead className="w-[150px]">{t.actions}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{appointment.name}</p>
                            <p className="text-sm text-muted-foreground">{appointment.email}</p>
                            {appointment.phone && <p className="text-sm text-muted-foreground">{appointment.phone}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getServiceLabel(appointment.service)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            {vehicleLabels[appointment.vehicle] || appointment.vehicle}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(appointment.appointment_date), language === "hu" ? "yyyy. MMM d." : "MMM d, yyyy", {
                                locale: dateLocale,
                              })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {appointment.appointment_time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {getLocationLabel(appointment.location)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              {appointment.status !== "cancelled" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRescheduleClick(appointment)}
                                    title={t.reschedule}
                                  >
                                    <CalendarClock className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCancelClick(appointment)}
                                    title={t.cancel}
                                    className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(appointment.id)}
                                disabled={deletingId === appointment.id}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title={t.appointmentDeleted}
                              >
                                {deletingId === appointment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.cancelAppointment}</DialogTitle>
            <DialogDescription>{t.cancelConfirmation}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t.back}
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel} disabled={isCancelling}>
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t.confirmCancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      {appointmentToReschedule && (
        <AdminRescheduleDialog
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          currentDate={new Date(appointmentToReschedule.appointment_date)}
          currentTime={appointmentToReschedule.appointment_time}
          onConfirm={handleConfirmReschedule}
        />
      )}
    </div>
  );
};

export default Admin;
