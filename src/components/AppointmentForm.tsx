import { useState, useEffect } from "react";
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
import { getBookedTimeSlotsForDate } from "@/lib/appointments";

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
}

const locations = [{ id: "nagytarcsa" }];

const timeSlots = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const AppointmentForm = ({ onSubmit, onBack, isSubmitting = false }: AppointmentFormProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

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

  // Fetch booked slots when date or location changes
  useEffect(() => {
    const loadBookedSlots = async () => {
      if (!date || !location) {
        setBookedSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const slots = await getBookedTimeSlotsForDate(date, location);
        setBookedSlots(slots);
        // Clear selected time if it's now booked
        if (slots.includes(time)) {
          setTime("");
        }
      } catch (error) {
        console.error("Error loading booked slots:", error);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadBookedSlots();
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

      <h2 className="text-2xl md:text-3xl font-bold mb-2">{t.scheduleAppointment}</h2>
      <p className="text-muted-foreground mb-8">{t.chooseDateTimeLocation}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Date & Time */}
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">{t.selectDate}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="glass"
                  className={cn("w-full justify-start text-left font-normal h-12", !date && "text-muted-foreground")}
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
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">
              {t.selectTime}
              {isLoadingSlots && <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => !isBooked && setTime(slot)}
                    disabled={isBooked}
                    className={cn(
                      "glass-card py-2 px-3 text-sm transition-all",
                      time === slot && "border-primary bg-primary/10",
                      isBooked 
                        ? "opacity-40 cursor-not-allowed line-through text-muted-foreground" 
                        : "hover:border-primary/50"
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
            <Label className="text-base font-semibold mb-3 block">{t.selectLocation}</Label>
            <div className="space-y-2">
              {locations.map((loc) => {
                const locationData = t.locationsList[loc.id as keyof typeof t.locationsList];
                const mapsUrl = "https://www.google.com/maps/search/?api=1&query=Ganz+%C3%81brah%C3%A1m+utca+3+Nagytarcsa+Hungary";
                return (
                  <div key={loc.id} className="flex gap-2">
                    <button
                      onClick={() => setLocation(loc.id)}
                      className={cn(
                        "glass-card p-4 flex-1 text-left transition-all hover:border-primary/50",
                        location === loc.id && "border-primary bg-primary/10"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium">{locationData.name}</div>
                          <div className="text-sm text-muted-foreground">{locationData.address}</div>
                        </div>
                      </div>
                    </button>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-card p-4 flex items-center justify-center hover:border-primary/50 transition-all"
                      title={language === "hu" ? "Navigáció" : "Navigate"}
                    >
                      <Navigation className="w-5 h-5 text-primary" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Contact Info */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">{t.contactInformation}</h3>

            <div className="space-y-2">
              <Label htmlFor="name">{t.fullName}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === "hu" ? "Kovács János" : "John Doe"}
                className="bg-muted/50 border-border"
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
                className="bg-muted/50 border-border"
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
                className="bg-muted/50 border-border"
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
