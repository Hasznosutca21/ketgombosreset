import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ArrowLeft, Calendar, Car, MapPin, Clock, Trash2, Loader2, RefreshCw, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
                      {isAdmin && <TableHead className="w-[80px]">{t.actions}</TableHead>}
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
                        <TableCell>
                          <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                            {appointment.status === "confirmed" ? t.confirmed : appointment.status}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(appointment.id)}
                              disabled={deletingId === appointment.id}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {deletingId === appointment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
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
    </div>
  );
};

export default Admin;
