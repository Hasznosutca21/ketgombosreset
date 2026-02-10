import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Car, Loader2, ImagePlus, X, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VehicleColorSelector, { TESLA_COLORS } from "@/components/VehicleColorSelector";

interface Vehicle {
  id: string;
  user_id: string;
  display_name: string | null;
  model: string;
  type: string | null;
  year: number | null;
  vin: string | null;
  plate: string | null;
  image_url: string | null;
  is_primary: boolean;
  color: string | null;
}

interface VehicleManagerProps {
  userId: string;
}

const MAX_VEHICLES = 3;

const VehicleManager = ({ userId }: VehicleManagerProps) => {
  const { language } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    display_name: "",
    model: "",
    type: "",
    year: "",
    vin: "",
    plate: "",
    image_url: "",
    color: "",
  });

  const t = {
    vehicles: language === "hu" ? "Járművek" : "Vehicles",
    addVehicle: language === "hu" ? "Jármű hozzáadása" : "Add Vehicle",
    editVehicle: language === "hu" ? "Jármű szerkesztése" : "Edit Vehicle",
    deleteVehicle: language === "hu" ? "Jármű törlése" : "Delete Vehicle",
    maxVehiclesReached: language === "hu" ? "Maximum 3 járművet adhatsz hozzá" : "You can add up to 3 vehicles",
    noVehicles: language === "hu" ? "Még nincs hozzáadott jármű" : "No vehicles added yet",
    addFirstVehicle: language === "hu" ? "Adj hozzá egy járművet a profilodhoz" : "Add a vehicle to your profile",
    displayName: language === "hu" ? "Becenév" : "Display Name",
    displayNamePlaceholder: language === "hu" ? "pl. Családi Tesla" : "e.g., Family Tesla",
    model: language === "hu" ? "Modell" : "Model",
    selectModel: language === "hu" ? "Válassz modellt" : "Select model",
    type: language === "hu" ? "Típus/Variáns" : "Type/Variant",
    typePlaceholder: language === "hu" ? "pl. Long Range, Performance" : "e.g., Long Range, Performance",
    year: language === "hu" ? "Évjárat" : "Year",
    yearPlaceholder: language === "hu" ? "pl. 2023" : "e.g., 2023",
    vin: language === "hu" ? "Alvázszám (VIN)" : "VIN",
    vinPlaceholder: language === "hu" ? "17 karakteres VIN" : "17-character VIN",
    plate: language === "hu" ? "Rendszám" : "License Plate",
    platePlaceholder: language === "hu" ? "pl. ABC-123" : "e.g., ABC-123",
    save: language === "hu" ? "Mentés" : "Save",
    cancel: language === "hu" ? "Mégse" : "Cancel",
    delete: language === "hu" ? "Törlés" : "Delete",
    primary: language === "hu" ? "Elsődleges" : "Primary",
    setAsPrimary: language === "hu" ? "Elsődlegesnek jelöl" : "Set as Primary",
    vehicleSaved: language === "hu" ? "Jármű mentve" : "Vehicle saved",
    vehicleDeleted: language === "hu" ? "Jármű törölve" : "Vehicle deleted",
    failedToSave: language === "hu" ? "Mentés sikertelen" : "Failed to save",
    failedToDelete: language === "hu" ? "Törlés sikertelen" : "Failed to delete",
    decodeVin: language === "hu" ? "VIN dekódolás" : "Decode VIN",
    vehicleImage: language === "hu" ? "Jármű kép" : "Vehicle Image",
    color: language === "hu" ? "Szín" : "Color",
    selectColor: language === "hu" ? "Válassz színt" : "Select color",
  };

  const getSignedUrl = async (publicUrl: string): Promise<string> => {
    try {
      // Extract the path from the public URL (after /vehicle-images/)
      const match = publicUrl.match(/vehicle-images\/(.+)$/);
      if (!match) return publicUrl;
      const path = match[1];
      const { data, error } = await supabase.storage
        .from("vehicle-images")
        .createSignedUrl(path, 3600); // 1 hour expiry
      if (error || !data?.signedUrl) return publicUrl;
      return data.signedUrl;
    } catch {
      return publicUrl;
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [userId]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", userId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      const vehiclesData = (data as Vehicle[]) || [];
      
      // Generate signed URLs for private bucket images
      const vehiclesWithSignedUrls = await Promise.all(
        vehiclesData.map(async (v) => {
          if (v.image_url) {
            const signedUrl = await getSignedUrl(v.image_url);
            return { ...v, image_url: signedUrl };
          }
          return v;
        })
      );
      
      setVehicles(vehiclesWithSignedUrls);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      display_name: "",
      model: "",
      type: "",
      year: "",
      vin: "",
      plate: "",
      image_url: "",
      color: "",
    });
    setEditingVehicle(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      display_name: vehicle.display_name || "",
      model: vehicle.model,
      type: vehicle.type || "",
      year: vehicle.year?.toString() || "",
      vin: vehicle.vin || "",
      plate: vehicle.plate || "",
      image_url: vehicle.image_url || "",
      color: vehicle.color || "",
    });
    setIsDialogOpen(true);
  };

  const handleDecodeVin = async () => {
    const vin = formData.vin.trim().toUpperCase();
    if (vin.length !== 17) {
      toast.error(language === "hu" ? "A VIN-nek 17 karakternek kell lennie" : "VIN must be 17 characters");
      return;
    }

    setIsDecodingVin(true);
    try {
      const { data, error } = await supabase.functions.invoke("decode-vin", {
        body: { vin },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        vin: vin,
        model: data.model || prev.model,
        type: data.drive || data.type || prev.type,
        year: data.year?.toString() || prev.year,
      }));
      toast.success(language === "hu" ? "VIN dekódolva" : "VIN decoded");
    } catch (error) {
      console.error("Error decoding VIN:", error);
      toast.error(language === "hu" ? "VIN dekódolás sikertelen" : "Failed to decode VIN");
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(language === "hu" ? "Csak képfájl tölthető fel" : "Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === "hu" ? "A kép maximum 5MB lehet" : "Image must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const vehicleId = editingVehicle?.id || crypto.randomUUID();
      const filePath = `${userId}/${vehicleId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("vehicle-images")
        .getPublicUrl(filePath);

      // Generate signed URL for immediate preview
      const { data: signedData } = await supabase.storage
        .from("vehicle-images")
        .createSignedUrl(filePath, 3600);

      // Store public URL in DB for path extraction; show signed URL in form preview
      setFormData((prev) => ({ ...prev, image_url: signedData?.signedUrl || publicUrl }));
      toast.success(language === "hu" ? "Kép feltöltve" : "Image uploaded");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(language === "hu" ? "Kép feltöltése sikertelen" : "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.model) {
      toast.error(language === "hu" ? "Kérlek válassz modellt" : "Please select a model");
      return;
    }

    setIsSaving(true);
    try {
      const vehicleData = {
        user_id: userId,
        display_name: formData.display_name || null,
        model: formData.model,
        type: formData.type || null,
        year: formData.year ? parseInt(formData.year) : null,
        vin: formData.vin || null,
        plate: formData.plate || null,
        image_url: formData.image_url || null,
        color: formData.color || null,
        is_primary: vehicles.length === 0, // First vehicle is primary
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from("vehicles")
          .update(vehicleData)
          .eq("id", editingVehicle.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicles").insert(vehicleData);
        if (error) throw error;
      }

      toast.success(t.vehicleSaved);
      setIsDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error(t.failedToSave);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
      if (error) throw error;

      toast.success(t.vehicleDeleted);
      setIsDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error(t.failedToDelete);
    }
  };

  const handleSetPrimary = async (vehicleId: string) => {
    try {
      // First, unset all as primary
      await supabase
        .from("vehicles")
        .update({ is_primary: false })
        .eq("user_id", userId);

      // Then set the selected one as primary
      const { error } = await supabase
        .from("vehicles")
        .update({ is_primary: true })
        .eq("id", vehicleId);

      if (error) throw error;

      toast.success(language === "hu" ? "Elsődleges jármű beállítva" : "Primary vehicle set");
      fetchVehicles();
    } catch (error) {
      console.error("Error setting primary:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {vehicles.length}/{MAX_VEHICLES} {t.vehicles.toLowerCase()}
          </span>
        </div>
        {vehicles.length < MAX_VEHICLES && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t.addVehicle}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVehicle ? t.editVehicle : t.addVehicle}</DialogTitle>
                <DialogDescription>
                  {language === "hu" 
                    ? "Add meg a járműved adatait. A VIN beírásával automatikusan kitöltheted a többi mezőt."
                    : "Enter your vehicle details. The VIN can auto-fill other fields."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t.displayName}</Label>
                  <Input
                    placeholder={t.displayNamePlaceholder}
                    value={formData.display_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.model} *</Label>
                  <Select
                    value={formData.model}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectModel} />
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
                  <Label>{t.vin}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.vinPlaceholder}
                      maxLength={17}
                      className="font-mono uppercase flex-1"
                      value={formData.vin}
                      onChange={(e) => setFormData((prev) => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDecodeVin}
                      disabled={isDecodingVin || formData.vin.length !== 17}
                    >
                      {isDecodingVin ? <Loader2 className="h-4 w-4 animate-spin" /> : t.decodeVin}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.type}</Label>
                    <Input
                      placeholder={t.typePlaceholder}
                      value={formData.type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.year}</Label>
                    <Input
                      type="number"
                      min={2008}
                      max={new Date().getFullYear() + 1}
                      placeholder={t.yearPlaceholder}
                      value={formData.year}
                      onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t.plate}</Label>
                  <Input
                    placeholder={t.platePlaceholder}
                    value={formData.plate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.color}</Label>
                  <VehicleColorSelector
                    value={formData.color}
                    onChange={(colorId) => setFormData((prev) => ({ ...prev, color: colorId }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.vehicleImage}</Label>
                  {formData.image_url ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <img src={formData.image_url} alt="Vehicle" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <ImagePlus className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {language === "hu" ? "Kattints a feltöltéshez" : "Click to upload"}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                {editingVehicle && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDelete(editingVehicle.id)}
                    className="sm:mr-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t.delete}
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.cancel}
                </Button>
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t.save}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Car className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">{t.noVehicles}</p>
          <p className="text-xs text-muted-foreground mb-4">{t.addFirstVehicle}</p>
          <Button variant="outline" size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            {t.addVehicle}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openEditDialog(vehicle)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {vehicle.image_url ? (
                    <div className="w-16 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img src={vehicle.image_url} alt={vehicle.model} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Car className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">
                        {vehicle.display_name || vehicle.model}
                      </span>
                      {vehicle.is_primary && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          {t.primary}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {vehicle.display_name && <span>{vehicle.model}</span>}
                      {vehicle.year && <span>{vehicle.year}</span>}
                      {vehicle.plate && <span className="font-mono">{vehicle.plate}</span>}
                    </div>
                  </div>
                  {!vehicle.is_primary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(vehicle.id);
                      }}
                      className="flex-shrink-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {vehicles.length >= MAX_VEHICLES && (
        <p className="text-xs text-muted-foreground text-center">{t.maxVehiclesReached}</p>
      )}
    </div>
  );
};

export default VehicleManager;
