import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, Mail, ArrowLeft, Loader2, Phone, MapPin, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { toast } from "sonner";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import PasswordInput from "@/components/PasswordInput";
import AuthSkeleton from "@/components/AuthSkeleton";
import optimusImg from "@/assets/tesland-optimus.png";

type AuthMode = "login" | "signup";

const loginSchema = z.object({
  email: z.string().email("Érvénytelen email cím").max(255),
  password: z.string().min(1, "A jelszó megadása kötelező"),
});

const signupSchema = z.object({
  email: z.string().email("Érvénytelen email cím").max(255),
  password: z.string().min(6, "A jelszónak legalább 6 karakter hosszúnak kell lennie"),
  name: z.string().min(1, "A név megadása kötelező").max(255),
  phone: z.string().min(1, "A telefonszám megadása kötelező").max(15),
  address: z.string().min(1, "A cím megadása kötelező").max(500),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const Auth = () => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();

  const schema = mode === "login" ? loginSchema : signupSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
    watch,
  } = useForm<LoginFormData | SignupFormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const passwordValue = watch("password") || "";

  useEffect(() => {
    reset();
    clearErrors();
  }, [mode, reset, clearErrors]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (data: LoginFormData | SignupFormData) => {
    setIsLoading(true);
    try {
      if (mode === "login") {
        const loginData = data as LoginFormData;
        const { error } = await signIn(loginData.email, loginData.password);
        if (error) {
          toast.error(error);
        } else {
          toast.success(t.welcomeBack);
          navigate("/");
        }
      } else {
        const signupData = data as SignupFormData;
        const { error } = await signUp({
          email: signupData.email,
          password: signupData.password,
          name: signupData.name,
          phone: signupData.phone,
          address: signupData.address,
        });
        if (error) {
          toast.error(error);
        } else {
          toast.success("Sikeres regisztráció!");
          navigate("/");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <AuthSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="hidden lg:flex items-center justify-center mr-8">
          <img src={optimusImg} alt="Tesland Optimus" className="max-h-[500px] object-contain" />
        </div>
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === "login" ? t.signIn : t.createAccount}
            </CardTitle>
            <CardDescription>
              {mode === "login" ? t.signInToYourAccount : t.createAccountToStart}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name - signup only */}
              {mode === "signup" && (
                <div className="space-y-1">
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Teljes név"
                      {...register("name" as any)}
                      className={`pl-10 ${"name" in errors && errors.name ? "border-destructive" : ""}`}
                    />
                  </div>
                  {"name" in errors && errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
              )}

              {/* Email */}
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

              {/* Phone - signup only */}
              {mode === "signup" && (
                <div className="space-y-1">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+36301234567"
                      {...register("phone" as any)}
                      className={`pl-10 ${"phone" in errors && errors.phone ? "border-destructive" : ""}`}
                    />
                  </div>
                  {"phone" in errors && errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              )}

              {/* Address - signup only */}
              {mode === "signup" && (
                <div className="space-y-1">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="1117 Budapest, Példa u. 12."
                      {...register("address" as any)}
                      className={`pl-10 ${"address" in errors && errors.address ? "border-destructive" : ""}`}
                    />
                  </div>
                  {"address" in errors && errors.address && (
                    <p className="text-sm text-destructive">{errors.address.message}</p>
                  )}
                </div>
              )}

              {/* Password */}
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

              <Button
                type="submit"
                variant="tesla"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? t.signIn : t.createAccount}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {mode === "login" ? (t.dontHaveAccount + " ") : (t.alreadyHaveAccount + " ")}
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary hover:underline font-medium"
              >
                {mode === "login" ? t.signUp : t.signIn}
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
