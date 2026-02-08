import { useState } from "react";
import { Calendar, Car, Clock, MapPin, Wrench, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/tesla-hero.jpg";
import ServiceSelector from "@/components/ServiceSelector";
import VehicleSelector from "@/components/VehicleSelector";
import AppointmentForm from "@/components/AppointmentForm";
import ConfirmationView from "@/components/ConfirmationView";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { saveAppointment, SavedAppointment } from "@/lib/appointments";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { translations } from "@/lib/translations";

type Step = "service" | "vehicle" | "appointment" | "confirmation";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [appointmentData, setAppointmentData] = useState<{
    date: Date | undefined;
    time: string;
    location: string;
    name: string;
    email: string;
    phone: string;
  } | null>(null);
  const [savedAppointment, setSavedAppointment] = useState<SavedAppointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { token, isSupported, registerTokenForAppointment } = usePushNotifications();

  const steps = [
    { id: "service", label: translations.service, icon: Wrench },
    { id: "vehicle", label: translations.vehicle, icon: Car },
    { id: "appointment", label: translations.schedule, icon: Calendar },
    { id: "confirmation", label: translations.confirm, icon: ChevronRight },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
    setCurrentStep("vehicle");
  };

  const handleVehicleSelect = (vehicle: string) => {
    setSelectedVehicle(vehicle);
    setCurrentStep("appointment");
  };

  const handleAppointmentSubmit = async (data: typeof appointmentData) => {
    if (!data || !data.date || !selectedService || !selectedVehicle) return;
    
    setIsSubmitting(true);
    
    try {
      // Save appointment to database
      const saved = await saveAppointment({
        service: selectedService,
        vehicle: selectedVehicle,
        date: data.date,
        time: data.time,
        location: data.location,
        name: data.name,
        email: data.email,
        phone: data.phone,
      });

      if (saved) {
        setSavedAppointment(saved);
        setAppointmentData(data);
        
        // Send confirmation email
        try {
          const emailResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-confirmation-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                appointmentId: saved.id,
                customerName: data.name,
                customerEmail: data.email,
                service: selectedService,
                vehicle: selectedVehicle,
                appointmentDate: data.date.toISOString(),
                appointmentTime: data.time,
                location: data.location,
              }),
            }
          );
          
          if (emailResponse.ok) {
            console.log('Confirmation email sent successfully');
          } else {
            console.error('Failed to send confirmation email');
          }
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
        
        // Register for push notifications if on native platform
        if (isSupported && token) {
          const platform = Capacitor.getPlatform() as 'ios' | 'android';
          await registerTokenForAppointment(saved.id, platform);
          toast.success(translations.pushNotificationsEnabled);
        }
        
        setCurrentStep("confirmation");
        toast.success(translations.appointmentBookedSuccess);
      } else {
        toast.error(translations.failedToBook);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(translations.failedToBook);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep("service");
    setSelectedService(null);
    setSelectedVehicle(null);
    setAppointmentData(null);
    setSavedAppointment(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <img
          src={heroImage}
          alt="Tesla Service Center"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold tracking-tight">{translations.teslaService}</span>
          </div>
          <Button variant="glass" size="sm" onClick={() => window.location.href = '/auth'}>
            {translations.adminLogin}
          </Button>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full -mt-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 animate-fade-in">
            {translations.scheduleYourService}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl animate-slide-up">
            {translations.expertCare}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300",
                        isActive && "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_hsl(352_85%_49%/0.5)]",
                        isCompleted && "bg-primary/20 text-primary",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span
                      className={cn(
                        "text-xs md:text-sm mt-2 font-medium transition-colors",
                        isActive && "text-foreground",
                        !isActive && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "hidden md:block w-16 lg:w-24 h-0.5 mx-4 transition-colors",
                        index < currentStepIndex ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {currentStep === "service" && (
          <ServiceSelector onSelect={handleServiceSelect} selected={selectedService} />
        )}
        {currentStep === "vehicle" && (
          <VehicleSelector
            onSelect={handleVehicleSelect}
            selected={selectedVehicle}
            onBack={() => setCurrentStep("service")}
          />
        )}
        {currentStep === "appointment" && (
          <AppointmentForm
            onSubmit={handleAppointmentSubmit}
            onBack={() => setCurrentStep("vehicle")}
            isSubmitting={isSubmitting}
          />
        )}
        {currentStep === "confirmation" && (
          <ConfirmationView
            service={selectedService!}
            vehicle={selectedVehicle!}
            appointment={appointmentData!}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>{translations.teslaService}</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">{translations.support}</a>
            <a href="#" className="hover:text-foreground transition-colors">{translations.locations}</a>
            <a href="#" className="hover:text-foreground transition-colors">{translations.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
