import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2, LogOut, Shield } from "lucide-react";
import teslandLogo from "@/assets/tesland-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast.error("Nincs admin jogosultságod");
      navigate("/");
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-border">
        <div className="flex items-center gap-3">
          <img src={teslandLogo} alt="TESLAND" className="h-8 w-auto" />
          <span className="text-xl font-semibold tracking-tight">{t.teslaService}</span>
          <Badge variant="secondary" className="ml-2">
            <Shield className="h-3 w-3 mr-1" />
            {t.admin}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />{t.backToHome}
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />{t.signOut}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              {t.appointmentsDashboard}
            </CardTitle>
            <CardDescription>
              {language === "hu"
                ? "Az admin felület átállítása az új REST API-ra folyamatban van."
                : "Admin panel migration to the new REST API is in progress."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              {language === "hu"
                ? "A foglalások, ügyfelek és munkalapok kezelése hamarosan elérhető lesz az új API-n keresztül."
                : "Reservation, customer and worksheet management will be available via the new API soon."}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
