import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Car, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { TESLA_COLORS } from "@/components/VehicleColorSelector";

// Import vehicle images
import modelSImage from "@/assets/vehicles/model-s.png";
import model3Image from "@/assets/vehicles/model-3.png";
import modelXImage from "@/assets/vehicles/model-x.png";
import modelYImage from "@/assets/vehicles/model-y.png";

interface VehicleCarouselProps {
  onSelect: (vehicle: string) => void;
  selected: string | null;
}

const defaultVehicles = [
  { id: "model-s", name: "Model S", image: modelSImage },
  { id: "model-3", name: "Model 3", image: model3Image },
  { id: "model-x", name: "Model X", image: modelXImage },
  { id: "model-y", name: "Model Y", image: modelYImage },
];

const getVehicleImage = (modelName: string): string => {
  const normalized = modelName.toLowerCase().trim();
  if (normalized.includes('model s')) return modelSImage;
  if (normalized.includes('model 3')) return model3Image;
  if (normalized.includes('model x')) return modelXImage;
  if (normalized.includes('model y')) return modelYImage;
  return model3Image; // fallback
};

const findVehicleIdFromModel = (modelName: string): string | null => {
  const normalized = modelName.toLowerCase().trim();
  for (const vehicle of defaultVehicles) {
    if (vehicle.name.toLowerCase() === normalized) return vehicle.id;
  }
  if (normalized.includes('model s')) return 'model-s';
  if (normalized.includes('model 3')) return 'model-3';
  if (normalized.includes('model x')) return 'model-x';
  if (normalized.includes('model y')) return 'model-y';
  return null;
};

interface UserVehicle {
  id: string;
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

const getColorHex = (colorId: string | null): string | null => {
  if (!colorId) return null;
  const color = TESLA_COLORS.find(c => c.id === colorId);
  return color?.hex || null;
};

const VehicleCarousel = ({ onSelect, selected }: VehicleCarouselProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [userVehicles, setUserVehicles] = useState<UserVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserVehicles, setShowUserVehicles] = useState(false);
  const [selectedUserVehicle, setSelectedUserVehicle] = useState<UserVehicle | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

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

  // Load user vehicles from the new vehicles table
  useEffect(() => {
    const loadUserVehicles = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: vehicles } = await supabase
          .from("vehicles")
          .select("*")
          .eq("user_id", user.id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true });

        // Generate signed URLs for private bucket images
        const vehiclesWithSignedUrls = vehicles ? await Promise.all(
          (vehicles as UserVehicle[]).map(async (v) => {
            if (v.image_url) {
              const match = v.image_url.match(/vehicle-images\/(.+)$/);
              if (match) {
                const { data } = await supabase.storage
                  .from("vehicle-images")
                  .createSignedUrl(match[1], 3600);
                if (data?.signedUrl) {
                  return { ...v, image_url: data.signedUrl };
                }
              }
            }
            return v;
          })
        ) : [];

        if (vehiclesWithSignedUrls.length >= 2) {
          setUserVehicles(vehiclesWithSignedUrls);
          setShowUserVehicles(true);
          
          const primary = vehiclesWithSignedUrls.find(v => v.is_primary) || vehiclesWithSignedUrls[0];
          if (primary) {
            setSelectedUserVehicle(primary);
          }
        } else if (vehiclesWithSignedUrls.length === 1) {
          const singleVehicle = vehiclesWithSignedUrls[0];
          if (singleVehicle.vin && singleVehicle.vin.length === 17) {
            setUserVehicles([singleVehicle]);
            setSelectedUserVehicle(singleVehicle);
            setShowUserVehicles(true);
          } else {
            const vehicleId = findVehicleIdFromModel(singleVehicle.model);
            if (vehicleId && emblaApi && !hasAutoSelected) {
              const index = defaultVehicles.findIndex(v => v.id === vehicleId);
              if (index !== -1) {
                emblaApi.scrollTo(index, true);
                setSelectedIndex(index);
              }
              setHasAutoSelected(true);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user vehicles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserVehicles();
  }, [user, emblaApi, hasAutoSelected]);

  const handleSelectFromCarousel = () => {
    const vehicle = defaultVehicles[selectedIndex];
    if (vehicle) {
      onSelect(vehicle.id);
    }
  };

  const handleSelectUserVehicle = (vehicle: UserVehicle) => {
    setSelectedUserVehicle(vehicle);
  };

  const handleContinueWithUserVehicle = () => {
    if (selectedUserVehicle) {
      const vehicleId = findVehicleIdFromModel(selectedUserVehicle.model);
      if (vehicleId) {
        onSelect(vehicleId);
      }
    }
  };

  const currentVehicle = defaultVehicles[selectedIndex];

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  // Show user's saved vehicles if they have 2+
  if (showUserVehicles && userVehicles.length >= 1) {
    return (
      <div className="animate-fade-in">
        <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2 text-center">
          {userVehicles.length >= 2 
            ? (language === "hu" ? "Válassz járművet" : "Select Your Vehicle")
            : (t.yourVehicle || "Az Ön járműve")}
        </h2>
        <p className="text-muted-foreground font-light mb-8 text-center">
          {userVehicles.length >= 2 
            ? (language === "hu" ? "Melyik autóhoz szeretnél időpontot foglalni?" : "Which car would you like to book an appointment for?")
            : (t.vinLockedVehicle || "VIN alapján azonosítva")}
        </p>

        {/* User Vehicles Grid/List */}
        <div className={cn(
          "max-w-2xl mx-auto",
          userVehicles.length >= 2 ? "grid gap-4" : "",
          userVehicles.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "",
          userVehicles.length >= 3 ? "grid-cols-1 sm:grid-cols-3" : ""
        )}>
          {userVehicles.map((vehicle) => {
            const isSelected = selectedUserVehicle?.id === vehicle.id;
            const vehicleImage = vehicle.image_url || getVehicleImage(vehicle.model);

            return (
              <button
                key={vehicle.id}
                onClick={() => handleSelectUserVehicle(vehicle)}
                className={cn(
                  "relative bg-card border rounded-xl p-4 md:p-6 transition-all duration-200 text-left",
                  isSelected 
                    ? "border-foreground ring-2 ring-foreground/20" 
                    : "border-border hover:border-foreground/50"
                )}
              >
                {/* Primary Badge */}
                {vehicle.is_primary && userVehicles.length >= 2 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{language === "hu" ? "Elsődleges" : "Primary"}</span>
                  </div>
                )}

                {/* VIN Lock Badge */}
                {vehicle.vin && vehicle.vin.length === 17 && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                  </div>
                )}

                {/* Vehicle Image with Color Filter */}
                <div className="flex justify-center mb-4">
                  <img
                    src={vehicleImage}
                    alt={vehicle.model}
                    className="w-full max-w-[180px] h-auto object-contain transition-all duration-300"
                  />
                </div>

                {/* Vehicle Info */}
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    {vehicle.color && (
                      <div 
                        className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                        style={{ backgroundColor: getColorHex(vehicle.color) || undefined }}
                        title={TESLA_COLORS.find(c => c.id === vehicle.color)?.name[language] || ""}
                      />
                    )}
                    <h3 className="text-lg font-medium text-foreground">
                      {vehicle.display_name || vehicle.model}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    {vehicle.display_name && <span>{vehicle.model}</span>}
                    {vehicle.year && <span>{vehicle.year}</span>}
                    {vehicle.type && <span>• {vehicle.type}</span>}
                  </div>
                  {vehicle.plate && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {vehicle.plate}
                    </p>
                  )}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-xl ring-2 ring-foreground pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {/* Switch to Standard Selection Link */}
        {userVehicles.length >= 2 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            {language === "hu" ? "Más autó? " : "Different car? "}
            <button 
              onClick={() => setShowUserVehicles(false)}
              className="underline hover:text-foreground transition-colors"
            >
              {language === "hu" ? "Válassz a listából" : "Choose from list"}
            </button>
          </p>
        )}

        {/* Continue Button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={handleContinueWithUserVehicle}
            disabled={!selectedUserVehicle}
            className="px-8 py-3 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.continue || "Tovább"}
          </button>
        </div>
      </div>
    );
  }

  // Standard carousel for users without saved vehicles or choosing to browse
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2 text-center">
        {t.selectVehicle}
      </h2>
      <p className="text-muted-foreground font-light mb-8 text-center">
        {t.chooseVehicleModel}
      </p>

      {/* Back to Saved Vehicles Link */}
      {userVehicles.length >= 2 && (
        <p className="text-center text-xs text-muted-foreground mb-6">
          <button 
            onClick={() => setShowUserVehicles(true)}
            className="underline hover:text-foreground transition-colors"
          >
            {language === "hu" ? "← Vissza a mentett járművekhez" : "← Back to saved vehicles"}
          </button>
        </p>
      )}

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
            {defaultVehicles.map((vehicle, index) => {
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
          {defaultVehicles.map((_, index) => (
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
          onClick={handleSelectFromCarousel}
          className="px-8 py-3 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-colors"
        >
          {t.continue || "Tovább"}
        </button>
      </div>
    </div>
  );
};

export default VehicleCarousel;
