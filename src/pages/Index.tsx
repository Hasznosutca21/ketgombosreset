import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Calendar, Car, Wrench, ChevronRight, Menu, LogOut, User, Info, Shield } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/tesland-hero.jpg";
import teslandLogo from "@/assets/tesland-logo.png";
import ServiceSelector from "@/components/ServiceSelector";
import VehicleSelector from "@/components/VehicleSelector";
import AppointmentForm from "@/components/AppointmentForm";
import ConfirmationView from "@/components/ConfirmationView";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { saveAppointment, SavedAppointment } from "@/lib/appointments";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";

type Step = "service" | "vehicle" | "appointment" | "confirmation";

const Index = () => {
  const { t, language } = useLanguage();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("vehicle");
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
    { id: "vehicle", label: t.vehicle, icon: Car },
    { id: "service", label: t.service, icon: Wrench },
    { id: "appointment", label: t.schedule, icon: Calendar },
    { id: "confirmation", label: t.confirm, icon: ChevronRight },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleVehicleSelect = (vehicle: string) => {
    setSelectedVehicle(vehicle);
    setCurrentStep("service");
  };

  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
    setCurrentStep("appointment");
  };

  const handleAppointmentSubmit = async (data: typeof appointmentData) => {
    if (!data || !data.date || !selectedService || !selectedVehicle) return;

    setIsSubmitting(true);

    try {
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

      if (saved.error === 'slot_taken') {
        toast.error(t.slotAlreadyTaken || "Ez az időpont már foglalt. Kérjük válasszon másik időpontot.");
        return;
      }

      if (saved.appointment) {
        setSavedAppointment(saved.appointment);
        setAppointmentData(data);

        try {
          const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
            body: {
              appointmentId: saved.appointment.id,
              customerName: data.name,
              customerEmail: data.email,
              service: selectedService,
              vehicle: selectedVehicle,
              appointmentDate: data.date.toISOString(),
              appointmentTime: data.time,
              location: data.location,
              language: language,
            },
          });

          if (!emailError) {
            console.log("Confirmation email sent successfully");
          } else {
            console.error("Failed to send confirmation email:", emailError);
          }
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
        }

        if (isSupported && token) {
          const platform = Capacitor.getPlatform() as "ios" | "android";
          await registerTokenForAppointment(saved.appointment.id, platform);
          toast.success(t.pushNotificationsEnabled);
        }

        setCurrentStep("confirmation");
        toast.success(t.appointmentBookedSuccess);
      } else {
        toast.error(t.failedToBook);
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error(t.failedToBook);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep("vehicle");
    setSelectedService(null);
    setSelectedVehicle(null);
    setAppointmentData(null);
    setSavedAppointment(null);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Dark */}
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden bg-black">
        <img 
          src={heroImage} 
          alt="Tesla Service Center" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black pointer-events-none" />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 bg-black/60 backdrop-blur-md">
          <button 
            onClick={handleStartOver}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img src={teslandLogo} alt="TESLAND" className="h-10 md:h-12 w-auto brightness-0 invert" />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-white/80 hover:text-white hover:bg-white/10">
              <a href="/manage">{t.manageMyAppointment}</a>
            </Button>
            <LanguageSwitcher variant="glass" />
            {authLoading ? null : user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <a href="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <a href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm truncate max-w-[150px]">{user.email}</span>
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <a
                href="/auth"
                className="px-5 py-2 bg-white text-black text-sm font-medium rounded hover:bg-white/90 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.assign("/auth");
                }}
              >
                {t.login}
              </a>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher variant="glass" />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-white border-border">
                <nav className="flex flex-col gap-4 mt-8">
                  {user && isAdmin && (
                    <Button
                      variant="ghost"
                      className="justify-start"
                      asChild
                    >
                      <a href="/admin" className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </a>
                    </Button>
                  )}
                  {user && (
                    <Button
                      variant="ghost"
                      className="justify-start"
                      asChild
                    >
                      <a href="/profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {t.myProfile || "My Profile"}
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                  >
                    <a href="/manage">{t.manageMyAppointment}</a>
                  </Button>
                  {authLoading ? null : user ? (
                    <Button
                      variant="ghost"
                      className="justify-start text-muted-foreground"
                      onClick={() => signOut()}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t.signOut}
                    </Button>
                  ) : (
                    <a
                      href="/auth"
                      className={buttonVariants({
                        variant: "tesla",
                        size: "default",
                        className: "w-full justify-center",
                      })}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.assign("/auth");
                      }}
                    >
                      {t.login}
                    </a>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full pt-16 px-6 text-center text-white">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extralight tracking-wide mb-4 animate-fade-in">
            {t.scheduleYourService}
          </h1>
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 text-sm md:text-base font-light text-white/80 hover:text-white transition-colors cursor-pointer">
                {t.expertCare}
                <Info className="w-4 h-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl">{t.expertCare}</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground leading-relaxed">{t.heroDescription}</p>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress Steps - Transition area */}
      <div className="bg-background">
        <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
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
                          isActive && "bg-foreground text-background",
                          isCompleted && "bg-foreground/10 text-foreground",
                          !isActive && !isCompleted && "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5 md:w-5 md:h-5" />
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
                          "hidden md:block w-16 lg:w-24 h-px mx-4 transition-colors",
                          index < currentStepIndex ? "bg-foreground" : "bg-border"
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
          {currentStep === "vehicle" && (
            <VehicleSelector onSelect={handleVehicleSelect} selected={selectedVehicle} />
          )}
          {currentStep === "service" && (
            <ServiceSelector onSelect={handleServiceSelect} selected={selectedService} selectedVehicle={selectedVehicle} onBack={() => setCurrentStep("vehicle")} />
          )}
          {currentStep === "appointment" && (
            <AppointmentForm onSubmit={handleAppointmentSubmit} onBack={() => setCurrentStep("service")} isSubmitting={isSubmitting} selectedService={selectedService || undefined} />
          )}
          {currentStep === "confirmation" && (
            <ConfirmationView
              service={selectedService!}
              vehicle={selectedVehicle!}
              appointment={appointmentData!}
              appointmentId={savedAppointment?.id}
              onStartOver={handleStartOver}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src={teslandLogo} alt="TESLAND" className="h-8 w-auto opacity-60" />
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <Link to="/about" className="hover:text-foreground transition-colors">
                {language === "hu" ? "Rólunk" : "About"}
              </Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">
                {t.contact}
              </Link>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Ganz+%C3%81brah%C3%A1m+utca+3+Nagytarcsa+Hungary" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {t.locations}
              </a>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                {language === "hu" ? "ÁSZF" : "Terms"}
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                {language === "hu" ? "Adatkezelés" : "Privacy"}
              </Link>
            </div>
            <div className="text-xs">
              © {new Date().getFullYear()} TESLAND. {language === "hu" ? "Minden jog fenntartva." : "All rights reserved."}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
