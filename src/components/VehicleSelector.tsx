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
  onBack: () => void;
}

const vehicles = [
  { id: "model-s", name: "Model S", type: "Sedan", image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=250&fit=crop" },
  { id: "model-s-plaid", name: "Model S Plaid", type: "Sedan", image: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=400&h=250&fit=crop" },
  { id: "model-3", name: "Model 3", type: "Sedan", image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=250&fit=crop" },
  { id: "model-3-performance", name: "Model 3 Performance", type: "Sedan", image: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=400&h=250&fit=crop" },
  { id: "model-x", name: "Model X", type: "SUV", image: "https://images.unsplash.com/photo-1566055909643-a51b4271aa47?w=400&h=250&fit=crop" },
  { id: "model-x-plaid", name: "Model X Plaid", type: "SUV", image: "https://images.unsplash.com/photo-1551826152-d7248fa0a961?w=400&h=250&fit=crop" },
  { id: "model-y", name: "Model Y", type: "SUV", image: "https://images.unsplash.com/photo-1619317408004-7d3d48bd4311?w=400&h=250&fit=crop" },
  { id: "model-y-performance", name: "Model Y Performance", type: "SUV", image: "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400&h=250&fit=crop" },
  { id: "cybertruck", name: "Cybertruck", type: "Truck", image: "https://images.unsplash.com/photo-1676394635498-c75e1cc59edd?w=400&h=250&fit=crop" },
  { id: "cybertruck-cyberbeast", name: "Cybertruck Cyberbeast", type: "Truck", image: "https://images.unsplash.com/photo-1707834696823-71c73a8a1c29?w=400&h=250&fit=crop" },
  { id: "roadster", name: "Roadster", type: "Sports", image: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=400&h=250&fit=crop" },
];

// Find matching vehicle ID from profile model name (flexible matching)
const findVehicleIdFromModel = (modelName: string): string | null => {
  const normalized = modelName.toLowerCase().trim();
  
  // Check for exact matches first
  for (const vehicle of vehicles) {
    if (vehicle.name.toLowerCase() === normalized) {
      return vehicle.id;
    }
  }
  
  // Check for partial matches (e.g., "Model 3" matches "model-3")
  for (const vehicle of vehicles) {
    const vehicleNormalized = vehicle.name.toLowerCase();
    // If profile model is contained in vehicle name or vice versa
    if (vehicleNormalized.startsWith(normalized) || normalized.startsWith(vehicleNormalized)) {
      return vehicle.id;
    }
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
      <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t.back}
      </Button>

      <h2 className="text-2xl md:text-3xl font-bold mb-2">{t.selectVehicle}</h2>
      <p className="text-muted-foreground mb-4">{t.chooseVehicleModel}</p>

      {/* Profile vehicle banner */}
      {profileVehicle && (
        <div className="glass-card p-4 mb-6 flex items-center gap-3 border-primary/30 bg-primary/5">
          <Car className="w-5 h-5 text-primary flex-shrink-0" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => {
          const isSelected = selected === vehicle.id;
          const translatedType = t.vehicleTypes[vehicle.type as keyof typeof t.vehicleTypes];

          return (
            <button
              key={vehicle.id}
              onClick={() => onSelect(vehicle.id)}
              className={cn(
                "glass-card overflow-hidden text-left transition-all duration-300 hover:scale-[1.02] hover:border-primary/50",
                isSelected && "border-primary shadow-[0_0_30px_-10px_hsl(352_85%_49%/0.4)]"
              )}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{vehicle.name}</h3>
                <p className="text-sm text-muted-foreground">{translatedType}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleSelector;
