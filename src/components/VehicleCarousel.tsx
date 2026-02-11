import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import modelSImage from "@/assets/vehicles/model-s.png";
import model3Image from "@/assets/vehicles/model-3.png";
import modelXImage from "@/assets/vehicles/model-x.png";
import modelYImage from "@/assets/vehicles/model-y.png";
import optimusFigures from "@/assets/optimus-figures.png";

interface VehicleCarouselProps {
  onSelect: (vehicle: string) => void;
  selected: string | null;
}

const vehicleData = [
  { id: "model-s", name: "Model S", image: modelSImage, description: "Prémium szedán" },
  { id: "model-3", name: "Model 3", image: model3Image, description: "A legnépszerűbb, főleg fehérben" },
  { id: "model-x", name: "Model X", image: modelXImage, description: "SUV" },
  { id: "model-y", name: "Model Y", image: modelYImage, description: "Kompakt SUV" },
];

const VehicleCarousel = ({ onSelect, selected }: VehicleCarouselProps) => {
  const { t } = useLanguage();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedId, setSelectedId] = useState<string | null>(selected);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect(id);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-center mb-4">
        <img src={optimusFigures} alt="Tesla Optimus" className="h-24 md:h-32 w-auto object-contain opacity-90" />
      </div>
      <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2 text-center">{t.selectVehicle}</h2>
      <p className="text-muted-foreground font-light mb-10 text-center">{t.chooseVehicleModel}</p>

      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {vehicleData.map((vehicle) => {
              const isSelected = selectedId === vehicle.id;
              return (
                <div key={vehicle.id} className="flex-[0_0_70%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 px-2">
                  <button
                    onClick={() => handleSelect(vehicle.id)}
                    className={cn(
                      "w-full flex flex-col items-center p-4 md:p-6 rounded-2xl border-2 transition-all bg-card hover:bg-muted/50",
                      isSelected ? "border-foreground shadow-lg" : "border-border hover:border-foreground/30"
                    )}
                  >
                    {isSelected && (
                      <div className="self-start w-6 h-6 rounded-full bg-foreground flex items-center justify-center mb-2">
                        <Check className="w-4 h-4 text-background" />
                      </div>
                    )}
                    <div className="w-full aspect-[16/10] mb-4 flex items-center justify-center">
                      <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen opacity-90" />
                    </div>
                    <h3 className="text-lg font-semibold">{vehicle.name}</h3>
                    <p className="text-sm text-muted-foreground">{vehicle.description}</p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <Button variant="outline" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full hidden md:flex" onClick={scrollPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full hidden md:flex" onClick={scrollNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default VehicleCarousel;
