import { useState } from "react";
import { ArrowLeft, Car, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  { id: "model-s", name: "Model S", image: modelSImage, description: "Prémium szedán, nagy hatótáv", info: "Plaid és Long Range változatok" },
  { id: "model-3", name: "Model 3", image: model3Image, description: "A legnépszerűbb, főleg fehérben", info: "Standard, Long Range és Performance" },
  { id: "model-x", name: "Model X", image: modelXImage, description: "SUV, Falcon Wing ajtók", info: "Plaid és Long Range változatok" },
  { id: "model-y", name: "Model Y", image: modelYImage, description: "Kompakt SUV, családbarát", info: "Long Range és Performance" },
];

const VehicleSelector = ({ onSelect, selected, onBack }: VehicleSelectorProps) => {
  const { t } = useLanguage();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const handleVehicleClick = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    onSelect(vehicleId);
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="animate-fade-in">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />{t.back}
        </Button>
      )}
      <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2 text-center">{t.selectVehicle}</h2>
      <p className="text-muted-foreground font-light mb-10 text-center">{t.chooseVehicleModel}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <TooltipProvider>
          {vehicles.map((vehicle) => {
            const isSelected = selectedVehicleId === vehicle.id;
            return (
              <button key={vehicle.id} onClick={() => handleVehicleClick(vehicle.id)} className={cn("relative flex flex-col items-center p-3 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-200 text-left bg-card hover:bg-muted/50", isSelected ? "border-foreground shadow-lg" : "border-border hover:border-foreground/30")}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 p-1 rounded-full hover:bg-muted transition-colors">
                      <Info className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>{vehicle.info}</p></TooltipContent>
                </Tooltip>
                {isSelected && (
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 w-5 h-5 md:w-6 md:h-6 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="w-3 h-3 md:w-4 md:h-4 text-background" />
                  </div>
                )}
                <div className="w-full aspect-[16/10] mb-2 md:mb-4 flex items-center justify-center">
                  <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen opacity-90" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-foreground mb-0.5 md:mb-1">{vehicle.name}</h3>
                <p className="hidden md:block text-sm text-muted-foreground text-center">{vehicle.description}</p>
              </button>
            );
          })}
        </TooltipProvider>
      </div>

      {selectedVehicleId && (
        <div className="mt-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 p-4 bg-muted/30 rounded-xl max-w-md mx-auto">
            {selectedVehicle && (
              <>
                <img src={selectedVehicle.image} alt={selectedVehicle.name} className="w-20 h-14 object-contain" />
                <div className="flex-1"><div className="font-semibold">{selectedVehicle.name}</div></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleSelector;
