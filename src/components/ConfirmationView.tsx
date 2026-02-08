import { CheckCircle, Calendar, Car, MapPin, Clock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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

const serviceNames: Record<string, string> = {
  maintenance: "Annual Maintenance",
  battery: "Battery Service",
  brake: "Brake Service",
  software: "Software Update",
  body: "Body Repair",
  warranty: "Warranty Service",
};

const vehicleNames: Record<string, string> = {
  "model-s": "Model S",
  "model-3": "Model 3",
  "model-x": "Model X",
  "model-y": "Model Y",
  cybertruck: "Cybertruck",
  roadster: "Roadster",
};

const locationNames: Record<string, { name: string; address: string }> = {
  sf: { name: "San Francisco Service Center", address: "123 Tesla Blvd, SF, CA" },
  la: { name: "Los Angeles Service Center", address: "456 Electric Ave, LA, CA" },
  ny: { name: "New York Service Center", address: "789 Innovation St, NY, NY" },
};

const ConfirmationView = ({ service, vehicle, appointment, onStartOver }: ConfirmationViewProps) => {
  const location = locationNames[appointment.location];

  return (
    <div className="animate-fade-in text-center">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold mb-2">Appointment Confirmed!</h2>
      <p className="text-muted-foreground mb-8">
        A confirmation email has been sent to {appointment.email}
      </p>

      <div className="glass-card p-6 md:p-8 max-w-2xl mx-auto text-left mb-8">
        <h3 className="text-lg font-semibold mb-6 text-center">Appointment Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Service</div>
              <div className="font-medium">{serviceNames[service]}</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Vehicle</div>
              <div className="font-medium">Tesla {vehicleNames[vehicle]}</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Date</div>
              <div className="font-medium">
                {appointment.date ? format(appointment.date, "EEEE, MMMM d, yyyy") : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Time</div>
              <div className="font-medium">{appointment.time}</div>
            </div>
          </div>

          <div className="flex items-start gap-4 md:col-span-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Location</div>
              <div className="font-medium">{location?.name}</div>
              <div className="text-sm text-muted-foreground">{location?.address}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="teslaOutline" size="lg" onClick={onStartOver}>
          Schedule Another
        </Button>
        <Button variant="glass" size="lg">
          Add to Calendar
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationView;
