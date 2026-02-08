import { useEffect, useState } from "react";
import { ArrowLeft, Car, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import vehicle images
import modelSImage from "@/assets/vehicles/model-s.png";
import model3Image from "@/assets/vehicles/model-3.png";
import modelXImage from "@/assets/vehicles/model-x.png";
import modelYImage from "@/assets/vehicles/model-y.png";

interface VehicleSelectorProps {
  onSelect: (vehicle: string) => void;
  selected: string | null;
  onBack?: () => void;
}

const vehicles = [
  { 
    id: "model-s", 
    name: "Model S", 
    image: modelSImage,
    description: "Prémium szedán, nagy hatótáv",
    info: "Plaid és Long Range változatok"
  },
  { 
    id: "model-3", 
    name: "Model 3", 
    image: model3Image,
    description: "Kompakt szedán, népszerű választás",
    info: "Standard, Long Range és Performance"
  },
  { 
    id: "model-x", 
    name: "Model X", 
    image: modelXImage,
    description: "SUV, Falcon Wing ajtók",
    info: "Plaid és Long Range változatok"
  },
  { 
    id: "model-y", 
    name: "Model Y", 
    image: modelYImage,
    description: "Kompakt SUV, családbarát",
    info: "Long Range és Performance"
  },
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

      <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2 text-center">{t.selectVehicle}</h2>
      <p className="text-muted-foreground font-light mb-10 text-center">{t.chooseVehicleModel}</p>

      {/* Profile vehicle banner */}
      {profileVehicle && (
        <div className="tesla-card p-4 mb-8 flex items-center gap-3 border-foreground/20 max-w-md mx-auto">
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

      {/* Card-style vehicle grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <TooltipProvider>
          {vehicles.map((vehicle) => {
            const isSelected = selected === vehicle.id;

            return (
              <button
                key={vehicle.id}
                onClick={() => onSelect(vehicle.id)}
                className={cn(
                  "relative flex flex-col items-center p-3 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-200 text-left",
                  "bg-card hover:bg-muted/50",
                  isSelected 
                    ? "border-foreground shadow-lg" 
                    : "border-border hover:border-foreground/30"
                )}
              >
                {/* Info tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 p-1 rounded-full hover:bg-muted transition-colors">
                      <Info className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{vehicle.info}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 w-5 h-5 md:w-6 md:h-6 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="w-3 h-3 md:w-4 md:h-4 text-background" />
                  </div>
                )}

                {/* Vehicle Image in circle */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted/50 flex items-center justify-center mb-2 md:mb-4 overflow-hidden">
                  <img 
                    src={vehicle.image} 
                    alt={vehicle.name}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  />
                </div>
                
                {/* Vehicle Name */}
                <h3 className="text-sm md:text-lg font-semibold text-foreground mb-0.5 md:mb-1">
                  {vehicle.name}
                </h3>

                {/* Description - hidden on mobile */}
                <p className="hidden md:block text-sm text-muted-foreground text-center">
                  {vehicle.description}
                </p>
              </button>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default VehicleSelector;
