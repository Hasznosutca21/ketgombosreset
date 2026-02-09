import { useState, useMemo } from "react";
import { 
  Wrench, 
  Zap, 
  Settings, 
  Disc, 
  Shield, 
  Thermometer, 
  Fan, 
  Flame,
  Lightbulb,
  MonitorPlay,
  CircleDot,
  Info,
  Donut,
  ArrowLeft,
  ChevronDown,
  DoorOpen,
  Package,
  Battery,
  Gamepad2,
  Circle,
  Minus,
  Navigation,
  LayoutDashboard,
  LucideIcon
} from "lucide-react";
import s3xyIcon from "@/assets/s3xy-icon.png";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import DoorHandleSelector from "@/components/DoorHandleSelector";

interface ServiceSelectorProps {
  onSelect: (service: string, extras?: { doorHandles?: string[]; trunkLightNotWorking?: boolean; s3xyProducts?: string[] }) => void;
  selected: string | null;
  selectedVehicle?: string | null;
  onBack?: () => void;
}

// Categories with their services
// vehicleRestriction: array of vehicle IDs that can use this service (empty = all vehicles)
// yearRestriction: { from, to } - optional year range restriction
interface ServiceDef {
  id: string;
  icon: typeof Wrench;
  vehicleRestriction: string[];
  yearRestriction?: { from: number; to: number };
}

const categories: { id: string; icon: typeof Wrench; services: ServiceDef[]; vehicleRestriction?: string[] }[] = [
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
      { id: "heatpump", icon: Thermometer, vehicleRestriction: ["model-3"], yearRestriction: { from: 2020, to: 2026 } },
      { id: "heating", icon: Flame, vehicleRestriction: ["model-3", "model-y"] },
      { id: "hepa", icon: Fan, vehicleRestriction: ["model-y"] },
      { id: "ptcheater", icon: Zap, vehicleRestriction: ["model-3"], yearRestriction: { from: 2018, to: 2020 } },
    ],
  },
  {
    id: "extras",
    icon: Settings,
    services: [
      { id: "software", icon: Donut, vehicleRestriction: ["model-3"] },
      { id: "autopilot", icon: Lightbulb, vehicleRestriction: ["model-3"] },
      { id: "multimedia", icon: MonitorPlay, vehicleRestriction: [] },
    ],
  },
  {
    id: "batteryCategory",
    icon: Battery,
    services: [
      { id: "lowvoltagebattery", icon: Battery, vehicleRestriction: ["model-3", "model-y"] },
    ],
    vehicleRestriction: ["model-3", "model-y"],
  },
  {
    id: "other",
    icon: Shield,
    services: [
      { id: "doorhandle", icon: DoorOpen, vehicleRestriction: ["model-3"] },
      { id: "body", icon: Package, vehicleRestriction: ["model-3"] },
      { id: "canbus", icon: Settings, vehicleRestriction: ["model-y"] },
      { id: "warranty", icon: Shield, vehicleRestriction: ["model-3"] },
      { id: "tires", icon: CircleDot, vehicleRestriction: [] },
    ],
  },
  {
    id: "accessories",
    icon: Package,
    services: [
      { id: "s3xy_products", icon: Package, vehicleRestriction: ["model-3", "model-y"] },
    ],
  },
];

const ServiceSelector = ({ onSelect, selected, selectedVehicle, onBack }: ServiceSelectorProps) => {
  const { t, language } = useLanguage();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [doorHandleDialogOpen, setDoorHandleDialogOpen] = useState(false);
  const [selectedDoorHandles, setSelectedDoorHandles] = useState<string[]>([]);
  const [trunkDialogOpen, setTrunkDialogOpen] = useState(false);
  const [trunkLightNotWorking, setTrunkLightNotWorking] = useState(false);
  const [s3xyDialogOpen, setS3xyDialogOpen] = useState(false);
  const [selectedS3xyProducts, setSelectedS3xyProducts] = useState<string[]>([]);
  const [selectedS3xyVehicleVariant, setSelectedS3xyVehicleVariant] = useState<string>("");
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

  // Parse vehicle ID and year from selectedVehicle (format: "model-3-2022")
  const parseVehicleSelection = (vehicle: string | null | undefined) => {
    if (!vehicle) return { vehicleId: null, year: null };
    const parts = vehicle.split('-');
    if (parts.length >= 3) {
      const year = parseInt(parts[parts.length - 1], 10);
      const vehicleId = parts.slice(0, -1).join('-');
      return { vehicleId, year: isNaN(year) ? null : year };
    }
    return { vehicleId: vehicle, year: null };
  };

  // Filter categories to only show services available for the selected vehicle
  const filteredCategories = useMemo(() => {
    const { vehicleId } = parseVehicleSelection(selectedVehicle);
    
    return categories.map(category => {
      // Check category-level vehicle restriction
      if (category.vehicleRestriction && category.vehicleRestriction.length > 0) {
        if (!vehicleId || !category.vehicleRestriction.includes(vehicleId)) {
          return { ...category, services: [] };
        }
      }
      
      return {
        ...category,
        services: category.services.filter(service => {
          // Check vehicle restriction
          if (service.vehicleRestriction.length > 0) {
            if (!vehicleId || !service.vehicleRestriction.includes(vehicleId)) {
              return false;
            }
          }
          
          return true;
        })
      };
    }).filter(category => category.services.length > 0 || (category.vehicleRestriction && category.vehicleRestriction.length > 0)); // Keep categories with vehicle restriction even if empty
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
                    {category.id === 'accessories' ? (
                      <img src={s3xyIcon} alt="S3XY" className="w-6 h-6 object-contain" />
                    ) : (
                      <CategoryIcon className="w-5 h-5" />
                    )}
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
                        onClick={() => {
                          if (service.id === 'doorhandle') {
                            setDoorHandleDialogOpen(true);
                          } else if (service.id === 'body') {
                            setTrunkDialogOpen(true);
                          } else if (service.id === 's3xy_products') {
                            setS3xyDialogOpen(true);
                          } else {
                            onSelect(service.id);
                          }
                        }}
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
                            {service.id === 's3xy_products' ? (
                              <img src={s3xyIcon} alt="S3XY" className="w-6 h-6 object-contain" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
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

      {/* Door Handle Selector Dialog */}
      <Dialog open={doorHandleDialogOpen} onOpenChange={setDoorHandleDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <DoorOpen className="w-5 h-5" />
              {language === "hu" ? "Kilincs csere" : "Door Handle Replacement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "hu" 
                ? "Jelölje be, melyik kilincs(ek) sérültek és cserére szorulnak."
                : "Select which door handle(s) are damaged and need replacement."}
            </p>
            
            <DoorHandleSelector
              value={selectedDoorHandles}
              onChange={setSelectedDoorHandles}
            />

            <Button 
              variant="tesla" 
              className="w-full" 
              disabled={selectedDoorHandles.length === 0}
              onClick={() => {
                onSelect('doorhandle', { doorHandles: selectedDoorHandles });
                setDoorHandleDialogOpen(false);
              }}
            >
              {language === "hu" ? "Tovább a foglaláshoz" : "Continue to booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trunk Lid Issue Dialog */}
      <Dialog open={trunkDialogOpen} onOpenChange={(open) => {
        setTrunkDialogOpen(open);
        if (!open) setTrunkLightNotWorking(false);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <Package className="w-5 h-5" />
              {language === "hu" ? "Hátsó csomagtérajtó probléma" : "Rear Trunk Lid Issue"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {language === "hu" 
                ? "A kábelköteg szakadása különböző tüneteket okozhat. Kérjük jelezze, ha a lámpa sem működik."
                : "Cable harness breakage can cause various symptoms. Please indicate if the light is also not working."}
            </p>
            
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/30 border border-border">
              <Checkbox 
                id="trunk-light" 
                checked={trunkLightNotWorking}
                onCheckedChange={(checked) => setTrunkLightNotWorking(checked === true)}
              />
              <label 
                htmlFor="trunk-light" 
                className="text-sm font-medium leading-none cursor-pointer select-none"
              >
                {language === "hu" ? "Nem világít a lámpa?" : "Light is not working?"}
              </label>
            </div>

            <Button 
              variant="tesla" 
              className="w-full" 
              onClick={() => {
                onSelect('body', { trunkLightNotWorking });
                setTrunkDialogOpen(false);
              }}
            >
              {language === "hu" ? "Tovább a foglaláshoz" : "Continue to booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Products Dialog */}
      <Dialog open={s3xyDialogOpen} onOpenChange={(open) => {
        setS3xyDialogOpen(open);
        if (!open) {
          setSelectedS3xyProducts([]);
          setSelectedS3xyVehicleVariant("");
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <Package className="w-5 h-5" />
              {language === "hu" ? "S3XY termékek" : "S3XY Products"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "hu" 
                ? "Válaszd ki a beszerelni kívánt termékeket."
                : "Select the products you want to install."}
            </p>
            
            <div className="space-y-2">
              {[
                { id: "commander", hu: "S3XY Commander", en: "S3XY Commander", icon: Gamepad2, price: null },
                { id: "knob", hu: "S3XY Knob", en: "S3XY Knob", icon: Circle, price: null },
                { id: "knob_commander", hu: "S3XY Knob + Commander", en: "S3XY Knob + Commander", icon: Package, price: "145 900 Ft" },
                { id: "strip", hu: "S3XY Strip", en: "S3XY Strip", icon: Minus, price: null },
                { id: "stalk", hu: "S3XY Stalk", en: "S3XY Stalk", icon: Navigation, price: null },
                { id: "dash", hu: "S3XY Dash", en: "S3XY Dash", icon: LayoutDashboard, price: null },
              ].map((product) => {
                const ProductIcon = product.icon;
                const isChecked = selectedS3xyProducts.includes(product.id);
                return (
                  <div key={product.id} className="space-y-2">
                    <div 
                      className="flex items-center space-x-3 p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox 
                        id={`s3xy-${product.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedS3xyProducts([...selectedS3xyProducts, product.id]);
                          } else {
                            setSelectedS3xyProducts(selectedS3xyProducts.filter(p => p !== product.id));
                            if (product.id === 'knob_commander') {
                              setSelectedS3xyVehicleVariant("");
                            }
                          }
                        }}
                      />
                      <ProductIcon className="w-4 h-4 text-muted-foreground" />
                      <label 
                        htmlFor={`s3xy-${product.id}`}
                        className="text-sm font-medium leading-none cursor-pointer select-none flex-1"
                      >
                        {language === "hu" ? product.hu : product.en}
                      </label>
                      {product.price && (
                        <span className="text-sm font-medium text-foreground">
                          {product.price}
                        </span>
                      )}
                    </div>
                    
                    {/* Vehicle variant selector for Knob + Commander */}
                    {product.id === 'knob_commander' && isChecked && (
                      <div className="ml-8 p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {language === "hu" ? "Válassz járműtípust:" : "Select vehicle type:"}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "model3_facelift", label: "Model 3 Facelift" },
                            { id: "model3_highland", label: "Model 3 Highland" },
                            { id: "modely", label: "Model Y" },
                            { id: "modely_juniper", label: "Model Y Juniper Premium" },
                          ].map((variant) => (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => setSelectedS3xyVehicleVariant(variant.id)}
                              className={cn(
                                "p-2 text-xs rounded-md border transition-colors text-center",
                                selectedS3xyVehicleVariant === variant.id
                                  ? "bg-foreground text-background border-foreground"
                                  : "bg-background border-border hover:border-foreground/50"
                              )}
                            >
                              {variant.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button 
              variant="tesla" 
              className="w-full" 
              disabled={selectedS3xyProducts.length === 0 || (selectedS3xyProducts.includes('knob_commander') && !selectedS3xyVehicleVariant)}
              onClick={() => {
                onSelect('s3xy_products', { s3xyProducts: selectedS3xyProducts });
                setS3xyDialogOpen(false);
              }}
            >
              {language === "hu" ? "Tovább a foglaláshoz" : "Continue to booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceSelector;
