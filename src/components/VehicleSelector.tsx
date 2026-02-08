import { useEffect, useState } from "react";
import { ArrowLeft, Car, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface VehicleSelectorProps {
  onSelect: (vehicle: string) => void;
  selected: string | null;
  onBack?: () => void;
}

const vehicles = [
  { id: "model-s", name: "Model S" },
  { id: "model-3", name: "Model 3" },
  { id: "model-x", name: "Model X" },
  { id: "model-y", name: "Model Y" },
];

// Find matching vehicle ID from model name (flexible matching)
const findVehicleIdFromModel = (modelName: string): string | null => {
  const normalized = modelName.toLowerCase().trim();
  
  // Check for exact matches first
  for (const vehicle of vehicles) {
    if (vehicle.name.toLowerCase() === normalized) {
      return vehicle.id;
    }
  }
  
  // Check for base model matches (e.g., "Model S Plaid" -> "model-s")
  if (normalized.includes('model s')) return 'model-s';
  if (normalized.includes('model 3')) return 'model-3';
  if (normalized.includes('model x')) return 'model-x';
  if (normalized.includes('model y')) return 'model-y';
  
  // Fallback - check if model name is just the model part (e.g., "3" for Model 3)
  const modelMatch = normalized.match(/model\s*([3sxy])/i);
  if (modelMatch) {
    const modelLetter = modelMatch[1].toLowerCase();
    if (modelLetter === 's') return 'model-s';
    if (modelLetter === '3') return 'model-3';
    if (modelLetter === 'x') return 'model-x';
    if (modelLetter === 'y') return 'model-y';
  }
  
  return null;
};

interface ProfileVehicle {
  model: string;
  plate: string | null;
  year: number | null;
}

const VehicleSelector = ({ onSelect, selected, onBack }: VehicleSelectorProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [profileVehicle, setProfileVehicle] = useState<ProfileVehicle | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Load vehicle from profile
  useEffect(() => {
    const loadProfileVehicle = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("vehicle_model, vehicle_plate, vehicle_year")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.vehicle_model) {
          setProfileVehicle({
            model: profile.vehicle_model,
            plate: profile.vehicle_plate,
            year: profile.vehicle_year,
          });

          // Auto-select if no vehicle is selected yet
          if (!selected && !hasAutoSelected) {
            const vehicleId = findVehicleIdFromModel(profile.vehicle_model);
            if (vehicleId) {
              onSelect(vehicleId);
              setHasAutoSelected(true);
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile vehicle:", error);
      }
    };

    loadProfileVehicle();
  }, [user, selected, onSelect, hasAutoSelected]);

  return (
    <div className="animate-fade-in">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </Button>
      )}

      <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2">{t.selectVehicle}</h2>
      <p className="text-muted-foreground font-light mb-8">{t.chooseVehicleModel}</p>

      {/* Profile vehicle banner */}
      {profileVehicle && (
        <div className="tesla-card p-4 mb-8 flex items-center gap-3 border-foreground/20">
          <Car className="w-5 h-5 text-foreground/60 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium">
              {profileVehicle.model}
              {profileVehicle.year && ` (${profileVehicle.year})`}
            </div>
            {profileVehicle.plate && (
              <div className="text-sm text-muted-foreground">{profileVehicle.plate}</div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            {t.fromProfile || "From profile"}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {vehicles.map((vehicle) => {
          const isSelected = selected === vehicle.id;

          return (
            <button
              key={vehicle.id}
              onClick={() => onSelect(vehicle.id)}
              className={cn(
                "tesla-card p-8 md:p-10 text-center transition-all duration-200",
                isSelected 
                  ? "border-foreground bg-foreground text-background" 
                  : "hover:border-foreground/30"
              )}
            >
              <div className="flex flex-col items-center justify-center">
                <span className={cn(
                  "text-xs uppercase tracking-[0.25em] mb-2",
                  isSelected ? "text-background/70" : "text-muted-foreground"
                )}>
                  Tesla
                </span>
                <span className="text-2xl md:text-3xl font-extralight tracking-wide">
                  <span className="text-base md:text-lg font-light mr-1">Model</span>
                  {vehicle.name.replace("Model ", "")}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleSelector;
