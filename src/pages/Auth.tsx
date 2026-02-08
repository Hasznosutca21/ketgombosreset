import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Zap, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { createAuthSchemas, LoginFormData, SignupFormData, ForgotFormData } from "@/lib/validation";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import PasswordInput from "@/components/PasswordInput";
import AuthSkeleton from "@/components/AuthSkeleton";

type AuthMode = "login" | "signup" | "forgot" | "resend";

const Auth = () => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();

  const schemas = createAuthSchemas(t);
  
  const getSchema = () => {
    switch (mode) {
      case "login": return schemas.loginSchema;
      case "signup": return schemas.signupSchema;
      case "forgot": return schemas.forgotSchema;
      case "resend": return schemas.forgotSchema; // Same schema - just email
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
    watch,
  } = useForm<LoginFormData | SignupFormData | ForgotFormData>({
    resolver: zodResolver(getSchema()),
    mode: "onBlur",
  });

  const passwordValue = watch("password" as any) || "";

  // Reset form when mode changes
  useEffect(() => {
    reset();
    clearErrors();
  }, [mode, reset, clearErrors]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Redirect authenticated users to home page
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (data: LoginFormData | SignupFormData | ForgotFormData) => {
    setIsLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t.resetEmailSent);
          setMode("login");
        }
      } else if (mode === "resend") {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: data.email,
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t.verificationEmailResent);
          setResendCooldown(60); // Start 60 second cooldown
        }
      } else if (mode === "login") {
        const loginData = data as LoginFormData;
        const { error } = await signIn(loginData.email, loginData.password, rememberMe);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t.welcomeBack);
          navigate("/");
        }
      } else {
        const signupData = data as SignupFormData;
        const { error } = await signUp(signupData.email, signupData.password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t.checkEmailVerify);
          setMode("resend"); // Switch to resend mode after signup
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (err) {
      toast.error("Failed to sign in with Google");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (err) {
      toast.error("Failed to sign in with Apple");
    } finally {
      setIsAppleLoading(false);
    }
  };

  // Show loading skeleton while checking auth state
  if (authLoading) {
    return <AuthSkeleton />;
  }

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
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToHome}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === "forgot" ? t.resetPassword 
                : mode === "resend" ? t.resendVerification
                : mode === "login" ? t.signIn 
                : t.createAccount}
            </CardTitle>
            <CardDescription>
              {mode === "forgot" ? t.resetPasswordDesc 
                : mode === "resend" ? t.resendVerificationDesc
                : mode === "login" ? t.signInToYourAccount 
                : t.createAccountToStart}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Social Login Buttons - only show for login/signup */}
            {(mode === "login" || mode === "signup") && (
              <>
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-3"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading || isAppleLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    {t.continueWithGoogle || "Continue with Google"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-3"
                    onClick={handleAppleLogin}
                    disabled={isGoogleLoading || isAppleLoading}
                  >
                    {isAppleLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                    )}
                    {t.continueWithApple || "Continue with Apple"}
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {t.orContinueWith || "or continue with email"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={t.email}
                    {...register("email")}
                    className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              
              {/* Password field - hide for forgot/resend modes */}
              {(mode === "login" || mode === "signup") && (
                <div className="space-y-1">
                  <PasswordInput
                    placeholder={t.password}
                    {...register("password")}
                    error={"password" in errors && !!errors.password}
                  />
                  {"password" in errors && errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                  {mode === "signup" && (
                    <PasswordStrengthIndicator password={passwordValue} />
                  )}
                </div>
              )}
              
              {/* Remember me and forgot password - login mode only */}
              {mode === "login" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                      {t.rememberMe}
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm text-primary hover:underline"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              )}
              
              <Button 
                type="submit" 
                variant="tesla" 
                className="w-full" 
                disabled={isLoading || (mode === "resend" && resendCooldown > 0)}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "forgot" 
                  ? (isLoading ? t.sending : t.sendResetLink)
                  : mode === "resend"
                    ? (isLoading ? t.resending : resendCooldown > 0 ? `${t.resendEmail} (${resendCooldown}s)` : t.resendEmail)
                    : mode === "login" 
                      ? t.signIn 
                      : t.createAccount}
              </Button>
            </form>

            <div className="text-center text-sm space-y-2">
              {(mode === "forgot" || mode === "resend") ? (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:underline font-medium"
                >
                  {t.backToLogin}
                </button>
              ) : (
                <>
                  <div>
                    <span className="text-muted-foreground">
                      {mode === "login" ? t.dontHaveAccount + " " : t.alreadyHaveAccount + " "}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMode(mode === "login" ? "signup" : "login")}
                      className="text-primary hover:underline font-medium"
                    >
                      {mode === "login" ? t.signUp : t.signIn}
                    </button>
                  </div>
                  {mode === "login" && (
                    <div>
                      <span className="text-muted-foreground">{t.didntReceiveEmail} </span>
                      <button
                        type="button"
                        onClick={() => setMode("resend")}
                        className="text-primary hover:underline font-medium"
                      >
                        {t.resendIt}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
