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
  DoorClosed,
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
import s3xyCommanderImage from "@/assets/products/s3xy-commander.jpg";
import s3xyDashImage from "@/assets/products/s3xy-dash.webp";
import s3xyDashCommanderImage from "@/assets/products/s3xy-dash-commander.webp";
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
      { id: "s3xy_products", icon: Package, vehicleRestriction: [] },
      { id: "softclose", icon: DoorClosed, vehicleRestriction: ["model-3", "model-y"] },
      { id: "seat_ventilation", icon: Fan, vehicleRestriction: [] },
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
  const [selectedStripVariant, setSelectedStripVariant] = useState<string>("");
  const [softcloseDialogOpen, setSoftcloseDialogOpen] = useState(false);
  const [selectedSoftcloseOption, setSelectedSoftcloseOption] = useState<string>("");
  const [commanderInfoOpen, setCommanderInfoOpen] = useState(false);
  const [dashInfoOpen, setDashInfoOpen] = useState(false);
  const [knobInfoOpen, setKnobInfoOpen] = useState(false);
  const [dashCommanderInfoOpen, setDashCommanderInfoOpen] = useState(false);
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
    }).filter(category => category.services.length > 0);
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
                      <img src={s3xyIcon} alt="S3XY" className="w-6 h-6 object-contain dark:invert-0 invert" />
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
                          } else if (service.id === 'softclose') {
                            setSoftcloseDialogOpen(true);
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
                              <img src={s3xyIcon} alt="S3XY" className="w-6 h-6 object-contain dark:invert-0 invert" />
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
          setSelectedStripVariant("");
          setSelectedSoftcloseOption("");
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
            
            {(() => {
              const { vehicleId } = parseVehicleSelection(selectedVehicle);
              const isModelSX = vehicleId === 'model-s' || vehicleId === 'model-x';
              
              return (
                <>
                  {isModelSX && (
                    <div className="p-3 rounded-lg bg-accent/50 border border-accent mb-4">
                      <p className="text-sm text-muted-foreground">
                        {language === "hu" 
                          ? "Model S és X esetében a Commander kizárólag Palladium típusokhoz (2021+) érhető el."
                          : "For Model S and X, Commander is only available for Palladium versions (2021+)."}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {[
                      { id: "commander", hu: "S3XY Commander", en: "S3XY Commander", icon: Gamepad2, price: "89 900 Ft", availableForSX: true, hasInfo: true, infoTarget: "commander" },
                      { id: "knob", hu: "S3XY Knob", en: "S3XY Knob", icon: Circle, price: null, availableForSX: false, hasInfo: true, infoTarget: "knob" },
                      { id: "knob_commander", hu: "S3XY Knob + Commander", en: "S3XY Knob + Commander", icon: Package, price: "145 900 Ft", availableForSX: false, hasInfo: false, infoTarget: "" },
                      { id: "strip", hu: "S3XY Strip", en: "S3XY Strip", icon: Minus, price: "59 900 Ft", availableForSX: false, hasInfo: false, infoTarget: "" },
                      { id: "stalk", hu: "S3XY Stalk", en: "S3XY Stalk", icon: Navigation, price: null, availableForSX: false, hasInfo: false, infoTarget: "" },
                      { id: "dash", hu: "S3XY Dash", en: "S3XY Dash", icon: LayoutDashboard, price: "169 900 Ft", availableForSX: false, hasInfo: true, infoTarget: "dash" },
                      { id: "dash_commander", hu: "S3XY Dash + Commander", en: "S3XY Dash + Commander", icon: Package, price: "204 990 Ft", availableForSX: false, hasInfo: true, infoTarget: "dash_commander" },
                    ].filter(product => {
                      // For Model S/X: only Commander is available
                      if (isModelSX) {
                        return product.availableForSX;
                      }
                      return true;
                    }).map((product) => {
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
                                  if (product.id === 'strip') {
                                    setSelectedStripVariant("");
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
                            {product.hasInfo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (product.infoTarget === "dash") {
                                    setDashInfoOpen(true);
                                  } else if (product.infoTarget === "dash_commander") {
                                    setDashCommanderInfoOpen(true);
                                  } else if (product.infoTarget === "knob") {
                                    setKnobInfoOpen(true);
                                  } else {
                                    setCommanderInfoOpen(true);
                                  }
                                }}
                                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                              >
                                <Info className="w-4 h-4 text-muted-foreground" />
                              </button>
                            )}
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

                          {/* Vehicle variant selector for Strip */}
                          {product.id === 'strip' && isChecked && (
                            <div className="ml-8 p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                              <p className="text-xs text-muted-foreground">
                                {language === "hu" ? "Válassz járműtípust:" : "Select vehicle type:"}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: "model3", label: "Model 3", forVehicle: "model-3" },
                                  { id: "model3_highland", label: "Model 3 Highland", forVehicle: "model-3" },
                                  { id: "modely", label: "Model Y", forVehicle: "model-y" },
                                  { id: "modely_juniper", label: "Model Y Juniper", forVehicle: "model-y" },
                                ].filter(variant => variant.forVehicle === vehicleId).map((variant) => (
                                  <button
                                    key={variant.id}
                                    type="button"
                                    onClick={() => setSelectedStripVariant(variant.id)}
                                    className={cn(
                                      "p-2 text-xs rounded-md border transition-colors text-center",
                                      selectedStripVariant === variant.id
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
                </>
              );
            })()}

            <Button 
              variant="tesla" 
              className="w-full" 
              disabled={
                selectedS3xyProducts.length === 0 || 
                (selectedS3xyProducts.includes('knob_commander') && !selectedS3xyVehicleVariant) ||
                (selectedS3xyProducts.includes('strip') && !selectedStripVariant)
              }
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

      {/* Softclose Dialog */}
      <Dialog open={softcloseDialogOpen} onOpenChange={(open) => {
        setSoftcloseDialogOpen(open);
        if (!open) {
          setSelectedSoftcloseOption("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <DoorClosed className="w-5 h-5" />
              Softclose
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === "hu" 
                ? "Válaszd ki, melyik ajtókra szeretnéd a softclose beszerelését."
                : "Select which doors you want the softclose installed on."}
            </p>
            
            <div className="space-y-2">
              {[
                { id: "front_2", label: language === "hu" ? "Első 2 ajtó" : "Front 2 doors", iconCount: 2, price: "140 000 Ft" },
                { id: "rear_2", label: language === "hu" ? "Hátsó 2 ajtó" : "Rear 2 doors", iconCount: 2, price: "140 000 Ft" },
                { id: "all_4", label: language === "hu" ? "Mind a 4 ajtó" : "All 4 doors", iconCount: 4, price: "250 000 Ft" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedSoftcloseOption(option.id)}
                  className={cn(
                    "w-full p-4 text-sm rounded-lg border transition-colors flex items-center justify-between",
                    selectedSoftcloseOption === option.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted/30 border-border hover:border-foreground/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {Array.from({ length: option.iconCount }).map((_, i) => (
                        <DoorClosed key={i} className="w-4 h-4" />
                      ))}
                    </div>
                    <span>{option.label}</span>
                  </div>
                  <span className="font-medium">{option.price}</span>
                </button>
              ))}
            </div>

            <Button 
              variant="tesla" 
              className="w-full" 
              disabled={!selectedSoftcloseOption}
              onClick={() => {
                onSelect('softclose', { s3xyProducts: [`softclose_${selectedSoftcloseOption}`] });
                setSoftcloseDialogOpen(false);
              }}
            >
              {language === "hu" ? "Tovább a foglaláshoz" : "Continue to booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Commander Info Dialog */}
      <Dialog open={commanderInfoOpen} onOpenChange={setCommanderInfoOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              S3XY Commander
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={s3xyCommanderImage} 
                alt="S3XY Commander" 
                className="w-full h-auto object-cover max-h-40"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "A Commander a teljes S3XY ökoszisztéma agya. Hozzáférést biztosít az összes funkcióhoz, automatizációhoz és valós idejű statisztikához."
                : "The Commander is the brain behind the entire S3XY ecosystem. It gives you access to all features, automations, and real-time stats."}
            </p>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <p className="text-xs font-medium">
                {language === "hu" ? "Ár beszereléssel:" : "Price with installation:"} 89 900 Ft
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCommanderInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Knob Info Dialog */}
      <Dialog open={knobInfoOpen} onOpenChange={setKnobInfoOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <Circle className="w-4 h-4" />
              S3XY Knob
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "Az S3XY Knob egy elegáns, többfunkciós vezérlő, amely zökkenőmentesen integrálható a Tesla Model 3 és Model Y járművekbe."
                : "The S3XY Knob is an elegant, multi-function controller that integrates seamlessly into Tesla Model 3 and Model Y vehicles."}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "80+ választható funkció" : "80+ selectable functions"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "5 egyedileg konfigurálható vezérlőoldal" : "5 custom configurable control pages"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Egyetlen mozdulattal elérhető műveletek" : "One-touch accessible operations"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Vezetés közbeni figyelemelvonás nélkül" : "No distraction while driving"}
              </li>
            </ul>
            <div className="pt-2 border-t border-border flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setKnobInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Dash Info Dialog */}
      <Dialog open={dashInfoOpen} onOpenChange={setDashInfoOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              S3XY Dash
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={s3xyDashImage} 
                alt="S3XY Dash" 
                className="w-full h-auto object-cover max-h-40"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "Az S3XY Dash egy intelligens, teljes mértékben testreszabható kiegészítő műszerfal, amely támogatja az Apple CarPlay és az Android Auto rendszereket. Tökéletesen illeszkedik minden Tesla Model 3 és Model Y járműhöz, beleértve a Highland és Juniper verziókat is."
                : "The S3XY Dash is an intelligent, fully customizable auxiliary dashboard supporting Apple CarPlay and Android Auto. It fits perfectly in every Tesla Model 3 and Model Y, including Highland and Juniper versions."}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Apple CarPlay és Android Auto" : "Apple CarPlay and Android Auto"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "50+ járműfunkció vezérlése" : "Control 50+ vehicle functions"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Valós idejű menetadatok" : "Real-time driving data"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Testreszabható felület" : "Customizable interface"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "OTA frissítések" : "OTA updates"}
              </li>
            </ul>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <p className="text-xs font-medium">
                {language === "hu" ? "Termék ára beszereléssel:" : "Price with installation:"} 169 900 Ft
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDashInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* S3XY Dash + Commander Info Dialog */}
      <Dialog open={dashCommanderInfoOpen} onOpenChange={setDashCommanderInfoOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              S3XY Dash + Commander
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img 
                src={s3xyDashCommanderImage} 
                alt="S3XY Dash + Commander" 
                className="w-full h-auto object-cover max-h-40"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "hu" 
                ? "Az S3XY Dash egy intelligens, teljes mértékben testreszabható kiegészítő műszerfal, amely támogatja az Apple CarPlay és az Android Auto rendszereket. Tökéletesen illeszkedik minden Tesla Model 3 és Model Y járműhöz, beleértve a Highland és Juniper verziókat is."
                : "The S3XY Dash is an intelligent, fully customizable auxiliary dashboard supporting Apple CarPlay and Android Auto. Fits every Tesla Model 3 and Model Y, including Highland and Juniper versions."}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Apple CarPlay és Android Auto" : "Apple CarPlay and Android Auto"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "50+ járműfunkció vezérlése" : "Control 50+ vehicle functions"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Valós idejű menetadatok" : "Real-time driving data"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "Testreszabható felület és sebességmérő" : "Customizable interface and speedometer"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {language === "hu" ? "OTA frissítések" : "OTA updates"}
              </li>
            </ul>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <p className="text-xs font-medium">
                {language === "hu" ? "Termék ára beszereléssel:" : "Price with installation:"} 204 990 Ft
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDashCommanderInfoOpen(false)}
              >
                {language === "hu" ? "Bezárás" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceSelector;
