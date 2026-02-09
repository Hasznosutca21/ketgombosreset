import { useState, useEffect } from "react";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { Calendar, Clock, Car, MapPin, Wrench, Loader2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
  id: string;
  service: string;
  vehicle: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
  status: string;
  created_at: string;
}

interface AppointmentHistoryProps {
  userEmail: string | undefined;
}

const AppointmentHistory = ({ userEmail }: AppointmentHistoryProps) => {
  const { t, language } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userEmail) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("email", userEmail.toLowerCase().trim())
          .order("appointment_date", { ascending: false });

        if (error) throw error;

        setAppointments(data || []);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [userEmail]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { 
        variant: "secondary", 
        label: language === "hu" ? "Függőben" : "Pending" 
      },
      confirmed: { 
        variant: "default", 
        label: language === "hu" ? "Megerősítve" : "Confirmed" 
      },
      completed: { 
        variant: "outline", 
        label: language === "hu" ? "Teljesítve" : "Completed" 
      },
      cancelled: { 
        variant: "destructive", 
        label: language === "hu" ? "Lemondva" : "Cancelled" 
      },
      rescheduled: { 
        variant: "secondary", 
        label: language === "hu" ? "Átütemezve" : "Rescheduled" 
      },
    };

    const config = statusConfig[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy. MMMM d.", { locale: language === "hu" ? hu : enUS });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {language === "hu" ? "Nincs korábbi foglalás" : "No appointments yet"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {language === "hu" 
            ? "A korábbi időpontfoglalásaid itt fognak megjelenni." 
            : "Your past appointments will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {language === "hu" 
            ? `${appointments.length} foglalás` 
            : `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {appointments.map((appointment) => (
        <div 
          key={appointment.id} 
          className="p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">{appointment.service}</span>
            </div>
            {getStatusBadge(appointment.status)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(appointment.appointment_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{appointment.appointment_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span>{appointment.vehicle}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{appointment.location}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppointmentHistory;
