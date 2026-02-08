import { useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
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

const locations = [{ id: "sf" }, { id: "la" }, { id: "ny" }];

const timeSlots = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const AppointmentForm = ({ onSubmit, onBack, isSubmitting = false }: AppointmentFormProps) => {
  const { t, language } = useLanguage();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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
            <Label className="text-base font-semibold mb-3 block">{t.selectTime}</Label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setTime(slot)}
                  className={cn(
                    "glass-card py-2 px-3 text-sm transition-all hover:border-primary/50",
                    time === slot && "border-primary bg-primary/10"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">{t.selectLocation}</Label>
            <div className="space-y-2">
              {locations.map((loc) => {
                const locationData = t.locationsList[loc.id as keyof typeof t.locationsList];
                return (
                  <button
                    key={loc.id}
                    onClick={() => setLocation(loc.id)}
                    className={cn(
                      "glass-card p-4 w-full text-left transition-all hover:border-primary/50",
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
