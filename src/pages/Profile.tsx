import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, ArrowLeft, Loader2, Camera, User, Mail, Phone, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  preferences: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
}

const Profile = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileSchema = z.object({
    display_name: z.string().max(100, t.displayNameTooLong || "Display name must be less than 100 characters").optional().or(z.literal("")),
    phone: z.string().max(20, t.phoneTooLong || "Phone must be less than 20 characters").optional().or(z.literal("")),
    address_line1: z.string().max(255).optional().or(z.literal("")),
    address_line2: z.string().max(255).optional().or(z.literal("")),
    city: z.string().max(100).optional().or(z.literal("")),
    postal_code: z.string().max(20).optional().or(z.literal("")),
    country: z.string().max(100).optional().or(z.literal("")),
  });

  type ProfileFormData = z.infer<typeof profileSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile(data as Profile);
          reset({
            display_name: data.display_name || "",
            phone: data.phone || "",
            address_line1: data.address_line1 || "",
            address_line2: data.address_line2 || "",
            city: data.city || "",
            postal_code: data.postal_code || "",
            country: data.country || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        display_name: data.display_name || null,
        phone: data.phone || null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        country: data.country || null,
      };

      if (profile) {
        const { error } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert(profileData);

        if (error) throw error;
      }

      toast.success(t.profileUpdated || "Profile updated successfully");
      
      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (updatedProfile) {
        setProfile(updatedProfile as Profile);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(t.failedToSaveProfile || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t.invalidFileType || "Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.fileTooLarge || "Image must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const profileData = {
        user_id: user.id,
        avatar_url: publicUrl,
      };

      if (profile) {
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert(profileData);

        if (error) throw error;
      }

      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success(t.avatarUpdated || "Avatar updated successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(t.failedToUploadAvatar || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePreferenceChange = async (key: "emailNotifications" | "smsNotifications", value: boolean) => {
    if (!user) return;

    try {
      const newPreferences = {
        ...(profile?.preferences || {}),
        [key]: value,
      };

      if (profile) {
        const { error } = await supabase
          .from("profiles")
          .update({ preferences: newPreferences })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            preferences: newPreferences,
          });

        if (error) throw error;
      }

      setProfile((prev) => prev ? { ...prev, preferences: newPreferences } : null);
      toast.success(t.preferencesUpdated || "Preferences updated");
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error(t.failedToUpdatePreferences || "Failed to update preferences");
    }
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
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
      <main className="flex-1 px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardHeader className="text-center pb-2">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                    {isUploadingAvatar ? (
                      <AvatarFallback>
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>
              <CardTitle className="text-2xl">{t.profile || "Profile"}</CardTitle>
              <CardDescription>
                {user?.email}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="personal" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.personalInfo || "Personal"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.address || "Address"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.preferences || "Preferences"}</span>
                  </TabsTrigger>
                </TabsList>

                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <TabsContent value="personal" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="display_name">{t.displayName || "Display Name"}</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="display_name"
                            placeholder={t.displayNamePlaceholder || "Enter your name"}
                            {...register("display_name")}
                            className={`pl-10 ${errors.display_name ? "border-destructive" : ""}`}
                          />
                        </div>
                        {errors.display_name && (
                          <p className="text-sm text-destructive">{errors.display_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>{t.email}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={user?.email || ""}
                            disabled
                            className="pl-10 bg-muted"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t.emailCannotBeChanged || "Email cannot be changed"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">{t.phone}</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder={t.phonePlaceholder || "Enter your phone number"}
                            {...register("phone")}
                            className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>

                      <Button type="submit" variant="tesla" className="w-full" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.saveChanges || "Save Changes"}
                      </Button>
                    </TabsContent>

                    <TabsContent value="address" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address_line1">{t.addressLine1 || "Address Line 1"}</Label>
                        <Input
                          id="address_line1"
                          placeholder={t.addressLine1Placeholder || "Street address"}
                          {...register("address_line1")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address_line2">{t.addressLine2 || "Address Line 2"}</Label>
                        <Input
                          id="address_line2"
                          placeholder={t.addressLine2Placeholder || "Apartment, suite, etc."}
                          {...register("address_line2")}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">{t.city || "City"}</Label>
                          <Input
                            id="city"
                            placeholder={t.cityPlaceholder || "City"}
                            {...register("city")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postal_code">{t.postalCode || "Postal Code"}</Label>
                          <Input
                            id="postal_code"
                            placeholder={t.postalCodePlaceholder || "Postal code"}
                            {...register("postal_code")}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">{t.country || "Country"}</Label>
                        <Input
                          id="country"
                          placeholder={t.countryPlaceholder || "Country"}
                          {...register("country")}
                        />
                      </div>

                      <Button type="submit" variant="tesla" className="w-full" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.saveChanges || "Save Changes"}
                      </Button>
                    </TabsContent>
                  </form>
                )}

                <TabsContent value="preferences" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.emailNotifications || "Email Notifications"}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t.emailNotificationsDesc || "Receive appointment reminders via email"}
                      </p>
                    </div>
                    <Switch
                      checked={profile?.preferences?.emailNotifications ?? true}
                      onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.smsNotifications || "SMS Notifications"}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t.smsNotificationsDesc || "Receive appointment reminders via SMS"}
                      </p>
                    </div>
                    <Switch
                      checked={profile?.preferences?.smsNotifications ?? false}
                      onCheckedChange={(checked) => handlePreferenceChange("smsNotifications", checked)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
