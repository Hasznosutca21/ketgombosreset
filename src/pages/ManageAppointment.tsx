import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Calendar, Car, MapPin, Clock, Search, X, CalendarClock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import { getAppointmentById, getAppointmentsByEmail, cancelAppointment, rescheduleAppointment, SavedAppointment } from "@/lib/appointments";
import { toast } from "sonner";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import teslandLogo from "@/assets/tesland-logo.png";

const vehicleLabels: Record<string, string> = {
  "model-s": "Model S",
  "model-3": "Model 3",
  "model-x": "Model X",
  "model-y": "Model Y",
  cybertruck: "Cybertruck",
  roadster: "Roadster",
};

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
];

const ManageAppointment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === "hu" ? hu : enUS;

  const [email, setEmail] = useState("");
  const [appointments, setAppointments] = useState<SavedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<SavedAppointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<SavedAppointment | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Check for appointment ID in URL
  useEffect(() => {
    const appointmentId = searchParams.get("id");
    if (appointmentId) {
      loadAppointmentById(appointmentId);
    }
  }, [searchParams]);

  const loadAppointmentById = async (id: string) => {
    setIsLoading(true);
    const appointment = await getAppointmentById(id);
    if (appointment && appointment.status !== "cancelled") {
      setAppointments([appointment]);
      setEmail(appointment.email);
    }
    setHasSearched(true);
    setIsLoading(false);
  };

  const handleSearch = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    const results = await getAppointmentsByEmail(email);
    setAppointments(results);
    setIsLoading(false);
  };

  const handleCancelClick = (appointment: SavedAppointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setIsCancelling(true);
    const success = await cancelAppointment(appointmentToCancel.id, true, language);
    if (success) {
      toast.success(t.appointmentCancelled);
      setAppointments((prev) => prev.filter((a) => a.id !== appointmentToCancel.id));
    } else {
      toast.error(t.failedToCancel);
    }
    setIsCancelling(false);
    setCancelDialogOpen(false);
    setAppointmentToCancel(null);
  };

  const handleRescheduleClick = (appointment: SavedAppointment) => {
    setAppointmentToReschedule(appointment);
    setNewDate(appointment.date);
    setNewTime(appointment.time);
    setRescheduleDialogOpen(true);
  };

  const handleConfirmReschedule = async () => {
    if (!appointmentToReschedule || !newDate || !newTime) return;
    setIsRescheduling(true);
    const updated = await rescheduleAppointment(appointmentToReschedule.id, newDate, newTime, true, language);
    if (updated) {
      toast.success(t.appointmentRescheduled);
      setAppointments((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
    } else {
      toast.error(t.failedToReschedule);
    }
    setIsRescheduling(false);
    setRescheduleDialogOpen(false);
    setAppointmentToReschedule(null);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-border">
        <div className="flex items-center gap-2">
          <img src={teslandLogo} alt="TESLAND" className="h-12 md:h-16 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToHome}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <CalendarClock className="h-6 w-6 text-primary" />
              {t.manageAppointment}
            </CardTitle>
            <CardDescription>{t.manageAppointmentDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Email Search */}
            <div className="flex gap-2 mb-8">
              <Input
                type="email"
                placeholder={t.enterEmailToFind}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading || !email.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : hasSearched && appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t.noAppointmentsFound}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{getServiceLabel(appointment.service)}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            Tesla {vehicleLabels[appointment.vehicle] || appointment.vehicle}
                          </p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(appointment.date, language === "hu" ? "yyyy. MMM d." : "MMM d, yyyy", {
                              locale: dateLocale,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{getLocationLabel(appointment.location)}</span>
                        </div>
                      </div>

                      {appointment.status !== "cancelled" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRescheduleClick(appointment)}
                            className="flex-1"
                          >
                            <CalendarClock className="h-4 w-4 mr-2" />
                            {t.reschedule}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelClick(appointment)}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {t.cancel}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
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
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.rescheduleAppointment}</DialogTitle>
            <DialogDescription>{t.selectNewDateTime}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t.selectDate}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "PPP", { locale: dateLocale }) : t.pickDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                    initialFocus
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t.selectTime}</label>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectTime} />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              {t.back}
            </Button>
            <Button onClick={handleConfirmReschedule} disabled={isRescheduling || !newDate || !newTime}>
              {isRescheduling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t.confirmReschedule}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageAppointment;
