import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, MapPin, Navigation, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { getBookedAppointmentsForDate, getServiceDurationMinutes, getServiceSlotCount, getServiceBay } from "@/lib/appointments";

interface AppointmentFormProps {
  onSubmit: (data: {
    date: Date | undefined;
    time: string;
    location: string;
    name: string;
    email: string;
    phone: string;
  }) => void;
  onBack: () => void;
  isSubmitting?: boolean;
  selectedService?: string;
}

interface BookedAppointment {
  time: string;
  service: string;
}

const locations = [{ id: "nagytarcsa" }];

const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 15; hour++) {
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
};

const AppointmentForm = ({ onSubmit, onBack, isSubmitting = false, selectedService }: AppointmentFormProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const currentServiceDuration = useMemo(() => {
    if (!selectedService) return 30;
    const serviceData = t.services[selectedService as keyof typeof t.services];
    if (!serviceData || !('duration' in serviceData)) return 30;
    return getServiceDurationMinutes(serviceData.duration as string);
  }, [selectedService, t.services]);

  const blockedSlots = useMemo(() => {
    const blocked = new Set<string>();
    const currentBay = selectedService ? getServiceBay(selectedService) : 2;

    // Only consider appointments on the same bay
    const sameBayAppointments = bookedAppointments.filter(
      ({ service }) => getServiceBay(service) === currentBay
    );

    sameBayAppointments.forEach(({ time: bookedTime, service }) => {
      const serviceData = t.services[service as keyof typeof t.services];
      let durationMinutes = 30;
      if (serviceData && 'duration' in serviceData) {
        durationMinutes = getServiceDurationMinutes(serviceData.duration as string);
      }
      const slotCount = getServiceSlotCount(durationMinutes);
      const startMinutes = timeToMinutes(bookedTime);
      for (let i = 0; i < slotCount; i++) {
        const blockedMinutes = startMinutes + (i * 30);
        blocked.add(minutesToTime(blockedMinutes));
      }
    });

    const currentSlotCount = getServiceSlotCount(currentServiceDuration);
    timeSlots.forEach(slot => {
      const slotMinutes = timeToMinutes(slot);
      for (let i = 0; i < currentSlotCount; i++) {
        const checkMinutes = slotMinutes + (i * 30);
        if (checkMinutes >= 17 * 60) { blocked.add(slot); break; }
        sameBayAppointments.forEach(({ time: bookedTime }) => {
          if (bookedTime === minutesToTime(checkMinutes)) blocked.add(slot);
        });
      }
    });
    return blocked;
  }, [bookedAppointments, t.services, currentServiceDuration, selectedService]);

  // Auto-fill from user
  useEffect(() => {
    if (!user) return;
    if (user.email) setEmail(user.email);
    if (user.name) setName(user.name);
    if (user.phone) setPhone(user.phone);
  }, [user]);

  useEffect(() => {
    const loadBookedAppointments = async () => {
      if (!date || !location) { setBookedAppointments([]); return; }
      setIsLoadingSlots(true);
      try {
        const appointments = await getBookedAppointmentsForDate(date, location);
        setBookedAppointments(appointments);
        if (blockedSlots.has(time)) setTime("");
      } catch (error) {
        console.error("Error loading booked appointments:", error);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    loadBookedAppointments();
  }, [date, location]);

  const dateLocale = language === "hu" ? hu : enUS;
  const isValid = date && time && location && name && email && phone;

  const handleSubmit = () => {
    if (isValid) onSubmit({ date, time, location, name, email, phone });
  };

  return (
    <div className="animate-fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t.back}
      </Button>

      <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2">{t.scheduleAppointment}</h2>
      <p className="text-muted-foreground font-light mb-8">{t.chooseDateTimeLocation}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">{t.selectDate}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-12 border-border", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: dateLocale }) : t.pickDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} locale={dateLocale} disabled={(d) => d < new Date() || d.getDay() === 6 || d.getDay() === 0} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">
              {t.selectTime}
              {isLoadingSlots && <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const isBooked = blockedSlots.has(slot);
                return (
                  <button key={slot} onClick={() => !isBooked && setTime(slot)} disabled={isBooked} className={cn("tesla-card aspect-square flex items-center justify-center text-sm transition-all", time === slot && "border-foreground bg-foreground text-background", isBooked ? "opacity-40 cursor-not-allowed line-through text-muted-foreground" : "hover:border-foreground/30")} title={isBooked ? (language === "hu" ? "Foglalt" : "Booked") : undefined}>
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">{t.selectLocation}</Label>
            <div className="space-y-2">
              {locations.map((loc) => {
                const locationData = t.locationsList[loc.id as keyof typeof t.locationsList];
                const mapsUrl = "https://www.google.com/maps/search/?api=1&query=Ganz+%C3%81brah%C3%A1m+utca+3+Nagytarcsa+Hungary";
                return (
                  <div key={loc.id} className="flex gap-2">
                    <button onClick={() => setLocation(loc.id)} className={cn("tesla-card p-4 flex-1 text-left transition-all", location === loc.id ? "border-foreground bg-foreground text-background" : "hover:border-foreground/30")}>
                      <div className="flex items-start gap-3">
                        <MapPin className={cn("w-5 h-5 mt-0.5", location === loc.id ? "text-background" : "text-foreground")} />
                        <div>
                          <div className="font-medium">{locationData.name}</div>
                          <div className={cn("text-sm", location === loc.id ? "text-background/70" : "text-muted-foreground")}>{locationData.address}</div>
                        </div>
                      </div>
                    </button>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="tesla-card p-4 flex items-center justify-center hover:border-foreground/30 transition-all" title={language === "hu" ? "Navigáció" : "Navigate"}>
                      <Navigation className="w-5 h-5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="tesla-card p-6 space-y-4">
            <h3 className="text-lg font-medium mb-4">{t.contactInformation}</h3>
            <div className="space-y-2">
              <Label htmlFor="name">{t.fullName}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={language === "hu" ? "Kovács János" : "John Doe"} className="bg-muted/30 border-border h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={language === "hu" ? "kovacs.janos@example.com" : "john@example.com"} className="bg-muted/30 border-border h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={language === "hu" ? "+36 30 123 4567" : "(555) 123-4567"} className="bg-muted/30 border-border h-12" />
            </div>
          </div>
          <Button variant="tesla" size="xl" className="w-full" disabled={!isValid || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? t.booking : t.confirmAppointment}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;
