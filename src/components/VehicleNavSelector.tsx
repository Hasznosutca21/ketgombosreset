import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

// Import vehicle images
import modelSImage from "@/assets/vehicles/model-s.png";
import model3Image from "@/assets/vehicles/model-3.png";
import modelXImage from "@/assets/vehicles/model-x.png";
import modelYImage from "@/assets/vehicles/model-y.png";

interface VehicleNavSelectorProps {
  selected: string | null;
  onSelect: (vehicle: string) => void;
  variant?: "glass" | "solid";
}

const vehicles = [
  { 
    id: "model-s", 
    name: "Model S",
    image: modelSImage,
  },
  { 
    id: "model-3", 
    name: "Model 3",
    image: model3Image,
  },
  { 
    id: "model-x", 
    name: "Model X",
    image: modelXImage,
  },
  { 
    id: "model-y", 
    name: "Model Y",
    image: modelYImage,
  },
];

const VehicleNavSelector = ({ selected, onSelect, variant = "glass" }: VehicleNavSelectorProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Parse selected vehicle (format: "model-y-2024")
  const parseSelected = () => {
    if (!selected) return null;
    const parts = selected.split("-");
    const year = parts.pop();
    const modelId = parts.join("-");
    return { modelId, year };
  };

  const selectedParsed = parseSelected();
  const selectedVehicle = vehicles.find(v => v.id === selectedParsed?.modelId);

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className={cn(
              "h-9 px-3 rounded-lg transition-all font-medium text-sm gap-2",
              variant === "glass" 
                ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 data-[state=open]:bg-white/20" 
                : "bg-muted hover:bg-muted/80 text-foreground border border-border"
            )}
          >
            {selectedVehicle ? (
              <div className="flex items-center gap-2">
                <img 
                  src={selectedVehicle.image} 
                  alt={selectedVehicle.name}
                  className="h-5 w-8 object-contain"
                />
                <span>{selectedVehicle.name}</span>
                {selectedParsed?.year && (
                  <span className="text-xs opacity-70">({selectedParsed.year})</span>
                )}
              </div>
            ) : (
              <span>{t.selectVehicle}</span>
            )}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-80 p-2">
              {vehicles.map((vehicle) => {
                const isSelected = selectedParsed?.modelId === vehicle.id;
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => {
                      // For now just select the vehicle without year
                      // User can change year in the main selector
                      onSelect(vehicle.id);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-lg transition-all text-left",
                      "hover:bg-muted/80",
                      isSelected && "bg-muted border border-foreground/20"
                    )}
                  >
                    <img 
                      src={vehicle.image} 
                      alt={vehicle.name}
                      className="h-10 w-16 object-contain"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{vehicle.name}</div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default VehicleNavSelector;
