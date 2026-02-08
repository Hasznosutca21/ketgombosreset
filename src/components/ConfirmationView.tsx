import { CheckCircle, Calendar, Car, MapPin, Clock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { translations } from "@/lib/translations";

interface ConfirmationViewProps {
  service: string;
  vehicle: string;
  appointment: {
    date: Date | undefined;
    time: string;
    location: string;
    name: string;
    email: string;
    phone: string;
  };
  onStartOver: () => void;
}

const vehicleNames: Record<string, string> = {
  "model-s": "Model S",
  "model-3": "Model 3",
  "model-x": "Model X",
  "model-y": "Model Y",
  cybertruck: "Cybertruck",
  roadster: "Roadster",
};

const ConfirmationView = ({ service, vehicle, appointment, onStartOver }: ConfirmationViewProps) => {
  const location = translations.locationsList[appointment.location as keyof typeof translations.locationsList];
  const serviceData = translations.services[service as keyof typeof translations.services];

  return (
    <div className="animate-fade-in text-center">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold mb-2">{translations.appointmentConfirmed}</h2>
      <p className="text-muted-foreground mb-8">
        {translations.confirmationEmailSent} {appointment.email}
      </p>

      <div className="glass-card p-6 md:p-8 max-w-2xl mx-auto text-left mb-8">
        <h3 className="text-lg font-semibold mb-6 text-center">{translations.appointmentDetails}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{translations.serviceLabel}</div>
              <div className="font-medium">{serviceData?.title}</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{translations.vehicleLabel}</div>
              <div className="font-medium">Tesla {vehicleNames[vehicle]}</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{translations.dateLabel}</div>
              <div className="font-medium">
                {appointment.date ? format(appointment.date, "yyyy. MMMM d., EEEE", { locale: hu }) : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{translations.timeLabel}</div>
              <div className="font-medium">{appointment.time}</div>
            </div>
          </div>

          <div className="flex items-start gap-4 md:col-span-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{translations.locationLabel}</div>
              <div className="font-medium">{location?.name}</div>
              <div className="text-sm text-muted-foreground">{location?.address}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="teslaOutline" size="lg" onClick={onStartOver}>
          {translations.scheduleAnother}
        </Button>
        <Button variant="glass" size="lg">
          {translations.addToCalendar}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationView;
