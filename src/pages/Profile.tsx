import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Camera, User, Mail, Phone, MapPin, Settings, Trash2, Car, ImagePlus, X } from "lucide-react";
import teslandLogo from "@/assets/tesland-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
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
  vehicle_model: string | null;
  vehicle_type: string | null;
  vehicle_year: number | null;
  vehicle_vin: string | null;
  vehicle_plate: string | null;
  vehicle_image_url: string | null;
  plate_position_x: number | null;
  plate_position_y: number | null;
  plate_size: number | null;
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
  const [isUploadingVehicleImage, setIsUploadingVehicleImage] = useState(false);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vehicleImageInputRef = useRef<HTMLInputElement>(null);

  const profileSchema = z.object({
    display_name: z.string().max(100, t.displayNameTooLong || "Display name must be less than 100 characters").optional().or(z.literal("")),
    phone: z.string().max(20, t.phoneTooLong || "Phone must be less than 20 characters").optional().or(z.literal("")),
    address_line1: z.string().max(255).optional().or(z.literal("")),
    address_line2: z.string().max(255).optional().or(z.literal("")),
    city: z.string().max(100).optional().or(z.literal("")),
    postal_code: z.string().max(20).optional().or(z.literal("")),
    country: z.string().max(100).optional().or(z.literal("")),
    vehicle_model: z.string().max(50).optional().or(z.literal("")),
    vehicle_type: z.string().max(100).optional().or(z.literal("")),
    vehicle_year: z.coerce.number().min(2008).max(new Date().getFullYear() + 1).optional().or(z.literal("")),
    vehicle_vin: z.string().max(17).optional().or(z.literal("")),
    vehicle_plate: z.string().max(20).optional().or(z.literal("")),
  });

  type ProfileFormData = z.infer<typeof profileSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
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
            vehicle_model: data.vehicle_model || "",
            vehicle_type: data.vehicle_type || "",
            vehicle_year: data.vehicle_year || "",
            vehicle_vin: data.vehicle_vin || "",
            vehicle_plate: data.vehicle_plate || "",
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
        vehicle_model: data.vehicle_model || null,
        vehicle_type: data.vehicle_type || null,
        vehicle_year: data.vehicle_year ? Number(data.vehicle_year) : null,
        vehicle_vin: data.vehicle_vin || null,
        vehicle_plate: data.vehicle_plate || null,
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

  const handleVehicleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingVehicleImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/vehicle.${fileExt}`;

      // Delete old vehicle image if exists
      if (profile?.vehicle_image_url) {
        const oldPath = profile.vehicle_image_url.split("/").slice(-2).join("/");
        await supabase.storage.from("vehicle-images").remove([oldPath]);
      }

      // Upload new vehicle image
      const { error: uploadError } = await supabase.storage
        .from("vehicle-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("vehicle-images")
        .getPublicUrl(filePath);

      // Update profile with new vehicle image URL using upsert
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          vehicle_image_url: publicUrl,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, vehicle_image_url: publicUrl } : null);
      toast.success(t.vehicleImageUpdated || "Vehicle image updated successfully");
    } catch (error) {
      console.error("Error uploading vehicle image:", error);
      toast.error(t.failedToUploadVehicleImage || "Failed to upload vehicle image");
    } finally {
      setIsUploadingVehicleImage(false);
    }
  };

  const handleRemoveVehicleImage = async () => {
    if (!user || !profile?.vehicle_image_url) return;

    setIsUploadingVehicleImage(true);
    try {
      // Delete vehicle image from storage
      const oldPath = profile.vehicle_image_url.split("/").slice(-2).join("/");
      await supabase.storage.from("vehicle-images").remove([oldPath]);

      // Update profile to remove vehicle image URL
      const { error } = await supabase
        .from("profiles")
        .update({ vehicle_image_url: null })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, vehicle_image_url: null } : null);
      toast.success(t.vehicleImageRemoved || "Vehicle image removed");
    } catch (error) {
      console.error("Error removing vehicle image:", error);
      toast.error(t.failedToUploadVehicleImage || "Failed to remove vehicle image");
    } finally {
      setIsUploadingVehicleImage(false);
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

  const handlePlateSettingChange = async (key: 'plate_position_x' | 'plate_position_y' | 'plate_size', value: number) => {
    if (!user) return;

    // Immediately update local state for responsive UI
    setProfile((prev) => prev ? { ...prev, [key]: value } : null);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          [key]: value,
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error("Error updating plate settings:", error);
      // Don't show error toast for every slider movement
    }
  };

  const handleDecodeVin = async (vinValue?: string) => {
    const vin = vinValue || (document.getElementById('vehicle_vin') as HTMLInputElement)?.value?.trim();

    if (!vin) {
      if (!vinValue) toast.error(t.vehicleVinPlaceholder || "Please enter a VIN");
      return;
    }

    if (vin.length !== 17) {
      if (!vinValue) toast.error(t.invalidVinLength || "VIN must be exactly 17 characters");
      return;
    }

    setIsDecodingVin(true);
    try {
      const { data, error } = await supabase.functions.invoke('decode-vin', {
        body: { vin },
      });

      if (error) throw error;

      if (data.error) {
        if (!vinValue) {
          if (data.error.includes("Only Tesla")) {
            toast.error(t.onlyTeslaSupported || "Only Tesla vehicles are supported");
          } else {
            toast.error(data.error);
          }
        }
        return;
      }

      // Prepare the decoded data
      const decodedData = {
        vehicle_model: data.model || null,
        vehicle_type: data.drive || data.type || null,
        vehicle_year: data.year || null,
        vehicle_vin: vin.toUpperCase(),
      };

      // Immediately reflect in the form fields (RHF inputs are uncontrolled)
      setValue("vehicle_vin", decodedData.vehicle_vin, { shouldDirty: true });
      setValue("vehicle_model", decodedData.vehicle_model || "", { shouldDirty: true });
      setValue("vehicle_type", decodedData.vehicle_type || "", { shouldDirty: true });
      setValue("vehicle_year", (decodedData.vehicle_year ?? "") as unknown as any, { shouldDirty: true });

      // Save to database immediately
      if (user) {
        const { error: saveError } = await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              ...decodedData,
            },
            { onConflict: "user_id" }
          );

        if (saveError) {
          console.error("Error saving decoded VIN data:", saveError);
          toast.error(t.failedToSaveProfile || "Failed to save profile");
          return;
        }
      }

      // Update local profile state (also works if profile hasn't loaded yet)
      setProfile((prev) => ({
        ...(prev ?? ({ user_id: user?.id ?? "", preferences: {} } as any)),
        ...decodedData,
      }));

      if (!vinValue) {
        toast.success(t.vinDecoded || "Vehicle data filled successfully");
      }
    } catch (error) {
      console.error("Error decoding VIN:", error);
      if (!vinValue) toast.error(t.vinDecodeFailed || "Failed to decode VIN");
    } finally {
      setIsDecodingVin(false);
    }
  };

  // Auto-decode VIN when user types 17 characters
  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vin = e.target.value.toUpperCase().trim();
    if (vin.length === 17) {
      handleDecodeVin(vin);
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
          <img src={teslandLogo} alt="TESLAND" className="h-12 md:h-16 w-auto" />
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
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="personal" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.personalInfo || "Personal"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="vehicle" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.vehicle || "Vehicle"}</span>
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

                    <TabsContent value="vehicle" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle_model">{t.vehicleModel || "Tesla Model"}</Label>
                        <Select
                          value={profile?.vehicle_model || ""}
                          onValueChange={(value) => {
                            setProfile((prev) => prev ? { ...prev, vehicle_model: value } : null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectModel || "Select model"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Model S">Model S</SelectItem>
                            <SelectItem value="Model 3">Model 3</SelectItem>
                            <SelectItem value="Model X">Model X</SelectItem>
                            <SelectItem value="Model Y">Model Y</SelectItem>
                            <SelectItem value="Cybertruck">Cybertruck</SelectItem>
                            <SelectItem value="Roadster">Roadster</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicle_type">{t.vehicleType || "Variant/Type"}</Label>
                        <Input
                          id="vehicle_type"
                          placeholder={t.vehicleTypePlaceholder || "e.g., Long Range, Performance, Standard Range"}
                          {...register("vehicle_type")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicle_year">{t.vehicleYear || "Year"}</Label>
                        <Input
                          id="vehicle_year"
                          type="number"
                          min={2008}
                          max={new Date().getFullYear() + 1}
                          placeholder={t.vehicleYearPlaceholder || "e.g., 2023"}
                          {...register("vehicle_year")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicle_vin">{t.vehicleVin || "VIN"}</Label>
                        <div className="flex gap-2">
                          <Input
                            id="vehicle_vin"
                            placeholder={t.vehicleVinPlaceholder || "Vehicle Identification Number"}
                            maxLength={17}
                            className="flex-1 font-mono uppercase"
                            {...register("vehicle_vin", {
                              onChange: handleVinChange,
                            })}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDecodeVin()}
                            disabled={isDecodingVin}
                          >
                            {isDecodingVin ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t.decodeVin || "Decode VIN"
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t.vinHelp || "17 character Vehicle Identification Number"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicle_plate">{t.vehiclePlate || "License Plate"}</Label>
                        <Input
                          id="vehicle_plate"
                          placeholder={t.vehiclePlatePlaceholder || "e.g., ABC-123"}
                          {...register("vehicle_plate")}
                        />
                      </div>

                      {/* Vehicle Image Upload */}
                      <div className="space-y-2">
                        <Label>{t.vehicleImage || "Vehicle Image"}</Label>
                        <div className="flex flex-col items-center gap-4">
                          {profile?.vehicle_image_url ? (
                            <div className="relative w-full h-48 overflow-hidden rounded-lg border border-border">
                              <img
                                src={profile.vehicle_image_url}
                                alt="Vehicle"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={handleRemoveVehicleImage}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-colors z-10"
                                disabled={isUploadingVehicleImage}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => vehicleImageInputRef.current?.click()}
                              disabled={isUploadingVehicleImage}
                              className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                            >
                              {isUploadingVehicleImage ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              ) : (
                                <>
                                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {t.clickToUploadVehicleImage || "Click to upload vehicle image"}
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                          
                          {profile?.vehicle_image_url && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => vehicleImageInputRef.current?.click()}
                              disabled={isUploadingVehicleImage}
                            >
                              {isUploadingVehicleImage ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ImagePlus className="mr-2 h-4 w-4" />
                              )}
                              {t.uploadVehicleImage || "Upload Image"}
                            </Button>
                          )}
                          
                          <input
                            ref={vehicleImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleVehicleImageUpload}
                          />
                        </div>
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

                  {/* Danger Zone */}
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-destructive">
                        {t.dangerZone || "Danger Zone"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t.dangerZoneDesc || "Irreversible and destructive actions"}
                      </p>
                    </div>
                    <DeleteAccountDialog
                      trigger={
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t.deleteAccount || "Delete Account"}
                        </Button>
                      }
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
