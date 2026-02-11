import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Camera, User, Mail, Phone, MapPin, Settings, Trash2, History } from "lucide-react";
import teslandLogo from "@/assets/tesland-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { toast } from "sonner";

const Profile = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-border">
        <div className="flex items-center gap-2">
          <img src={teslandLogo} alt="TESLAND" className="h-12 md:h-16 w-auto mix-blend-multiply dark:mix-blend-screen" />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToHome}
          </Button>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">{t.profile || "Profil"}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.displayName || "Név"}</Label>
                  <Input value={user?.name || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>{t.email}</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>{t.phone}</Label>
                  <Input value={user?.phone || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>{t.address || "Cím"}</Label>
                  <Input value={user?.address || ""} disabled className="bg-muted" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {"A profil adatok jelenleg nem szerkeszthetők itt. Az API fejlesztés folyamatban."}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
