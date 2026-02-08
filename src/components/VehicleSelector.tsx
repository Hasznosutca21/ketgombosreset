import { useEffect, useState } from "react";
import { ArrowLeft, Car, Info, Check, Calendar } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { YearPicker } from "@/components/ui/year-picker";

// Import vehicle images
import modelSImage from "@/assets/vehicles/model-s.png";
import model3Image from "@/assets/vehicles/model-3.png";
import model3ChromeImage from "@/assets/vehicles/model-3-chrome.png";
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
    info: "Plaid és Long Range változatok",
    yearRange: { from: 2012, to: 2026 }
  },
  { 
    id: "model-3", 
    name: "Model 3", 
    image: model3Image,
    chromeImage: model3ChromeImage,
    chromeYearRange: { from: 2018, to: 2020 },
    description: "A legnépszerűbb, főleg fehérben",
    info: "Standard, Long Range és Performance",
    yearRange: { from: 2018, to: 2026 }
  },
  { 
    id: "model-x", 
    name: "Model X", 
    image: modelXImage,
    description: "SUV, Falcon Wing ajtók",
    info: "Plaid és Long Range változatok",
    yearRange: { from: 2016, to: 2026 }
  },
  { 
    id: "model-y", 
    name: "Model Y", 
    image: modelYImage,
    description: "Kompakt SUV, családbarát",
    info: "Long Range és Performance",
    yearRange: { from: 2020, to: 2026 }
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
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

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
              setSelectedVehicleId(vehicleId);
              if (profile.vehicle_year) {
                setSelectedYear(profile.vehicle_year);
                onSelect(`${vehicleId}-${profile.vehicle_year}`);
              }
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

  const handleVehicleClick = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setSelectedYear(null); // Reset year when changing vehicle
  };

  const [tempYear, setTempYear] = useState<number | null>(null);

  const handleYearSelect = (year: number) => {
    setTempYear(year);
  };

  const handleYearConfirm = () => {
    if (tempYear && selectedVehicleId) {
      setSelectedYear(tempYear);
      onSelect(`${selectedVehicleId}-${tempYear}`);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const yearOptions = selectedVehicle 
    ? Array.from(
        { length: selectedVehicle.yearRange.to - selectedVehicle.yearRange.from + 1 }, 
        (_, i) => selectedVehicle.yearRange.to - i
      )
    : [];

  // Get the appropriate image based on year (for Model 3 chrome trim)
  const getVehicleImage = (vehicle: typeof vehicles[0], year: number | null) => {
    if (vehicle.chromeImage && vehicle.chromeYearRange && year) {
      if (year >= vehicle.chromeYearRange.from && year <= vehicle.chromeYearRange.to) {
        return vehicle.chromeImage;
      }
    }
    return vehicle.image;
  };

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
            const isSelected = selectedVehicleId === vehicle.id;

            return (
              <button
                key={vehicle.id}
                onClick={() => handleVehicleClick(vehicle.id)}
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

                {/* Vehicle Image */}
                <div className="w-full aspect-[16/10] mb-2 md:mb-4 flex items-center justify-center">
                  <img 
                    src={vehicle.image} 
                    alt={vehicle.name}
                    className="w-full h-full object-contain"
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

      {/* Year selector - shows after vehicle is selected */}
      {/* Year selector dialog */}
      <Dialog 
        open={!!selectedVehicleId && !selectedYear} 
        onOpenChange={(open) => {
          if (!open && !selectedYear) {
            setSelectedVehicleId(null);
            setTempYear(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              <Calendar className="w-5 h-5" />
              {t.selectYear}
            </DialogTitle>
          </DialogHeader>
          
          {selectedVehicle && (
            <div className="flex items-center justify-center gap-3 p-3 bg-muted/50 rounded-lg mb-2">
              <img 
                src={selectedVehicle.image} 
                alt={selectedVehicle.name}
                className="w-16 h-12 object-contain"
              />
              <span className="font-medium">{selectedVehicle.name}</span>
            </div>
          )}
          
          <YearPicker
            years={yearOptions}
            value={tempYear}
            onChange={handleYearSelect}
            className="my-4"
          />

          <Button 
            onClick={handleYearConfirm}
            disabled={!tempYear}
            className="w-full"
          >
            {t.confirm || "Megerősítés"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Selected vehicle and year display */}
      {selectedVehicleId && selectedYear && (
        <div className="mt-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 p-4 bg-muted/30 rounded-xl max-w-md mx-auto">
            {selectedVehicle && (
              <>
                <img 
                  src={getVehicleImage(selectedVehicle, selectedYear)} 
                  alt={selectedVehicle.name}
                  className="w-20 h-14 object-contain"
                />
                <div className="flex-1">
                  <div className="font-semibold">{selectedVehicle.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedYear}</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedYear(null)}
                >
                  {t.change || "Módosítás"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleSelector;
