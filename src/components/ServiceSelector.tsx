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
  ArrowLeft
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
      
      <h2 className="text-2xl md:text-3xl font-bold mb-2">{t.selectService}</h2>
      <p className="text-muted-foreground mb-8">{t.chooseServiceType}</p>

      <Accordion 
        type="multiple" 
        defaultValue={getDefaultOpenCategory()}
        className="space-y-4"
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
                "glass-card border-border/50 rounded-xl overflow-hidden",
                hasSelectedService && "border-primary/50 shadow-[0_0_20px_-10px_hsl(352_85%_49%/0.3)]"
              )}
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    hasSelectedService ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">{categoryData.title}</h3>
                    <p className="text-sm text-muted-foreground">{categoryData.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
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
                          "p-4 text-left rounded-lg transition-all duration-200 border relative",
                          "hover:scale-[1.02] hover:border-primary/50",
                          isSelected 
                            ? "bg-primary/10 border-primary shadow-[0_0_20px_-10px_hsl(352_85%_49%/0.4)]" 
                            : "bg-muted/30 border-border/30 hover:bg-muted/50"
                        )}
                      >
                        {hasDetails && (
                          <div
                            onClick={(e) => handleInfoClick(e, service.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex flex-col items-center text-center gap-2">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-0.5">{serviceData.title}</h4>
                            <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{serviceData.description}</p>
                            <div className="flex flex-col gap-0.5">
                              <div className="text-xs text-muted-foreground/70">
                                {t.estTime}: {serviceData.duration}
                              </div>
                              {hasPrice && (
                                <div className="text-sm font-semibold text-primary">
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
            <DialogTitle className="text-xl">{selectedDetails?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {t.estTime}: {selectedDetails?.duration}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedDetails?.details?.split('\n').map((line, i) => (
                <p key={i} className={cn(
                  "text-sm",
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
