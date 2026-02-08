import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, MapPin, Navigation, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { getBookedAppointmentsForDate, getServiceDurationMinutes, getServiceSlotCount } from "@/lib/appointments";

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

// Generate 30-minute time slots from 9:00 to 15:30
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 15; hour++) {
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Convert time string to minutes from midnight
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Convert minutes from midnight to time string
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

  // Get duration of current selected service
  const currentServiceDuration = useMemo(() => {
    if (!selectedService) return 30;
    const serviceData = t.services[selectedService as keyof typeof t.services];
    if (!serviceData || !('duration' in serviceData)) return 30;
    return getServiceDurationMinutes(serviceData.duration as string);
  }, [selectedService, t.services]);

  // Calculate blocked slots based on booked appointments and their durations
  const blockedSlots = useMemo(() => {
    const blocked = new Set<string>();
    
    bookedAppointments.forEach(({ time: bookedTime, service }) => {
      // Get duration of the booked service
      const serviceData = t.services[service as keyof typeof t.services];
      let durationMinutes = 30;
      if (serviceData && 'duration' in serviceData) {
        durationMinutes = getServiceDurationMinutes(serviceData.duration as string);
      }
      
      const slotCount = getServiceSlotCount(durationMinutes);
      const startMinutes = timeToMinutes(bookedTime);
      
      // Block all slots that overlap with this appointment
      for (let i = 0; i < slotCount; i++) {
        const blockedMinutes = startMinutes + (i * 30);
        const blockedTimeStr = minutesToTime(blockedMinutes);
        blocked.add(blockedTimeStr);
      }
    });
    
    // Also check if selecting THIS slot would overlap with an existing appointment
    // We need to block slots where our service would run into an existing booking
    const currentSlotCount = getServiceSlotCount(currentServiceDuration);
    
    timeSlots.forEach(slot => {
      const slotMinutes = timeToMinutes(slot);
      // Check if any of the slots our service would occupy are already blocked
      for (let i = 0; i < currentSlotCount; i++) {
        const checkMinutes = slotMinutes + (i * 30);
        const checkTimeStr = minutesToTime(checkMinutes);
        
        // Check if this would go past closing time (17:00)
        if (checkMinutes >= 17 * 60) {
          blocked.add(slot);
          break;
        }
        
        // Check if any booked appointment starts during our service time
        bookedAppointments.forEach(({ time: bookedTime }) => {
          if (bookedTime === checkTimeStr) {
            blocked.add(slot);
          }
        });
      }
    });
    
    return blocked;
  }, [bookedAppointments, t.services, currentServiceDuration]);

  // Auto-fill contact information from user profile
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      // Set email from auth user
      if (user.email) {
        setEmail(user.email);
      }

      // Fetch profile for name and phone
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, phone")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          if (profile.display_name) {
            setName(profile.display_name);
          }
          if (profile.phone) {
            setPhone(profile.phone);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfileData();
  }, [user]);

  // Fetch booked appointments when date or location changes
  useEffect(() => {
    const loadBookedAppointments = async () => {
      if (!date || !location) {
        setBookedAppointments([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const appointments = await getBookedAppointmentsForDate(date, location);
        setBookedAppointments(appointments);
        // Clear selected time if it's now blocked
        if (blockedSlots.has(time)) {
          setTime("");
        }
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
    if (isValid) {
      onSubmit({ date, time, location, name, email, phone });
    }
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
        {/* Left Column - Date & Time */}
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">{t.selectDate}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal h-12 border-border", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: dateLocale }) : t.pickDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={dateLocale}
                  disabled={(date) => {
                    // Disable past dates
                    if (date < new Date()) return true;
                    // Disable Saturdays (day 6) - closed on Saturdays
                    if (date.getDay() === 6) return true;
                    // Disable Sundays (day 0)
                    if (date.getDay() === 0) return true;
                    return false;
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
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
                  <button
                    key={slot}
                    onClick={() => !isBooked && setTime(slot)}
                    disabled={isBooked}
                    className={cn(
                      "tesla-card aspect-square flex items-center justify-center text-sm transition-all",
                      time === slot && "border-foreground bg-foreground text-background",
                      isBooked 
                        ? "opacity-40 cursor-not-allowed line-through text-muted-foreground" 
                        : "hover:border-foreground/30"
                    )}
                    title={isBooked ? (language === "hu" ? "Foglalt" : "Booked") : undefined}
                  >
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
                    <button
                      onClick={() => setLocation(loc.id)}
                      className={cn(
                        "tesla-card p-4 flex-1 text-left transition-all",
                        location === loc.id 
                          ? "border-foreground bg-foreground text-background" 
                          : "hover:border-foreground/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className={cn(
                          "w-5 h-5 mt-0.5",
                          location === loc.id ? "text-background" : "text-foreground"
                        )} />
                        <div>
                          <div className="font-medium">{locationData.name}</div>
                          <div className={cn(
                            "text-sm",
                            location === loc.id ? "text-background/70" : "text-muted-foreground"
                          )}>
                            {locationData.address}
                          </div>
                        </div>
                      </div>
                    </button>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tesla-card p-4 flex items-center justify-center hover:border-foreground/30 transition-all"
                      title={language === "hu" ? "Navigáció" : "Navigate"}
                    >
                      <Navigation className="w-5 h-5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Contact Info */}
        <div className="space-y-6">
          <div className="tesla-card p-6 space-y-4">
            <h3 className="text-lg font-medium mb-4">{t.contactInformation}</h3>

            <div className="space-y-2">
              <Label htmlFor="name">{t.fullName}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === "hu" ? "Kovács János" : "John Doe"}
                className="bg-muted/30 border-border h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === "hu" ? "kovacs.janos@example.com" : "john@example.com"}
                className="bg-muted/30 border-border h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={language === "hu" ? "+36 30 123 4567" : "(555) 123-4567"}
                className="bg-muted/30 border-border h-12"
              />
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
