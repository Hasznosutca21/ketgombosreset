import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Car, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";

// Import vehicle images
import modelSImage from "@/assets/vehicles/model-s.png";
import model3Image from "@/assets/vehicles/model-3.png";
import modelXImage from "@/assets/vehicles/model-x.png";
import modelYImage from "@/assets/vehicles/model-y.png";

interface VehicleCarouselProps {
  onSelect: (vehicle: string) => void;
  selected: string | null;
}

const vehicles = [
  { id: "model-s", name: "Model S", image: modelSImage },
  { id: "model-3", name: "Model 3", image: model3Image },
  { id: "model-x", name: "Model X", image: modelXImage },
  { id: "model-y", name: "Model Y", image: modelYImage },
];

const findVehicleIdFromModel = (modelName: string): string | null => {
  const normalized = modelName.toLowerCase().trim();
  for (const vehicle of vehicles) {
    if (vehicle.name.toLowerCase() === normalized) return vehicle.id;
  }
  if (normalized.includes('model s')) return 'model-s';
  if (normalized.includes('model 3')) return 'model-3';
  if (normalized.includes('model x')) return 'model-x';
  if (normalized.includes('model y')) return 'model-y';
  return null;
};

interface ProfileVehicle {
  model: string;
  vin: string | null;
  year: number | null;
  type: string | null;
}

const VehicleCarousel = ({ onSelect, selected }: VehicleCarouselProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [profileVehicle, setProfileVehicle] = useState<ProfileVehicle | null>(null);
  const [isVinLocked, setIsVinLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: !isVinLocked, // Disable loop when VIN locked
    align: "center",
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => {
    if (!isVinLocked) emblaApi?.scrollPrev();
  }, [emblaApi, isVinLocked]);
  
  const scrollNext = useCallback(() => {
    if (!isVinLocked) emblaApi?.scrollNext();
  }, [emblaApi, isVinLocked]);

  const onSelectCallback = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelectCallback();
    emblaApi.on("select", onSelectCallback);
    return () => {
      emblaApi.off("select", onSelectCallback);
    };
  }, [emblaApi, onSelectCallback]);

  // Load vehicle from profile and check for VIN lock
  useEffect(() => {
    const loadProfileVehicle = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("vehicle_model, vehicle_vin, vehicle_year, vehicle_type")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.vehicle_model) {
          const vehicleId = findVehicleIdFromModel(profile.vehicle_model);
          
          // Check if VIN is set - if so, lock to this vehicle
          const hasVin = profile.vehicle_vin && profile.vehicle_vin.length === 17;
          
          if (hasVin && vehicleId) {
            setProfileVehicle({
              model: profile.vehicle_model,
              vin: profile.vehicle_vin,
              year: profile.vehicle_year,
              type: profile.vehicle_type,
            });
            setIsVinLocked(true);
            
            // Auto-select and proceed
            const index = vehicles.findIndex(v => v.id === vehicleId);
            if (index !== -1 && emblaApi) {
              emblaApi.scrollTo(index, true);
              setSelectedIndex(index);
            }
            setHasAutoSelected(true);
          } else if (vehicleId && !hasAutoSelected) {
            // Just auto-scroll to saved vehicle without locking
            const index = vehicles.findIndex(v => v.id === vehicleId);
            if (index !== -1 && emblaApi) {
              emblaApi.scrollTo(index, true);
              setSelectedIndex(index);
            }
            setHasAutoSelected(true);
          }
        }
      } catch (error) {
        console.error("Error loading profile vehicle:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileVehicle();
  }, [user, emblaApi, hasAutoSelected]);

  const handleSelect = () => {
    const vehicle = vehicles[selectedIndex];
    if (vehicle) {
      onSelect(vehicle.id);
    }
  };

  const currentVehicle = vehicles[selectedIndex];

  // If VIN locked, show simplified locked view
  if (isVinLocked && profileVehicle) {
    const lockedVehicle = vehicles.find(v => 
      findVehicleIdFromModel(profileVehicle.model) === v.id
    );

    return (
      <div className="animate-fade-in">
        <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2 text-center">
          {t.yourVehicle || "Az Ön járműve"}
        </h2>
        <p className="text-muted-foreground font-light mb-8 text-center">
          {t.vinLockedVehicle || "VIN alapján azonosítva"}
        </p>

        {/* Locked Vehicle Display */}
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            {/* Lock Badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                <span>{t.vinVerified || "VIN ellenőrizve"}</span>
              </div>
            </div>

            {/* Vehicle Image */}
            {lockedVehicle && (
              <img
                src={lockedVehicle.image}
                alt={lockedVehicle.name}
                className="w-full max-w-xs mx-auto h-auto object-contain mb-6"
              />
            )}

            {/* Vehicle Info */}
            <div className="text-center space-y-1">
              <h3 className="text-xl md:text-2xl font-medium text-foreground">
                {profileVehicle.model}
              </h3>
              {profileVehicle.year && (
                <p className="text-muted-foreground">
                  {profileVehicle.year}
                  {profileVehicle.type && ` • ${profileVehicle.type}`}
                </p>
              )}
              <p className="text-xs text-muted-foreground font-mono mt-2">
                {profileVehicle.vin}
              </p>
            </div>
          </div>

          {/* Info text */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            {t.vinLockedInfo || "A jármű a profilban megadott VIN alapján van rögzítve. Módosításhoz látogassa meg a profil beállításait."}
          </p>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => {
              const vehicleId = findVehicleIdFromModel(profileVehicle.model);
              if (vehicleId) onSelect(vehicleId);
            }}
            className="px-8 py-3 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-colors"
          >
            {t.continue || "Tovább"}
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2 text-center">
        {t.selectVehicle}
      </h2>
      <p className="text-muted-foreground font-light mb-8 text-center">
        {t.chooseVehicleModel}
      </p>

      {/* Carousel Container */}
      <div className="relative max-w-2xl mx-auto">
        {/* Navigation Arrows */}
        <button
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-muted/80 hover:bg-muted text-foreground transition-colors -translate-x-2 md:-translate-x-6"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <button
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-muted/80 hover:bg-muted text-foreground transition-colors translate-x-2 md:translate-x-6"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Embla Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {vehicles.map((vehicle, index) => {
              const isActive = index === selectedIndex;
              return (
                <div
                  key={vehicle.id}
                  className="flex-[0_0_100%] min-w-0 px-4"
                >
                  <div
                    className={cn(
                      "flex flex-col items-center py-8 transition-all duration-300",
                      isActive ? "opacity-100 scale-100" : "opacity-40 scale-90"
                    )}
                  >
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="w-full max-w-md h-auto object-contain mb-6"
                      draggable={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vehicle Name */}
        <div className="text-center mt-2">
          <h3 className="text-xl md:text-2xl font-light text-foreground">
            {currentVehicle?.name}
          </h3>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {vehicles.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === selectedIndex
                  ? "bg-foreground w-6"
                  : "bg-foreground/20 hover:bg-foreground/40"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center mt-10">
        <button
          onClick={handleSelect}
          className="px-8 py-3 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-colors"
        >
          {t.continue || "Tovább"}
        </button>
      </div>
    </div>
  );
};

export default VehicleCarousel;
