import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { translations } from "@/lib/translations";

interface VehicleSelectorProps {
  onSelect: (vehicle: string) => void;
  selected: string | null;
  onBack: () => void;
}

const vehicles = [
  {
    id: "model-s",
    name: "Model S",
    type: "Sedan",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=250&fit=crop",
  },
  {
    id: "model-3",
    name: "Model 3",
    type: "Sedan",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=250&fit=crop",
  },
  {
    id: "model-x",
    name: "Model X",
    type: "SUV",
    image: "https://images.unsplash.com/photo-1566055909643-a51b4271aa47?w=400&h=250&fit=crop",
  },
  {
    id: "model-y",
    name: "Model Y",
    type: "SUV",
    image: "https://images.unsplash.com/photo-1619317408004-7d3d48bd4311?w=400&h=250&fit=crop",
  },
  {
    id: "cybertruck",
    name: "Cybertruck",
    type: "Truck",
    image: "https://images.unsplash.com/photo-1676394635498-c75e1cc59edd?w=400&h=250&fit=crop",
  },
  {
    id: "roadster",
    name: "Roadster",
    type: "Sports",
    image: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=400&h=250&fit=crop",
  },
];

const VehicleSelector = ({ onSelect, selected, onBack }: VehicleSelectorProps) => {
  return (
    <div className="animate-fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {translations.back}
      </Button>

      <h2 className="text-2xl md:text-3xl font-bold mb-2">{translations.selectVehicle}</h2>
      <p className="text-muted-foreground mb-8">
        {translations.chooseVehicleModel}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => {
          const isSelected = selected === vehicle.id;
          const translatedType = translations.vehicleTypes[vehicle.type as keyof typeof translations.vehicleTypes];

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
