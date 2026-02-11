import { useState } from "react";
import { ChevronDown, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
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
    description: "Prémium szedán",
    info: "Plaid és Long Range",
  },
  { 
    id: "model-3", 
    name: "Model 3",
    image: model3Image,
    description: "A legnépszerűbb",
    info: "Standard, LR, Performance",
  },
  { 
    id: "model-x", 
    name: "Model X",
    image: modelXImage,
    description: "SUV, Falcon Wing",
    info: "Plaid és Long Range",
  },
  { 
    id: "model-y", 
    name: "Model Y",
    image: modelYImage,
    description: "Kompakt SUV",
    info: "Long Range, Performance",
  },
];

const VehicleNavSelector = ({ selected, onSelect, variant = "glass" }: VehicleNavSelectorProps) => {
  const { t } = useLanguage();

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
            <div className="w-[500px] p-4 bg-background border border-border rounded-lg shadow-xl">
              <div className="grid grid-cols-2 gap-3">
                <TooltipProvider>
                  {vehicles.map((vehicle) => {
                    const isSelected = selectedParsed?.modelId === vehicle.id;
                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => onSelect(vehicle.id)}
                        className={cn(
                          "relative flex flex-col items-center p-4 rounded-xl transition-all text-center",
                          "bg-muted/30 hover:bg-muted/60 border-2",
                          isSelected 
                            ? "border-foreground shadow-md" 
                            : "border-transparent hover:border-foreground/20"
                        )}
                      >
                        {/* Info tooltip */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10">
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{vehicle.info}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Selected checkmark */}
                        {isSelected && (
                          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                            <Check className="w-3 h-3 text-background" />
                          </div>
                        )}

                        {/* Vehicle Image */}
                        <div className="w-full aspect-[16/9] mb-3 flex items-center justify-center">
                          <img 
                            src={vehicle.image} 
                            alt={vehicle.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        
                        {/* Vehicle Name */}
                        <h4 className="text-sm font-semibold text-foreground mb-0.5">
                          {vehicle.name}
                        </h4>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground">
                          {vehicle.description}
                        </p>
                      </button>
                    );
                  })}
                </TooltipProvider>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default VehicleNavSelector;
