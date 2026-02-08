import { useState } from "react";
import { CheckCircle, Calendar, Car, MapPin, Clock, Wrench, CalendarClock, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  appointmentId?: string;
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

// Service prices in HUF
const SERVICE_PRICES: Record<string, number> = {
  maintenance: 25000,
  battery: 31750,
  brake: 20000,
  ac: 18000,
  heatpump: 22000,
  heating: 15000,
  software: 10000,
  autopilot: 25000,
  multimedia: 12000,
  body: 50000,
  warranty: 0,
  tires: 15000,
};

const ConfirmationView = ({ service, vehicle, appointment, appointmentId, onStartOver }: ConfirmationViewProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const dateLocale = language === "hu" ? hu : enUS;
  const location = t.locationsList[appointment.location as keyof typeof t.locationsList];
  const serviceData = t.services[service as keyof typeof t.services];
  const servicePrice = SERVICE_PRICES[service] || 0;

  const handleManageAppointment = () => {
    if (appointmentId) {
      navigate(`/manage?id=${appointmentId}`);
    } else {
      navigate("/manage");
    }
  };

  const handlePayOnline = async () => {
    if (!appointmentId) {
      toast.error(t.paymentFailed);
      return;
    }

    setIsPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          appointmentId,
          serviceId: service,
          customerEmail: appointment.email,
          customerName: appointment.name,
        },
      });

      if (error) {
        console.error("Payment error:", error);
        toast.error(t.paymentFailed);
        return;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error(t.paymentFailed);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(t.paymentFailed);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === "hu" ? "hu-HU" : "en-US").format(price) + " Ft";
  };

  return (
    <div className="animate-fade-in text-center">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold mb-2">{t.appointmentConfirmed}</h2>
      <p className="text-muted-foreground mb-8">
        {t.confirmationEmailSent} {appointment.email}
      </p>

      <div className="glass-card p-6 md:p-8 max-w-2xl mx-auto text-left mb-8">
        <h3 className="text-lg font-semibold mb-6 text-center">{t.appointmentDetails}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.serviceLabel}</div>
              <div className="font-medium">{serviceData?.title}</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.vehicleLabel}</div>
              <div className="font-medium">Tesla {vehicleNames[vehicle]}</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.dateLabel}</div>
              <div className="font-medium">
                {appointment.date
                  ? format(appointment.date, language === "hu" ? "yyyy. MMMM d., EEEE" : "EEEE, MMMM d, yyyy", {
                      locale: dateLocale,
                    })
                  : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.timeLabel}</div>
              <div className="font-medium">{appointment.time}</div>
            </div>
          </div>

          <div className="flex items-start gap-4 md:col-span-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.locationLabel}</div>
              <div className="font-medium">{location?.name}</div>
              <div className="text-sm text-muted-foreground">{location?.address}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      {servicePrice > 0 && (
        <div className="glass-card p-6 max-w-2xl mx-auto mb-8 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-sm text-muted-foreground">{t.totalToPay}</div>
                <div className="text-xl font-bold text-primary">{formatPrice(servicePrice)}</div>
              </div>
            </div>
            <Button 
              variant="tesla" 
              size="lg" 
              onClick={handlePayOnline}
              disabled={isPaymentLoading}
            >
              {isPaymentLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.paymentProcessing}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t.payNow}
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">{t.orPayOnSite}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="teslaOutline" size="lg" onClick={onStartOver}>
          {t.scheduleAnother}
        </Button>
        <Button variant="glass" size="lg" onClick={handleManageAppointment}>
          <CalendarClock className="mr-2 h-4 w-4" />
          {t.manageMyAppointment}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationView;
