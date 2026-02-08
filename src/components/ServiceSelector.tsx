import { useState, useMemo } from "react";
import { 
  Wrench, 
  Zap, 
  Settings, 
  Disc, 
  Shield, 
  Paintbrush, 
  Thermometer, 
  Fan, 
  Flame,
  Lightbulb,
  MonitorPlay,
  CircleDot,
  Info,
  Donut,
  ArrowLeft,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ServiceSelectorProps {
  onSelect: (service: string) => void;
  selected: string | null;
  selectedVehicle?: string | null;
  onBack?: () => void;
}

// Categories with their services
// vehicleRestriction: array of vehicle IDs that can use this service (empty = all vehicles)
const categories = [
  {
    id: "maintenance",
    icon: Wrench,
    services: [
      { id: "maintenance", icon: Wrench, vehicleRestriction: [] },
      { id: "battery", icon: Zap, vehicleRestriction: [] },
      { id: "brake", icon: Disc, vehicleRestriction: [] },
    ],
  },
  {
    id: "hvac",
    icon: Thermometer,
    services: [
      { id: "ac", icon: Fan, vehicleRestriction: [] },
      { id: "heatpump", icon: Thermometer, vehicleRestriction: [] },
      { id: "heating", icon: Flame, vehicleRestriction: [] },
    ],
  },
  {
    id: "extras",
    icon: Settings,
    services: [
      { id: "software", icon: Donut, vehicleRestriction: ["model-3"] }, // Boombox - only Model 3
      { id: "autopilot", icon: Lightbulb, vehicleRestriction: ["model-3"] }, // Interior lighting - only Model 3
      { id: "multimedia", icon: MonitorPlay, vehicleRestriction: [] },
    ],
  },
  {
    id: "other",
    icon: Shield,
    services: [
      { id: "body", icon: Paintbrush, vehicleRestriction: [] },
      { id: "warranty", icon: Shield, vehicleRestriction: [] },
      { id: "tires", icon: CircleDot, vehicleRestriction: [] },
    ],
  },
];

const ServiceSelector = ({ onSelect, selected, selectedVehicle, onBack }: ServiceSelectorProps) => {
  const { t } = useLanguage();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<{
    title: string;
    details: string;
    duration: string;
  } | null>(null);

  // Find which category contains the selected service
  const getDefaultOpenCategory = () => {
    if (!selected) return ["maintenance"]; // Default open first category
    for (const category of categories) {
      if (category.services.some(s => s.id === selected)) {
        return [category.id];
      }
    }
    return ["maintenance"];
  };

  const handleInfoClick = (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation();
    const serviceData = t.services[serviceId as keyof typeof t.services] as {
      title: string;
      description: string;
      duration: string;
      details?: string;
    };
    if (serviceData.details) {
      setSelectedDetails({
        title: serviceData.title,
        details: serviceData.details,
        duration: serviceData.duration,
      });
      setDetailsOpen(true);
    }
  };

  // Filter categories to only show services available for the selected vehicle
  const filteredCategories = useMemo(() => {
    return categories.map(category => ({
      ...category,
      services: category.services.filter(service => {
        // If no restriction, available for all vehicles
        if (service.vehicleRestriction.length === 0) return true;
        // If restriction exists, check if selected vehicle is in the list
        return selectedVehicle ? service.vehicleRestriction.includes(selectedVehicle) : true;
      })
    })).filter(category => category.services.length > 0); // Remove empty categories
  }, [selectedVehicle]);

  return (
    <div className="animate-fade-in">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </Button>
      )}
      
      <h2 className="text-2xl md:text-4xl font-extralight tracking-tight mb-2">{t.selectService}</h2>
      <p className="text-muted-foreground font-light mb-8">{t.chooseServiceType}</p>

      <Accordion 
        type="multiple" 
        defaultValue={getDefaultOpenCategory()}
        className="space-y-3"
      >
        {filteredCategories.map((category) => {
          const categoryData = t.serviceCategories[category.id as keyof typeof t.serviceCategories];
          const hasSelectedService = category.services.some(s => s.id === selected);
          const CategoryIcon = category.icon;
          
          return (
            <AccordionItem 
              key={category.id} 
              value={category.id}
              className={cn(
                "tesla-card border overflow-hidden",
                hasSelectedService && "border-foreground"
              )}
            >
              <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]>div>.chevron]:rotate-180">
                <div className="flex items-center gap-4 w-full">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    hasSelectedService ? "bg-foreground text-background" : "bg-muted"
                  )}>
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-medium">{categoryData.title}</h3>
                    <p className="text-sm text-muted-foreground font-light">{categoryData.description}</p>
                  </div>
                  <ChevronDown className="chevron w-5 h-5 text-muted-foreground transition-transform duration-200" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {category.services.map((service) => {
                    const Icon = service.icon;
                    const isSelected = selected === service.id;
                    const serviceData = t.services[service.id as keyof typeof t.services] as {
                      title: string;
                      description: string;
                      duration: string;
                      details?: string;
                      price?: string;
                    };
                    const hasDetails = !!serviceData.details;
                    const hasPrice = !!serviceData.price;

                    return (
                      <button
                        key={service.id}
                        onClick={() => onSelect(service.id)}
                        className={cn(
                          "p-5 text-left rounded-lg transition-all duration-200 border relative",
                          isSelected 
                            ? "bg-foreground text-background border-foreground" 
                            : "bg-muted/30 border-border hover:border-foreground/30 hover:bg-muted/50"
                        )}
                      >
                        {hasDetails && (
                          <div
                            onClick={(e) => handleInfoClick(e, service.id)}
                            className={cn(
                              "absolute top-3 right-3 p-1.5 rounded-full transition-colors cursor-pointer",
                              isSelected 
                                ? "bg-background/20 hover:bg-background/30 text-background" 
                                : "bg-muted hover:bg-foreground/10"
                            )}
                          >
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex flex-col items-center text-center gap-3">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                              isSelected ? "bg-background/20 text-background" : "bg-muted"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-1">{serviceData.title}</h4>
                            <p className={cn(
                              "text-xs mb-2 line-clamp-2",
                              isSelected ? "text-background/70" : "text-muted-foreground"
                            )}>
                              {serviceData.description}
                            </p>
                            <div className="flex flex-col gap-0.5">
                              <div className={cn(
                                "text-xs",
                                isSelected ? "text-background/60" : "text-muted-foreground"
                              )}>
                                {t.estTime}: {serviceData.duration}
                              </div>
                              {hasPrice && (
                                <div className={cn(
                                  "text-sm font-medium mt-1",
                                  isSelected ? "text-background" : "text-foreground"
                                )}>
                                  {serviceData.price}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">{selectedDetails?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {t.estTime}: {selectedDetails?.duration}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedDetails?.details?.split('\n').map((line, i) => (
                <p key={i} className={cn(
                  "text-sm leading-relaxed",
                  line.startsWith('•') && "ml-2"
                )}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceSelector;
