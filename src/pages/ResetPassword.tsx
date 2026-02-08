import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Zap, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createAuthSchemas, ResetPasswordFormData } from "@/lib/validation";

const ResetPassword = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const navigate = useNavigate();

  const schemas = createAuthSchemas(t);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schemas.resetPasswordSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    // Check if we have a valid recovery session
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
      }
    });
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t.passwordUpdated);
        navigate("/auth");
      }
    } catch (err) {
      toast.error("Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold tracking-tight">{t.teslaService}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToLogin}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t.resetPassword}</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder={t.newPassword}
                    {...register("password")}
                    className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder={t.confirmPassword}
                    {...register("confirmPassword")}
                    className={`pl-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" variant="tesla" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? t.updating : t.updatePassword}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ResetPassword;
