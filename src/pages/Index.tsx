import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Car, Wrench, ChevronRight, Menu, LogOut, User, Info } from "lucide-react";
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
// AI Assistant temporarily disabled for debugging
// import AppointmentAssistant from "@/components/AppointmentAssistant";

type Step = "service" | "vehicle" | "appointment" | "confirmation";

const Index = () => {
  // Header navigation uses <Link/> for reliability in preview/published environments
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading, signOut } = useAuth();
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
    { id: "service", label: t.service, icon: Wrench },
    { id: "vehicle", label: t.vehicle, icon: Car },
    { id: "appointment", label: t.schedule, icon: Calendar },
    { id: "confirmation", label: t.confirm, icon: ChevronRight },
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

        try {
          const emailResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-confirmation-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
              language: language,
            }),
          });

          if (emailResponse.ok) {
            console.log("Confirmation email sent successfully");
          } else {
            console.error("Failed to send confirmation email");
          }
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
        }

        if (isSupported && token) {
          const platform = Capacitor.getPlatform() as "ios" | "android";
          await registerTokenForAppointment(saved.id, platform);
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
        <img src={heroImage} alt="Tesla Service Center" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background pointer-events-none" />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 bg-background/30 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center gap-2">
            <img src={teslandLogo} alt="TESLAND" className="h-6 md:h-8 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/manage">{t.manageMyAppointment}</a>
            </Button>
            <LanguageSwitcher variant="glass" />
            {authLoading ? null : user ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  <a href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium truncate max-w-[150px]">{user.email}</span>
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {t.signOut}
                </Button>
              </div>
            ) : (
              <a
                href="/auth"
                className={buttonVariants({ variant: "tesla", size: "sm" })}
                onClick={(e) => {
                  // Failsafe navigation: force hard navigation if something blocks header clicks
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
                <Button variant="glass" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background border-border">
                <nav className="flex flex-col gap-4 mt-8">
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
                        className: "w-full justify-start",
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
        <div className="relative z-10 flex flex-col items-center justify-center h-full pt-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 animate-fade-in pointer-events-none">
            {t.scheduleYourService}
          </h1>
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 text-xl md:text-2xl font-semibold text-primary animate-slide-up hover:underline underline-offset-4 transition-all cursor-pointer pointer-events-auto">
                {t.expertCare}
                <Info className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl text-primary">{t.expertCare}</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground leading-relaxed">{t.heroDescription}</p>
            </DialogContent>
          </Dialog>
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
        {currentStep === "service" && <ServiceSelector onSelect={handleServiceSelect} selected={selectedService} />}
        {currentStep === "vehicle" && (
          <VehicleSelector onSelect={handleVehicleSelect} selected={selectedVehicle} onBack={() => setCurrentStep("service")} />
        )}
        {currentStep === "appointment" && (
          <AppointmentForm onSubmit={handleAppointmentSubmit} onBack={() => setCurrentStep("vehicle")} isSubmitting={isSubmitting} />
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
      {/* AI Assistant temporarily disabled */}

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={teslandLogo} alt="TESLAND" className="h-6 w-auto dark:invert" />
          </div>
          <div className="flex flex-wrap justify-center gap-6">
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
  );
};

export default Index;
