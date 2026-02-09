import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const VehicleCarousel = ({ onSelect, selected }: VehicleCarouselProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

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

  // Load vehicle from profile and auto-select
  useEffect(() => {
    const loadProfileVehicle = async () => {
      if (!user || hasAutoSelected) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("vehicle_model")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.vehicle_model) {
          const vehicleId = findVehicleIdFromModel(profile.vehicle_model);
          if (vehicleId) {
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
          Tovább
        </button>
      </div>
    </div>
  );
};

export default VehicleCarousel;
